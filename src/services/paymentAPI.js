import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';

// 결제 수단 API 서비스
export const paymentAPI = {
  // 결제 수단 목록 조회
  getPaymentMethods: async () => {
    const [cards, accounts, coupayMoney] = await Promise.all([
      apiClient.get(API_ENDPOINTS.CARDS),
      apiClient.get(API_ENDPOINTS.ACCOUNTS),
      apiClient.get('/coupayMoney'),
    ]);

    return {
      cards,
      accounts,
      coupayMoney,
    };
  },

  // 카드 추가
  addCard: async (cardData) => {
    return await apiClient.post(API_ENDPOINTS.CARDS, cardData);
  },

  // 계좌 추가
  addAccount: async (accountData) => {
    return await apiClient.post(API_ENDPOINTS.ACCOUNTS, accountData);
  },

  // 카드 삭제
  deleteCard: async (cardId) => {
    return await apiClient.delete(API_ENDPOINTS.CARD_BY_ID(cardId));
  },

  // 계좌 삭제
  deleteAccount: async (accountId) => {
    return await apiClient.delete(API_ENDPOINTS.ACCOUNT_BY_ID(accountId));
  },

  // 결제 실행 (개선된 버전)
  processPayment: async (paymentData) => {
    const {
      orderId,
      paymentMethod,
      amount,
      cardId,
      accountId,
      customerInfo
    } = paymentData;

    // 필수 필드 검증
    if (!paymentMethod || !amount) {
      throw new Error('결제 수단과 금액이 필요합니다.');
    }

    // 결제 수단별 데이터 구성
    let requestData = {
      orderId,
      amount,
      paymentMethod,
      timestamp: new Date().toISOString()
    };

    switch (paymentMethod) {
      case 'card':
        if (!cardId) throw new Error('카드를 선택해주세요.');
        requestData.cardId = cardId;
        break;
      case 'account':
        if (!accountId) throw new Error('계좌를 선택해주세요.');
        requestData.accountId = accountId;
        break;
      case 'coupay':
        // 쿠페이는 추가 정보 불필요
        break;
      default:
        throw new Error('지원하지 않는 결제 수단입니다.');
    }

    return await apiClient.post(API_ENDPOINTS.PAYMENTS + '/process', requestData);
  },

  // 결제 상태 확인
  getPaymentStatus: async (paymentId) => {
    return await apiClient.get(`${API_ENDPOINTS.PAYMENTS}/${paymentId}/status`);
  },

  // 결제 취소
  cancelPayment: async (paymentId, reason) => {
    return await apiClient.post(`${API_ENDPOINTS.PAYMENTS}/${paymentId}/cancel`, {
      reason,
      timestamp: new Date().toISOString()
    });
  },

  // 결제 내역 조회
  getPaymentHistory: async (params = {}) => {
    return await apiClient.get(`${API_ENDPOINTS.PAYMENTS}/history`, { params });
  },
};

export default paymentAPI; 
