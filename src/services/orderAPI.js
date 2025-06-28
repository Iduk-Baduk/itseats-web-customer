import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { logger } from '../utils/logger';

// 주문 API 서비스
export const orderAPI = {
  // 새 주문 생성
  createOrder: async (orderData) => {
    try {
      // 간단한 주문 데이터 구조로 변환 (JSON Server용)
      const {
        storeId,
        storeName,
        totalPrice,
        deliveryFee = 0,
        paymentMethod,
        orderMenus = [],
        deliveryAddress,
        storeRequest = "",
        riderRequest = "",
        coupons = []
      } = orderData;

      // 필수 필드 검증
      if (!storeId || !storeName || !totalPrice || !paymentMethod || !orderMenus.length) {
        throw new Error("필수 주문 정보가 누락되었습니다.");
      }

      // JSON Server용 주문 데이터
      const newOrder = {
        id: `ORDER-${Date.now()}`, // 임시 ID 생성
        storeId: parseInt(storeId),
        storeName,
        status: "placed", // 주문 접수
        orderDate: new Date().toISOString(),
        totalPrice,
        deliveryFee,
        orderMenus,
        deliveryAddress,
        paymentMethod,
        storeRequest,
        riderRequest,
        coupons
      };

      logger.log('새 주문 생성:', newOrder);
      return await apiClient.post('/orders', newOrder);
    } catch (error) {
      logger.error('주문 생성 실패:', error);
      throw error;
    }
  },

  // 주문 목록 조회
  getOrders: async (params = {}) => {
    try {
      return await apiClient.get('/orders', { params });
    } catch (error) {
      logger.error('주문 목록 조회 실패:', error);
      throw error;
    }
  },

  // 특정 주문 조회
  getOrderById: async (orderId) => {
    try {
      return await apiClient.get(`/orders/${orderId}`);
    } catch (error) {
      logger.error(`주문 조회 실패 (ID: ${orderId}):`, error);
      throw error;
    }
  },

  // 주문 상태 업데이트
  updateOrderStatus: async (orderId, status, message = '') => {
    try {
      // 먼저 기존 주문 정보를 가져온 후 상태만 업데이트
      const order = await apiClient.get(`/orders/${orderId}`);
      const updatedOrder = {
        ...order,
        status,
        statusMessage: message,
        updatedAt: new Date().toISOString()
      };
      
      return await apiClient.put(`/orders/${orderId}`, updatedOrder);
    } catch (error) {
      logger.error(`주문 상태 업데이트 실패 (ID: ${orderId}):`, error);
      throw error;
    }
  },

  // 주문 취소
  cancelOrder: async (orderId, reason = '') => {
    try {
      return await this.updateOrderStatus(orderId, 'cancelled', reason);
    } catch (error) {
      logger.error(`주문 취소 실패 (ID: ${orderId}):`, error);
      throw error;
    }
  },

  // 주문 완료 처리
  completeOrder: async (orderId) => {
    try {
      return await this.updateOrderStatus(orderId, 'completed', '주문이 완료되었습니다.');
    } catch (error) {
      logger.error(`주문 완료 처리 실패 (ID: ${orderId}):`, error);
      throw error;
    }
  },

  // 실시간 주문 상태 추적 (단순히 주문 정보 조회)
  trackOrder: async (orderId) => {
    try {
      return await this.getOrderById(orderId);
    } catch (error) {
      logger.error(`주문 추적 실패 (ID: ${orderId}):`, error);
      throw error;
    }
  },
};

export default orderAPI; 
