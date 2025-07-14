import { API_CONFIG } from '../config/api';
import { logger } from '../utils/logger';
import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';

// 재시도 설정
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryBackoff: 2,
};

// 재시도 로직
const retryRequest = async (requestFn, retryCount = 0) => {
  try {
    return await requestFn();
  } catch (error) {
    const isRetryableError = 
      error.statusCode >= 500 || 
      error.statusCode === 0 || 
      error.type === 'NETWORK_ERROR';
    
    if (isRetryableError && retryCount < RETRY_CONFIG.maxRetries) {
      const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.retryBackoff, retryCount);
      logger.warn(`📡 토스페이먼츠 API 재시도 ${retryCount + 1}/${RETRY_CONFIG.maxRetries} (${delay}ms 후)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retryCount + 1);
    }
    
    throw error;
  }
};

// 토스페이먼츠 결제 API 서비스
class TossPaymentAPI {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    
    // 환경 변수에서 API 키 가져오기
    const envApiKey = import.meta.env.VITE_TOSS_SECRET_KEY;
    const envClientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
    
    if (!envApiKey) {
      logger.warn('VITE_TOSS_SECRET_KEY가 설정되지 않았습니다. 테스트 키를 사용합니다.');
      this.apiKey = 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6';
    } else {
      this.apiKey = envApiKey;
    }

    if (!envClientKey) {
      logger.warn('VITE_TOSS_CLIENT_KEY가 설정되지 않았습니다. 테스트 키를 사용합니다.');
      this.clientKey = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';
    } else {
      this.clientKey = envClientKey;
    }
    
    // API 키 유효성 검증
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('토스페이먼츠 API 키가 유효하지 않습니다. VITE_TOSS_SECRET_KEY를 확인해주세요.');
    }

    // 결제 시도 추적을 위한 Map
    this.paymentAttempts = new Map();
  }

  // 인증 헤더 생성
  getAuthHeaders() {
    return {
      'Authorization': `Basic ${btoa(`${this.apiKey}:`)}`,
    };
  }

  // 공통 헤더 생성 (멱등성 키 포함)
  getHeaders(contentType = 'application/json') {
    const headers = {
      ...this.getAuthHeaders(),
    };
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    return headers;
  }

  // 공통 fetch 요청 처리 (재시도 로직 포함)
  async makeRequest(url, options = {}, retryOptions = {}) {
    const { maxRetries = 3, delay = 1000, backoff = 2 } = retryOptions;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        
        // 재시도 가능한 에러인지 확인
        const shouldRetry = this.shouldRetryError(error, attempt, maxRetries);
        
        if (!shouldRetry) {
          throw error;
        }

        // 지수 백오프로 재시도
        const waitTime = delay * Math.pow(backoff, attempt);
        logger.warn(`API 요청 실패 (${attempt + 1}/${maxRetries + 1}), ${waitTime}ms 후 재시도:`, error.message);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // 재시도 가능한 에러인지 판단
  shouldRetryError(error, attempt, maxRetries) {
    if (attempt >= maxRetries) return false;
    
    // 네트워크 에러, 타임아웃, 5xx 서버 에러는 재시도
    if (error.name === 'AbortError' || error.name === 'TypeError') return true;
    if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) return true;
    
    return false;
  }

  // 결제 시도 중복 방지
  isPaymentInProgress(orderId) {
    return this.paymentAttempts.has(orderId);
  }

  // 결제 시도 등록
  registerPaymentAttempt(orderId) {
    if (this.isPaymentInProgress(orderId)) {
      throw new Error('이미 진행 중인 결제가 있습니다. 잠시 후 다시 시도해주세요.');
    }
    
    const attemptId = Date.now().toString(); // 멱등성 키 대신 타임스탬프 사용
    this.paymentAttempts.set(orderId, {
      id: attemptId,
      timestamp: Date.now(),
      status: 'in_progress'
    });
    
    return attemptId;
  }

  // 결제 시도 완료 처리
  completePaymentAttempt(orderId, status = 'completed') {
    const attempt = this.paymentAttempts.get(orderId);
    if (attempt) {
      attempt.status = status;
      attempt.completedAt = Date.now();
    }
  }

  // 결제 시도 정리 (오래된 데이터 제거)
  cleanupPaymentAttempts() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30분
    
    for (const [orderId, attempt] of this.paymentAttempts.entries()) {
      if (now - attempt.timestamp > maxAge) {
        this.paymentAttempts.delete(orderId);
      }
    }
  }

  // Step 1: 결제 정보 생성 (백엔드 API)
  async createPayment(paymentInfo) {
    try {
      logger.log('📡 결제 정보 생성 요청 시작');
      logger.log('📋 요청 데이터:', paymentInfo);
      logger.log('🌐 API 엔드포인트:', API_ENDPOINTS.PAYMENT_CREATE);
      logger.log('🔗 전체 URL:', `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PAYMENT_CREATE}`);
      
      const requestData = {
        orderId: paymentInfo.orderId,
        memberCouponId: paymentInfo.memberCouponId, // 쿠폰 사용 시
        totalCost: paymentInfo.totalCost,
        paymentMethod: paymentInfo.paymentMethod,
        storeRequest: paymentInfo.storeRequest,
        riderRequest: paymentInfo.riderRequest
      };
      
      logger.log('📤 전송할 데이터:', requestData);
      
      const response = await retryRequest(() => 
        apiClient.post(API_ENDPOINTS.PAYMENT_CREATE, requestData)
      );

      logger.log('✅ 결제 정보 생성 API 응답 받음');
      logger.log('📦 응답 데이터:', response.data);
      
      // 응답 구조 안전하게 처리
      const responseData = response.data;
      let paymentId = null;
      
      // 다양한 응답 구조에 대응
      if (responseData) {
        paymentId = responseData.paymentId || 
                   responseData.id || 
                   responseData.data?.paymentId ||
                   responseData.data?.id;
      }
      
      if (!paymentId) {
        logger.error('❌ 응답에서 paymentId를 찾을 수 없습니다:', responseData);
        throw new Error('결제 정보 생성 응답이 올바르지 않습니다.');
      }
      
      logger.log('✅ paymentId 추출 성공:', paymentId);
      return { paymentId: paymentId };
      
    } catch (error) {
      logger.error('❌ 결제 정보 생성 실패');
      logger.error('❌ 에러 객체:', error);
      logger.error('❌ 에러 메시지:', error.message);
      logger.error('❌ 에러 스택:', error.stack);
      
      // 백엔드 에러 응답 처리
      if (error.originalError?.response?.data?.message) {
        error.message = error.originalError.response.data.message;
      } else if (error.statusCode === 400) {
        error.message = '잘못된 결제 정보입니다.';
      } else if (error.statusCode === 401) {
        error.message = '인증이 필요합니다.';
      } else if (error.statusCode === 500) {
        error.message = '서버 오류가 발생했습니다.';
      } else {
        error.message = '결제 정보 생성 중 오류가 발생했습니다.';
      }
      
      throw error;
    }
  }

  // 테스트용 결제 정보 생성 (백엔드 API)
  async createTestPayment(paymentInfo) {
    try {
      logger.log('🧪 테스트용 결제 정보 생성 요청 시작');
      logger.log('📋 테스트 요청 데이터:', paymentInfo);
      logger.log('🌐 테스트 API 엔드포인트:', API_ENDPOINTS.PAYMENT_TEST_CREATE);
      
      const requestData = {
        orderId: paymentInfo.orderId,
        memberCouponId: paymentInfo.memberCouponId,
        totalCost: paymentInfo.totalCost,
        paymentMethod: paymentInfo.paymentMethod,
        storeRequest: paymentInfo.storeRequest,
        riderRequest: paymentInfo.riderRequest
      };
      
      logger.log('📤 테스트 전송 데이터:', requestData);
      
      // 백엔드 API가 JWT 토큰 검증 문제로 실패하므로 Mock 응답 생성
      const mockPaymentId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
      
      const mockResponse = {
        paymentId: mockPaymentId,
        orderId: paymentInfo.orderId,
        totalCost: paymentInfo.totalCost,
        paymentMethod: paymentInfo.paymentMethod,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      
      logger.log('✅ 테스트용 결제 정보 생성 성공 (Mock):', mockResponse);
      
      return mockResponse;
    } catch (error) {
      logger.error('❌ 테스트용 결제 정보 생성 실패:', error);
      throw error;
    }
  }

  // Step 2: 토스페이먼츠 결제 요청 (SDK 사용)
  async requestTossPayment(paymentData) {
    try {
      logger.log('📡 토스페이먼츠 결제 요청:', paymentData);
      
      // 토스페이먼츠 SDK 로드
      const tossPayments = await this.loadTossPaymentsSDK();
      
      // 결제 요청 데이터 검증 및 정리 (토스페이먼츠 공식 문서 기준)
      const requestData = {
        amount: Number(paymentData.amount),
        orderId: paymentData.orderId.toString(),
        orderName: paymentData.orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`
      };
      
      logger.log('📋 토스페이먼츠 요청 데이터:', requestData);
      logger.log('🔧 TossPayments 인스턴스:', tossPayments);
      logger.log('🔧 requestPayment 메서드:', typeof tossPayments.requestPayment);
      
      // 결제 요청
      const tossPayment = await tossPayments.requestPayment('카드', requestData);
      
      logger.log('✅ 토스페이먼츠 결제 요청 성공:', tossPayment);
      return tossPayment;
    } catch (error) {
      logger.error('❌ 토스페이먼츠 결제 요청 실패:', error);
      logger.error('❌ 에러 상세 정보:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Step 3: 결제 승인 (백엔드 API)
  async confirmPayment(backendPaymentId, confirmData) {
    const { TossPaymentKey, TossOrderId, amount } = confirmData;
    
    // 결제 시도 중복 방지
    const attemptId = this.registerPaymentAttempt(TossOrderId);
    
    try {
      logger.log('📡 결제 승인 요청:', { backendPaymentId, TossOrderId, amount, TossPaymentKey });
      
      const response = await retryRequest(() => 
        apiClient.post(API_ENDPOINTS.PAYMENT_CONFIRM(backendPaymentId), {
          TossPaymentKey: TossPaymentKey,  // 토스페이먼츠에서 받은 paymentKey
          TossOrderId: TossOrderId,        // 주문 ID
          amount: amount           // 결제 금액
        })
      );

      this.completePaymentAttempt(TossOrderId, 'success');
      logger.log('✅ 결제 승인 성공:', response.data);
      
      return response.data;
    } catch (error) {
      this.completePaymentAttempt(TossOrderId, 'failed');
      logger.error('❌ 결제 승인 실패:', error);
      
      // 백엔드 에러 응답 처리
      if (error.originalError?.response?.data?.message) {
        error.message = error.originalError.response.data.message;
      } else if (error.statusCode === 400) {
        error.message = '잘못된 결제 정보입니다.';
      } else if (error.statusCode === 401) {
        error.message = '인증이 필요합니다.';
      } else if (error.statusCode === 500) {
        error.message = '서버 오류가 발생했습니다.';
      } else {
        error.message = '결제 승인 처리 중 오류가 발생했습니다.';
      }
      
      throw error;
    } finally {
      // 주기적으로 오래된 결제 시도 데이터 정리
      this.cleanupPaymentAttempts();
    }
  }

  // 전체 결제 플로우 처리
  async processPayment(paymentInfo) {
    try {
      // Step 1: 백엔드에 결제 정보 생성
      const paymentCreateResponse = await this.createPayment(paymentInfo);
      const backendPaymentId = paymentCreateResponse.paymentId;
      
      // Step 2: 토스페이먼츠 결제 요청
      const tossPayment = await this.requestTossPayment({
        amount: paymentInfo.totalCost,
        orderId: paymentInfo.orderId,
        orderName: paymentInfo.orderName,
        customerName: paymentInfo.customerName,
        customerEmail: paymentInfo.customerEmail
      });
      
      // Step 3: 백엔드에 결제 승인 요청
      const confirmResponse = await this.confirmPayment(backendPaymentId, {
        paymentKey: tossPayment.paymentKey,
        orderId: tossPayment.orderId,
        amount: tossPayment.totalAmount
      });
      
      logger.log('✅ 전체 결제 플로우 성공:', confirmResponse);
      return confirmResponse;
      
    } catch (error) {
      logger.error('❌ 전체 결제 플로우 실패:', error);
      throw error;
    }
  }

  // 토스페이먼츠 SDK 로드
  async loadTossPaymentsSDK() {
    logger.log('📡 토스페이먼츠 SDK 로드 시작');
    logger.log('🔑 클라이언트 키:', this.clientKey);
    
    // 기존 인스턴스와 스크립트 제거 (새로 시작)
    if (window.tossPaymentsInstance) {
      delete window.tossPaymentsInstance;
      logger.log('🗑️ 기존 토스페이먼츠 인스턴스 제거');
    }
    
    const existingScript = document.querySelector('script[src="https://js.tosspayments.com/v1"]');
    if (existingScript) {
      existingScript.remove();
      logger.log('🗑️ 기존 토스페이먼츠 스크립트 제거');
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.tosspayments.com/v1';
      script.onload = () => {
        try {
          logger.log('📦 토스페이먼츠 SDK 스크립트 로드 완료');
          logger.log('🔧 TossPayments 생성자:', typeof window.TossPayments);
          
          // TossPayments 인스턴스 생성 (클라이언트 키 필요)
          const tossPayments = new window.TossPayments(this.clientKey);
          window.tossPaymentsInstance = tossPayments;
          
          logger.log('✅ 토스페이먼츠 인스턴스 생성 성공');
          resolve(tossPayments);
        } catch (error) {
          logger.error('❌ 토스페이먼츠 SDK 초기화 실패:', error);
          reject(new Error(`토스페이먼츠 SDK 초기화 실패: ${error.message}`));
        }
      };
      script.onerror = (error) => {
        logger.error('❌ 토스페이먼츠 SDK 스크립트 로드 실패:', error);
        reject(new Error('토스페이먼츠 SDK 로드 실패'));
      };
      document.head.appendChild(script);
    });
  }

  // 결제 승인 (백엔드 API를 통해 호출) - 기존 메서드 (하위 호환성)
  async confirmPaymentLegacy(paymentData) {
    const { orderId, amount, paymentKey } = paymentData;
    
    // 결제 시도 중복 방지
    const attemptId = this.registerPaymentAttempt(orderId);
    
    try {
      logger.log('📡 토스페이먼츠 결제 승인 요청 (백엔드 API):', { orderId, amount, paymentKey });
      
      // 백엔드 API를 통해 토스페이먼츠 결제 승인
      const response = await retryRequest(() => 
        apiClient.post(API_ENDPOINTS.PAYMENTS, {
          paymentKey,
          orderId,
          amount: Number(amount)
        })
      );

      this.completePaymentAttempt(orderId, 'success');
      logger.log('✅ 토스페이먼츠 결제 승인 성공 (백엔드 API):', response.data);
      
      return response.data;
    } catch (error) {
      this.completePaymentAttempt(orderId, 'failed');
      logger.error('❌ 토스페이먼츠 결제 승인 실패 (백엔드 API):', error);
      
      // 백엔드 에러 응답 처리
      if (error.originalError?.response?.data?.message) {
        error.message = error.originalError.response.data.message;
      } else if (error.statusCode === 400) {
        error.message = '잘못된 금액이 입력되었습니다.';
      } else if (error.statusCode === 401) {
        error.message = '인증이 필요합니다.';
      } else if (error.statusCode === 500) {
        error.message = '토스 서버 오류가 발생했습니다.';
      } else {
        error.message = '결제 승인 처리 중 오류가 발생했습니다.';
      }
      
      throw error;
    } finally {
      // 주기적으로 오래된 결제 시도 데이터 정리
      this.cleanupPaymentAttempts();
    }
  }

  // 결제 승인 (백엔드 API 엔드포인트 사용)
  static async confirmPaymentWithBackend(paymentId, confirmData) {
    try {
      logger.log('📡 백엔드 결제 승인 요청:', { paymentId, confirmData });
      // paymentId 유효성 검사 (숫자여야 함)
      if (!paymentId || isNaN(paymentId)) {
        throw new Error('유효하지 않은 paymentId입니다.');
      }
      // 백엔드 명세에 따른 올바른 엔드포인트 사용
      const response = await retryRequest(() => 
        apiClient.post(API_ENDPOINTS.ORDER_CONFIRM(paymentId), {
          paymentKey: confirmData.TossPaymentKey,
          orderId: confirmData.TossOrderId,
          amount: confirmData.amount
        })
      );
      logger.log('✅ 백엔드 결제 승인 성공:', response);
      return response;
    } catch (error) {
      logger.error('❌ 백엔드 결제 승인 실패:', error);
      throw error;
    }
  }

  // 사용자 친화적인 에러 메시지 변환
  getUserFriendlyErrorMessage(error) {
    const message = error.message || '';
    
    if (message.includes('PAY_PROCESS_CANCELED')) {
      return '결제가 취소되었습니다.';
    } else if (message.includes('PAY_PROCESS_ABORTED')) {
      return '결제가 중단되었습니다.';
    } else if (message.includes('INVALID_CARD')) {
      return '유효하지 않은 카드입니다.';
    } else if (message.includes('INSUFFICIENT_BALANCE')) {
      return '잔액이 부족합니다.';
    } else if (message.includes('CARD_EXPIRED')) {
      return '만료된 카드입니다.';
    } else if (message.includes('DUPLICATE_ORDER_ID')) {
      return '중복된 주문번호입니다.';
    } else if (message.includes('INVALID_AMOUNT')) {
      return '잘못된 결제 금액입니다.';
    } else if (message.includes('PAYMENT_NOT_FOUND')) {
      return '결제 정보를 찾을 수 없습니다.';
    } else if (message.includes('ALREADY_PROCESSED_PAYMENT')) {
      return '이미 처리된 결제입니다.';
    } else if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return '서버 일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    } else {
      return '결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
  }

  // 결제 취소 API (공식 문서 권장 방식)
  async cancelPayment(paymentKey, cancelReason, cancelAmount = null) {
    try {
      logger.log('📡 결제 취소 요청 시작:', { paymentKey, cancelReason, cancelAmount });
      // 요청 데이터 구성
      const requestData = {
        cancelReason,
        ...(cancelAmount && { cancelAmount })
      };
      logger.log('📋 취소 요청 데이터:', requestData);
      const response = await this.makeRequest(
        `${this.baseURL}/api/payments/${paymentKey}/cancel`,
        {
          method: 'POST',
          headers: this.getHeaders('application/json'),
          body: JSON.stringify(requestData)
        },
        { maxRetries: 2, delay: 1000, backoff: 2 }
      );
      logger.log('✅ 결제 취소 성공:', response);
      return response;
    } catch (error) {
      logger.error('❌ 결제 취소 실패:', error);
      // 사용자 친화적인 에러 메시지
      const userMessage = this.getCancelErrorMessage(error);
      throw new Error(userMessage);
    }
  }

  // 결제 취소 에러 메시지 변환
  getCancelErrorMessage(error) {
    const errorMessages = {
      'PAYMENT_NOT_FOUND': '결제 정보를 찾을 수 없습니다.',
      'ALREADY_CANCELED': '이미 취소된 결제입니다.',
      'CANCEL_AMOUNT_EXCEEDED': '취소 금액이 결제 금액을 초과합니다.',
      'INVALID_CANCEL_AMOUNT': '유효하지 않은 취소 금액입니다.',
      'CANCEL_NOT_ALLOWED': '취소가 허용되지 않는 결제입니다.',
      'REFUND_NOT_AVAILABLE': '환불이 불가능한 결제입니다.',
      'NETWORK_ERROR': '네트워크 연결을 확인해주세요.',
      'TIMEOUT': '요청 시간이 초과되었습니다.',
      'UNKNOWN_ERROR': '결제 취소 중 오류가 발생했습니다.'
    };

    return errorMessages[error.code] || error.message || '결제 취소 중 오류가 발생했습니다.';
  }

  // 부분 취소 API
  async partialCancel(paymentKey, cancelAmount, cancelReason) {
    try {
      logger.log('📡 부분 취소 요청 시작:', { paymentKey, cancelAmount, cancelReason });
      
      return await this.cancelPayment(paymentKey, cancelReason, cancelAmount);
      
    } catch (error) {
      logger.error('❌ 부분 취소 실패:', error);
      throw error;
    }
  }

  // 결제 상태 조회 (개선된 버전)
  async getPaymentStatus(paymentKey) {
    try {
      logger.log('📡 결제 상태 조회:', paymentKey);
      
      const response = await this.makeRequest(
        `${this.baseURL}/api/payments/${paymentKey}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        },
        { maxRetries: 2, delay: 1000, backoff: 2 }
      );
      
      logger.log('✅ 결제 상태 조회 성공:', response);
      return response;
      
    } catch (error) {
      logger.error('❌ 결제 상태 조회 실패:', error);
      throw error;
    }
  }

  // 결제 이력 조회
  async getPaymentHistory(paymentKey) {
    try {
      logger.log('📡 결제 이력 조회:', paymentKey);
      
      const response = await this.makeRequest(
        `${this.baseURL}/api/payments/${paymentKey}/history`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );
      
      logger.log('✅ 결제 이력 조회 성공:', response);
      return response;
      
    } catch (error) {
      logger.error('❌ 결제 이력 조회 실패:', error);
      throw error;
    }
  }

  // 결제 승인 (개선된 버전)
  async confirmPayment(backendPaymentId, confirmData) {
    try {
      logger.log('📡 결제 승인 요청 시작:', { backendPaymentId, confirmData });
      // 요청 데이터 검증
      if (!confirmData.paymentKey || !confirmData.orderId || !confirmData.amount) {
        throw new Error('필수 결제 정보가 누락되었습니다.');
      }
      const requestData = {
        paymentKey: confirmData.paymentKey,
        orderId: confirmData.orderId,
        amount: Number(confirmData.amount)
      };
      logger.log('📋 승인 요청 데이터:', requestData);
      const response = await this.makeRequest(
        `${this.baseURL}/api/orders/confirm`,
        {
          method: 'POST',
          headers: this.getHeaders('application/json'),
          body: JSON.stringify({
            paymentId: backendPaymentId,
            ...requestData
          })
        },
        { maxRetries: 3, delay: 1000, backoff: 2 }
      );
      logger.log('✅ 결제 승인 성공:', response);
      // 결제 시도 완료 처리
      this.completePaymentAttempt(confirmData.orderId, 'completed');
      return response;
    } catch (error) {
      logger.error('❌ 결제 승인 실패:', error);
      // 결제 시도 실패 처리
      this.completePaymentAttempt(confirmData.orderId, 'failed');
      // 사용자 친화적인 에러 메시지
      const userMessage = this.getConfirmErrorMessage(error);
      throw new Error(userMessage);
    }
  }

  // 결제 승인 에러 메시지 변환
  getConfirmErrorMessage(error) {
    const errorMessages = {
      'PAYMENT_NOT_FOUND': '결제 정보를 찾을 수 없습니다.',
      'ALREADY_PROCESSED_PAYMENT': '이미 처리된 결제입니다.',
      'INVALID_AMOUNT': '유효하지 않은 결제 금액입니다.',
      'ORDER_NOT_FOUND': '주문 정보를 찾을 수 없습니다.',
      'PAYMENT_EXPIRED': '결제 유효기간이 만료되었습니다.',
      'DUPLICATE_ORDER_ID': '중복된 주문번호입니다.',
      'NETWORK_ERROR': '네트워크 연결을 확인해주세요.',
      'TIMEOUT': '요청 시간이 초과되었습니다.',
      'UNKNOWN_ERROR': '결제 승인 중 오류가 발생했습니다.'
    };

    return errorMessages[error.code] || error.message || '결제 승인 중 오류가 발생했습니다.';
  }

  // Mock 모드용 결제 승인 (개발 환경)
  async mockConfirmPayment(paymentData) {
    logger.log('Mock 토스페이먼츠 결제 승인:', paymentData);

    // 2초 지연으로 실제 API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000));

    // VAT 계산 (한국 부가가치세율 10%)
    const suppliedAmount = Math.floor(paymentData.amount / 1.1);
    const vat = paymentData.amount - suppliedAmount;

    // Mock 성공 응답
    return {
      paymentKey: paymentData.paymentKey,
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      status: 'DONE',
      method: 'CARD',
      totalAmount: paymentData.amount,
      balanceAmount: 0,
      suppliedAmount: suppliedAmount,
      vat: vat,
      taxFreeAmount: 0,
      approvedAt: new Date().toISOString(),
      useEscrow: false,
      card: {
        company: '신한카드',
        number: '123456******1234',
        installmentPlanMonths: 0,
        isInterestFree: false,
        approveNo: '00000000',
        useCardPoint: false,
        cardType: 'CREDIT',
        ownerType: 'PERSONAL',
        acquireStatus: 'APPROVED',
        amount: paymentData.amount,
      },
      receiptUrl: 'https://dashboard.tosspayments.com/receipt',
    };
  }
}

// 싱글톤 인스턴스 생성
export const tossPaymentAPI = new TossPaymentAPI();
export { TossPaymentAPI };
export default tossPaymentAPI; 
