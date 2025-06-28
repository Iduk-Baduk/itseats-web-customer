import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { logger } from '../utils/logger';

// 결제 수단 API 서비스
export const paymentAPI = {
  // 결제 수단 목록 조회
  getPaymentMethods: async () => {
    try {
      const [cards, accounts, coupayMoney] = await Promise.all([
        apiClient.get('/cards'),
        apiClient.get('/accounts'),
        apiClient.get('/coupayMoney'),
      ]);

      return {
        cards,
        accounts,
        coupayMoney,
      };
    } catch (error) {
      logger.error('결제 수단 조회 실패:', error);
      throw error;
    }
  },

  // 카드 추가
  addCard: async (cardData) => {
    try {
      return await apiClient.post('/cards', cardData);
    } catch (error) {
      logger.error('카드 추가 실패:', error);
      throw error;
    }
  },

  // 계좌 추가
  addAccount: async (accountData) => {
    try {
      return await apiClient.post('/accounts', accountData);
    } catch (error) {
      logger.error('계좌 추가 실패:', error);
      throw error;
    }
  },

  // 카드 삭제
  deleteCard: async (cardId) => {
    try {
      return await apiClient.delete(`/cards/${cardId}`);
    } catch (error) {
      logger.error('카드 삭제 실패:', error);
      throw error;
    }
  },

  // 계좌 삭제
  deleteAccount: async (accountId) => {
    try {
      return await apiClient.delete(`/accounts/${accountId}`);
    } catch (error) {
      logger.error('계좌 삭제 실패:', error);
      throw error;
    }
  },

  // 결제 실행 (간단한 목업 버전)
  processPayment: async (paymentData) => {
    try {
      const {
        orderId,
        paymentMethod,
        amount,
        cardId,
        accountId
      } = paymentData;

      // 필수 필드 검증
      if (!paymentMethod || !amount) {
        throw new Error('결제 수단과 금액이 필요합니다.');
      }

      // 간단한 결제 데이터 생성 (목업용)
      const paymentRecord = {
        id: `PAYMENT-${Date.now()}`,
        orderId,
        amount,
        paymentMethod,
        cardId,
        accountId,
        status: 'success', // 목업에서는 항상 성공
        timestamp: new Date().toISOString(),
        transactionId: `TXN-${Date.now()}`
      };

      logger.log('결제 처리:', paymentRecord);
      return await apiClient.post('/payments', paymentRecord);
    } catch (error) {
      logger.error('결제 처리 실패:', error);
      throw error;
    }
  },

  // 결제 상태 확인
  getPaymentStatus: async (paymentId) => {
    try {	
      return await apiClient.get(`/payments/${paymentId}`);
    } catch (error) {
      logger.error('결제 상태 확인 실패:', error);
      throw error;
    }
  },

  // 결제 취소 (목업용 - 상태만 변경)
  cancelPayment: async (paymentId, reason = '') => {
    try {
      const payment = await apiClient.get(`/payments/${paymentId}`);
      const cancelledPayment = {
        ...payment,
        status: 'cancelled',
        cancelReason: reason,
        cancelledAt: new Date().toISOString()
      };
      
      return await apiClient.put(`/payments/${paymentId}`, cancelledPayment);
    } catch (error) {
      logger.error('결제 취소 실패:', error);
      throw error;
    }
  },

  // 결제 내역 조회
  getPaymentHistory: async (params = {}) => {
    try {
      return await apiClient.get('/payments', { params });
    } catch (error) {
      logger.error('결제 내역 조회 실패:', error);
      throw error;
    }
  },
};

export default paymentAPI; 
