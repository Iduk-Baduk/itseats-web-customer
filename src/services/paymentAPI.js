import apiClient from './apiClient';

// 결제 수단 API 서비스
export const paymentAPI = {
  // 결제 수단 목록 조회
  getPaymentMethods: async () => {
    const [cards, accounts] = await Promise.all([
      apiClient.get('/api/cards'),
      apiClient.get('/api/accounts'),
    ]);

    return {
      cards,
      accounts,
      coupayMoney: 10000, // 서버에서 받아올 예정
    };
  },

  // 카드 추가
  addCard: async (cardData) => {
    return await apiClient.post('/api/cards', cardData);
  },

  // 계좌 추가
  addAccount: async (accountData) => {
    return await apiClient.post('/api/accounts', accountData);
  },

  // 카드 삭제
  deleteCard: async (cardId) => {
    return await apiClient.delete(`/api/cards/${cardId}`);
  },

  // 계좌 삭제
  deleteAccount: async (accountId) => {
    return await apiClient.delete(`/api/accounts/${accountId}`);
  },

  // 결제 실행
  processPayment: async (paymentData) => {
    return await apiClient.post('/api/payments', paymentData);
  },
};

export default paymentAPI; 
