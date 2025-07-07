import apiClient from './apiClient';
import { logger } from '../utils/logger';

const TOSS_API_BASE_URL = import.meta.env.VITE_TOSS_API_URL || '/api/toss';

export const tossPaymentAPI = {
  // 결제 확인
  confirmPayment: async (paymentData) => {
    try {
      const response = await apiClient.post(`${TOSS_API_BASE_URL}/confirm`, paymentData);
      logger.log('토스페이먼츠 결제 확인 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('토스페이먼츠 결제 확인 실패:', error);
      throw error;
    }
  },

  // 결제 취소
  cancelPayment: async (paymentKey, cancelReason) => {
    try {
      const response = await apiClient.post(`${TOSS_API_BASE_URL}/cancel`, {
        paymentKey,
        cancelReason
      });
      logger.log('토스페이먼츠 결제 취소 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('토스페이먼츠 결제 취소 실패:', error);
      throw error;
    }
  },

  // 결제 조회
  getPayment: async (paymentKey) => {
    try {
      const response = await apiClient.get(`${TOSS_API_BASE_URL}/payments/${paymentKey}`);
      logger.log('토스페이먼츠 결제 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('토스페이먼츠 결제 조회 실패:', error);
      throw error;
    }
  },

  // 결제 수단 조회
  getPaymentMethods: async () => {
    try {
      const response = await apiClient.get(`${TOSS_API_BASE_URL}/payment-methods`);
      logger.log('토스페이먼츠 결제 수단 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('토스페이먼츠 결제 수단 조회 실패:', error);
      throw error;
    }
  }
}; 
