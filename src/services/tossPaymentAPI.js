import { API_CONFIG } from '../config/api';
import { logger } from '../utils/logger';
import { loadTossPayments } from '@tosspayments/payment-sdk';

// 토스페이먼츠 결제 API 서비스
class TossPaymentAPI {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    
    // 환경 변수에서 API 키 가져오기
    const envApiKey = import.meta.env.VITE_TOSS_SECRET_KEY;
    const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
    
    if (!envApiKey) {
      logger.warn('VITE_TOSS_SECRET_KEY가 설정되지 않았습니다. 테스트 키를 사용합니다.');
      this.apiKey = 'test_sk_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
    } else {
      this.apiKey = envApiKey;
    }

    if (!clientKey) {
      logger.warn('VITE_TOSS_CLIENT_KEY가 설정되지 않았습니다. 테스트 키를 사용합니다.');
      this.clientKey = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
    } else {
      this.clientKey = clientKey;
    }
    
    // API 키 유효성 검증
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('토스페이먼츠 API 키가 유효하지 않습니다. VITE_TOSS_SECRET_KEY를 확인해주세요.');
    }

    // 토스페이먼츠 클라이언트 초기화
    this.tossPayments = null;
    this.initTossPayments();
  }

  // 토스페이먼츠 클라이언트 초기화
  async initTossPayments() {
    try {
      this.tossPayments = await loadTossPayments(this.clientKey);
      logger.log('토스페이먼츠 클라이언트 초기화 성공');
    } catch (error) {
      logger.error('토스페이먼츠 클라이언트 초기화 실패:', error);
      throw error;
    }
  }

  // 토스페이먼츠 클라이언트 가져오기
  async getTossPayments() {
    if (!this.tossPayments) {
      await this.initTossPayments();
    }
    return this.tossPayments;
  }

  // 인증 헤더 생성
  getAuthHeaders() {
    return {
      'Authorization': `Basic ${btoa(`${this.apiKey}:`)}`,
    };
  }

  // 공통 헤더 생성
  getHeaders(contentType = 'application/json') {
    const headers = {
      ...this.getAuthHeaders(),
    };
    
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    
    return headers;
  }

  // 공통 fetch 요청 처리
  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        logger.error('API 요청 실패:', { url, status: response.status, result });
        throw new Error(result.message || `API 요청 실패 (${response.status})`);
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다.');
      }
      
      throw error;
    }
  }

  // 결제 준비 요청 (백엔드에 결제 정보 전송)
  async preparePayment(paymentData) {
    try {
      logger.log('결제 준비 요청:', paymentData);

      const result = await this.makeRequest(`${this.baseURL}/api/payments/prepare`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(paymentData),
      });

      logger.log('결제 준비 성공:', result);
      return result;
    } catch (error) {
      logger.error('결제 준비 오류:', error);
      throw error;
    }
  }

  // 결제창 실행 (토스페이먼츠 SDK 사용)
  async requestPayment(paymentMethod, paymentData) {
    try {
      const tossPayments = await this.getTossPayments();
      
      logger.log('결제창 실행:', { paymentMethod, paymentData });

      const result = await tossPayments.requestPayment(paymentMethod, {
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        successUrl: paymentData.successUrl || `${window.location.origin}/payments/success`,
        failUrl: paymentData.failUrl || `${window.location.origin}/payments/failure`,
      });

      logger.log('결제창 실행 성공:', result);
      return result;
    } catch (error) {
      logger.error('결제창 실행 오류:', error);
      throw error;
    }
  }

  // 결제 승인 API
  async confirmPayment(paymentData) {
    try {
      logger.log('토스페이먼츠 결제 승인 요청:', paymentData);

      const result = await this.makeRequest(`${this.baseURL}/api/payments/confirm`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(paymentData),
      });

      logger.log('토스페이먼츠 결제 승인 성공:', result);
      return result;
    } catch (error) {
      logger.error('토스페이먼츠 결제 승인 오류:', error);
      throw error;
    }
  }

  // 결제 조회 API
  async getPayment(paymentKey) {
    try {
      logger.log('토스페이먼츠 결제 조회 요청:', paymentKey);

      const result = await this.makeRequest(`${this.baseURL}/api/payments/${paymentKey}`, {
        method: 'GET',
        headers: this.getHeaders(null), // Content-Type 제외
      });

      logger.log('토스페이먼츠 결제 조회 성공:', result);
      return result;
    } catch (error) {
      logger.error('토스페이먼츠 결제 조회 오류:', error);
      throw error;
    }
  }

  // 결제 취소 API
  async cancelPayment(paymentKey, cancelData) {
    try {
      logger.log('토스페이먼츠 결제 취소 요청:', { paymentKey, cancelData });

      const result = await this.makeRequest(`${this.baseURL}/api/payments/${paymentKey}/cancel`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(cancelData),
      });

      logger.log('토스페이먼츠 결제 취소 성공:', result);
      return result;
    } catch (error) {
      logger.error('토스페이먼츠 결제 취소 오류:', error);
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
      totalAmount: paymentData.amount,
      balanceAmount: 0,
      suppliedAmount: suppliedAmount,
      vat: vat,
      taxFreeAmount: 0,
      approvedAt: new Date().toISOString(),
      useEscrow: false,
      currency: 'KRW',
      receiptUrl: 'https://dashboard.tosspayments.com/receipt',
    };
  }
}

// 싱글톤 인스턴스 생성
export const tossPaymentAPI = new TossPaymentAPI();
export default tossPaymentAPI; 
