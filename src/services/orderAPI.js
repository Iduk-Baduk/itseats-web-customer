import apiClient from './apiClient';
import { API_CONFIG, API_ENDPOINTS, ENV_CONFIG } from '../config/api';
import { generateOrderId } from '../utils/idUtils';
import { logger } from '../utils/logger';
import { ORDER_STATUS } from '../constants/orderStatus';
import { retryOrderTracking } from '../utils/apiRetry';

// 주문 API 서비스
export const orderAPI = {
  // 새 주문 생성
  createOrder: async (orderData) => {
    try {
      // 간단한 주문 데이터 구조로 변환
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

      // 주문 데이터 구성
      const newOrder = {
        id: generateOrderId(),
        storeId: parseInt(storeId),
        storeName,
        orderStatus: ORDER_STATUS.WAITING,
        orderDate: new Date().toISOString(),
        totalPrice,
        deliveryFee,
        orderMenus,
        deliveryAddress,
        paymentMethod,
        storeRequest,
        riderRequest,
        coupons,
        statusHistory: [{
          orderStatus: ORDER_STATUS.WAITING,
          timestamp: new Date().toISOString(),
          message: "주문이 접수되었습니다."
        }]
      };

      // 백엔드 API 호출
      logger.log('새 주문 생성:', newOrder);
      return await apiClient.post('/orders', newOrder);
    } catch (error) {
      logger.error('주문 생성 실패:', error);
      throw error;
    }
  },

  // 주문 목록 조회
  getOrders: async (params = {}) => {
    const { page = 0, size = 100, ...rest } = params;

    try {
      const response = await apiClient.get('/orders', { params: { page, size, ...rest } });
      return response.data;
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

  // 실시간 주문 상태 추적
  trackOrder: async (orderId) => {
    try {
      // 재시도 로직이 포함된 API 호출
      const response = await retryOrderTracking(orderId, () => apiClient.get(`/orders/${orderId}/status`));
      return response.data;
    } catch (error) {
      logger.error(`주문 추적 실패 (ID: ${orderId}):`, error);
      throw error;
    }
  },

  // 주문 상태 업데이트
  updateOrderStatus: async (orderId, orderStatus, message = '') => {
    try {
      if (!Object.values(ORDER_STATUS).includes(orderStatus)) {
        throw new Error(`유효하지 않은 주문 상태: ${orderStatus}`);
      }

      const response = await apiClient.put(`/orders/${orderId}/status`, {
        orderStatus,
        message
      });
      return response;
    } catch (error) {
      logger.error(`주문 상태 업데이트 실패 (ID: ${orderId}):`, error);
      throw error;
    }
  },

  // 주문 취소
  cancelOrder: async (orderId, reason = '') => {
    try {
      return await orderAPI.updateOrderStatus(orderId, ORDER_STATUS.CANCELED, reason || '주문이 취소되었습니다.');
    } catch (error) {
      logger.error(`주문 취소 실패 (ID: ${orderId}):`, error);
      throw error;
    }
  },

  // 주문 완료 처리
  completeOrder: async (orderId) => {
    try {
      return await orderAPI.updateOrderStatus(orderId, ORDER_STATUS.COMPLETED, '주문이 완료되었습니다.');
    } catch (error) {
      logger.error(`주문 완료 처리 실패 (ID: ${orderId}):`, error);
      throw error;
    }
  },

  // 토스페이먼츠 결제 승인 (백엔드 API 호출)
  confirmPayment: async (paymentData) => {
    const { orderId, amount, paymentKey } = paymentData;
    
    try {
      const requestData = {
        orderId,
        amount: Number(amount),
        paymentKey
      };
      
      logger.log('백엔드 결제 승인 요청:', {
        url: `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ORDER_CONFIRM}`,
        method: 'POST',
        data: requestData,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // 백엔드 API 호출
      const response = await apiClient.post(API_ENDPOINTS.ORDER_CONFIRM, requestData);
      
      logger.log('백엔드 결제 승인 성공:', response);
      return response;
    } catch (error) {
      logger.error('백엔드 결제 승인 실패:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      
      // 백엔드 에러 응답 처리
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('결제 승인 처리 중 오류가 발생했습니다.');
      }
    }
  },
};

export default orderAPI; 
