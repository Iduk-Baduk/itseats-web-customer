import apiClient from './apiClient';

// 주문 API 서비스
export const orderAPI = {
  // 새 주문 생성
  createOrder: async (orderData) => {
    return await apiClient.post('/api/orders', orderData);
  },

  // 주문 목록 조회
  getOrders: async (params = {}) => {
    return await apiClient.get('/api/orders', { params });
  },

  // 특정 주문 조회
  getOrderById: async (orderId) => {
    return await apiClient.get(`/api/orders/${orderId}`);
  },

  // 주문 상태 업데이트
  updateOrderStatus: async (orderId, status, message) => {
    return await apiClient.patch(`/api/orders/${orderId}/status`, {
      status,
      message,
    });
  },

  // 주문 취소
  cancelOrder: async (orderId, reason) => {
    return await apiClient.patch(`/api/orders/${orderId}/cancel`, {
      reason,
    });
  },

  // 주문 완료 처리
  completeOrder: async (orderId) => {
    return await apiClient.patch(`/api/orders/${orderId}/complete`);
  },

  // 실시간 주문 상태 추적 (WebSocket 대안으로 폴링)
  trackOrder: async (orderId) => {
    return await apiClient.get(`/api/orders/${orderId}/track`);
  },
};

export default orderAPI; 
