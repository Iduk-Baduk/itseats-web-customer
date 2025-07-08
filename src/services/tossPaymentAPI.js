import { API_CONFIG } from '../config/api';
import { logger } from '../utils/logger';

// 토스페이먼츠 결제 API 서비스
class TossPaymentAPI {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // 결제 승인 API
  async confirmPayment(paymentData) {
    try {
      logger.log('토스페이먼츠 결제 승인 요청:', paymentData);

      const response = await fetch(`${this.baseURL}/api/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa('test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6:')}`,
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error('토스페이먼츠 결제 승인 실패:', result);
        throw new Error(result.message || '결제 승인에 실패했습니다.');
      }

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

      const response = await fetch(`${this.baseURL}/api/payments/${paymentKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa('test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6:')}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error('토스페이먼츠 결제 조회 실패:', result);
        throw new Error(result.message || '결제 조회에 실패했습니다.');
      }

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

      const response = await fetch(`${this.baseURL}/api/payments/${paymentKey}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa('test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6:')}`,
        },
        body: JSON.stringify(cancelData),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error('토스페이먼츠 결제 취소 실패:', result);
        throw new Error(result.message || '결제 취소에 실패했습니다.');
      }

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
      suppliedAmount: paymentData.amount,
      vat: Math.floor(paymentData.amount * 0.1),
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
