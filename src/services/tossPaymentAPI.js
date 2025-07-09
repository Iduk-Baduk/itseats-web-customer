import { API_CONFIG } from '../config/api';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

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

  // 결제 승인 (토큰화 및 멱등성 적용)
  async confirmPayment(paymentData) {
    const { orderId, amount, paymentKey } = paymentData;
    
    // 결제 시도 중복 방지
    const attemptId = this.registerPaymentAttempt(orderId);
    
    try {
      // 멱등성 키 생성
      const idempotencyKey = `${orderId}_${attemptId}`;
      
      logger.log('토스페이먼츠 결제 승인 요청:', { orderId, amount, paymentKey });
      
      const result = await this.makeRequest(
        'https://api.tosspayments.com/v1/payments/confirm',
        {
          method: 'POST',
          headers: this.getHeaders('application/json', idempotencyKey),
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount)
          })
        },
        { maxRetries: 2, delay: 1000 } // 결제 승인은 재시도 횟수 제한
      );

      this.completePaymentAttempt(orderId, 'success');
      logger.log('토스페이먼츠 결제 승인 성공:', result);
      
      return result;
    } catch (error) {
      this.completePaymentAttempt(orderId, 'failed');
      logger.error('토스페이먼츠 결제 승인 실패:', error);
      
      // 사용자 친화적인 에러 메시지 변환
      const userMessage = this.getUserFriendlyErrorMessage(error);
      throw new Error(userMessage);
    } finally {
      // 주기적으로 오래된 결제 시도 데이터 정리
      this.cleanupPaymentAttempts();
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
export default tossPaymentAPI; 
