import { API_CONFIG } from '../config/api';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import apiClient from './apiClient';
import { API_ENDPOINTS, ENV_CONFIG } from '../config/api';
import { generatePaymentId, safeParsePaymentId, generateOrderId, safeParseOrderId, extractPaymentInfo } from '../utils/paymentUtils';
import AuthService from './authService';

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
  getHeaders(contentType = 'application/json', idempotencyKey = null) {
    const headers = {
      ...this.getAuthHeaders(),
    };
    
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    // 멱등성 키 추가
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
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
    
    const attemptId = uuidv4();
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

  // 새로운 단순한 결제 확인 API (백엔드 API 단순화)
  async confirmPaymentSimple(confirmData) {
    try {
      const { paymentKey, orderId, amount } = confirmData;
      
      logger.log('📡 새로운 단순한 결제 확인 요청:', { paymentKey, orderId, amount });
      logger.log('🔗 엔드포인트:', '/payments/confirm');
      logger.log('🌐 전체 URL:', `${API_CONFIG.BASE_URL}/payments/confirm`);
      
      const requestData = {
        paymentKey: paymentKey,
        orderId: orderId,
        amount: amount
      };
      
      logger.log('📤 전송할 데이터:', requestData);
      
      const response = await retryRequest(() => 
        apiClient.post('/payments/confirm', requestData)
      );

      logger.log('✅ 새로운 결제 확인 성공:', response);
      return response;
    } catch (error) {
      logger.error('❌ 새로운 결제 확인 실패:', error);
      
      // 개발 환경에서 백엔드 API 실패 시 mock 데이터 반환 (401 에러 포함)
      if (ENV_CONFIG.isDevelopment && (error.statusCode === 500 || error.statusCode === 401)) {
        logger.warn('🔧 개발 환경: 백엔드 API 실패로 mock 데이터 사용');
        return {
          data: {
            paymentKey: confirmData.paymentKey,
            orderId: confirmData.orderId,
            amount: confirmData.amount,
            status: 'DONE',
            method: 'CARD',
            approvedAt: new Date().toISOString(),
            totalAmount: confirmData.amount,
            balanceAmount: 0,
            suppliedAmount: confirmData.amount,
            vat: Math.floor(confirmData.amount * 0.1),
            useEscrow: false,
            currency: 'KRW',
            receiptUrl: 'https://test-receipt.toss.im',
            card: {
              company: '신한카드',
              number: '1234-****-****-1234',
              installmentPlanMonths: 0,
              isInterestFree: false,
              approveNo: '12345678',
              useCardPoint: false,
              cardType: '신용',
              ownerType: '개인',
              acquireStatus: 'APPROVED',
              amount: confirmData.amount
            }
          }
        };
      }
      
      // 네트워크 에러인지 확인
      if (error.type === 'NETWORK_ERROR' || error.statusCode === 0) {
        logger.error('🌐 네트워크 연결 실패 - 백엔드 서버가 실행 중인지 확인하세요');
        error.message = '백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
      }
      // 백엔드 에러 응답 처리
      else if (error.originalError?.response?.data?.message) {
        error.message = error.originalError.response.data.message;
      } else if (error.statusCode === 400) {
        error.message = '잘못된 결제 정보입니다.';
      } else if (error.statusCode === 401) {
        // 백엔드에서 개선된 401 에러 메시지 사용
        error.message = error.originalError?.response?.data?.message || '인증 정보가 없습니다. 다시 로그인해주세요.';
        logger.warn('🔐 인증 실패 - 로그인 페이지로 리다이렉트');
        // AuthService를 통해 로그인 페이지로 리다이렉트
        AuthService.removeToken();
        AuthService.redirectToLogin();
      } else if (error.statusCode === 500) {
        error.message = '서버 오류가 발생했습니다.';
      } else {
        error.message = '결제 확인 중 오류가 발생했습니다.';
      }
      
      throw error;
    }
  }

  // 토스페이먼츠 결제 요청 (단순화)
  async requestTossPayment(paymentData) {
    try {
      logger.log('📡 토스페이먼츠 결제 요청:', paymentData);
      
      // 토스페이먼츠 SDK 로드
      const TossPayments = await this.loadTossPaymentsSDK();
      
      // 결제 요청
      const tossPayment = await TossPayments.requestPayment('카드', {
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        successUrl: `${window.location.origin}/payments/toss-success`,
        failUrl: `${window.location.origin}/payments/toss-fail`
      });
      
      logger.log('✅ 토스페이먼츠 결제 요청 성공:', tossPayment);
      return tossPayment;
    } catch (error) {
      logger.error('❌ 토스페이먼츠 결제 요청 실패:', error);
      throw error;
    }
  }

  // 결제 승인 (새로운 단순한 API 사용)
  async confirmPayment(confirmData) {
    const { paymentKey, orderId, amount } = confirmData;
    
    logger.log('🔢 결제 확인 데이터:', { paymentKey, orderId, amount });
    
    // 결제 시도 중복 방지
    const attemptId = this.registerPaymentAttempt(orderId);
    
    try {
      logger.log('📡 새로운 단순한 결제 확인 요청:', { orderId, amount, paymentKey });
      
      // 새로운 단순한 API 사용
      const response = await this.confirmPaymentSimple({
        paymentKey: paymentKey,
        orderId: orderId,
        amount: amount
      });

      this.completePaymentAttempt(orderId, 'success');
      logger.log('✅ 결제 확인 성공:', response);
      
      return response;
    } catch (error) {
      this.completePaymentAttempt(orderId, 'failed');
      logger.error('❌ 결제 확인 실패:', error);
      
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
        error.message = '결제 확인 처리 중 오류가 발생했습니다.';
      }
      
      throw error;
    } finally {
      // 주기적으로 오래된 결제 시도 데이터 정리
      this.cleanupPaymentAttempts();
    }
  }

  // 전체 결제 플로우 처리 (단순화)
  async processPayment(paymentInfo) {
    try {
      logger.log('🚀 새로운 단순한 결제 플로우 시작');
      
      // Step 1: 토스페이먼츠 결제 요청
      const tossPayment = await this.requestTossPayment({
        amount: paymentInfo.totalCost,
        orderId: paymentInfo.orderId,
        orderName: paymentInfo.orderName,
        customerName: paymentInfo.customerName,
        customerEmail: paymentInfo.customerEmail
      });
      
      logger.log('✅ 토스페이먼츠 결제 요청 완료:', tossPayment);
      return tossPayment;
      
    } catch (error) {
      logger.error('❌ 결제 플로우 실패:', error);
      throw error;
    }
  }

  // 토스페이먼츠 SDK 로드
  async loadTossPaymentsSDK() {
    if (window.TossPayments) {
      return window.TossPayments;
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.tosspayments.com/v1';
      script.onload = () => {
        if (window.TossPayments) {
          resolve(window.TossPayments);
        } else {
          reject(new Error('토스페이먼츠 SDK 로드 실패'));
        }
      };
      script.onerror = () => reject(new Error('토스페이먼츠 SDK 로드 실패'));
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
      // paymentId를 안전하게 변환 (백엔드에서 숫자 ID 사용)
      const safePaymentId = safeParsePaymentId(paymentId);
      
      logger.log('🔢 ID 변환:', { 
        paymentId: { 
          original: paymentId, 
          converted: safePaymentId,
          type: typeof paymentId,
          isNumber: !isNaN(paymentId) && paymentId > 0
        },
        orderId: { original: confirmData.orderId, note: '토스페이먼츠 주문 ID (문자열 유지)' }
      });
      
      logger.log('📡 백엔드 결제 승인 요청:', { paymentId: safePaymentId, confirmData });
      
      // 백엔드 명세서에 따른 올바른 엔드포인트 사용
      const requestData = {
        paymentKey: confirmData.paymentKey,
        orderId: confirmData.orderId,  // 토스페이먼츠 주문 ID (문자열)
        amount: confirmData.amount
      };
      
      logger.log('📋 요청 데이터:', requestData);
      logger.log('🔗 엔드포인트:', API_ENDPOINTS.PAYMENT_CONFIRM(safePaymentId));
      
      const response = await retryRequest(() => 
        apiClient.post(API_ENDPOINTS.PAYMENT_CONFIRM(safePaymentId), requestData)
      );
      
      logger.log('✅ 백엔드 결제 승인 성공:', response);
      return response;
      
    } catch (error) {
      logger.error('❌ 백엔드 결제 승인 실패:', error);
      logger.error('❌ 에러 상세 정보:', {
        message: error.message,
        status: error.statusCode,
        response: error.response?.data
      });
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

  // 결제 취소
  async cancelPayment(paymentKey, cancelReason, cancelAmount = null) {
    try {
      const cancelData = {
        cancelReason,
        ...(cancelAmount && { cancelAmount })
      };

      const result = await this.makeRequest(
        `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
        {
          method: 'POST',
          headers: this.getHeaders('application/json'),
          body: JSON.stringify(cancelData)
        }
      );

      logger.log('토스페이먼츠 결제 취소 성공:', result);
      return result;
    } catch (error) {
      logger.error('토스페이먼츠 결제 취소 오류:', error);
      throw error;
    }
  }

  // 결제 상태 조회
  async getPaymentStatus(paymentKey) {
    try {
      const result = await this.makeRequest(
        `https://api.tosspayments.com/v1/payments/${paymentKey}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      logger.log('토스페이먼츠 결제 상태 조회 성공:', result);
      return result;
    } catch (error) {
      logger.error('토스페이먼츠 결제 상태 조회 오류:', error);
      throw error;
    }
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
