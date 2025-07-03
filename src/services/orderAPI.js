import apiClient from './apiClient';
import { API_ENDPOINTS, ENV_CONFIG } from '../config/api';
import { generateOrderId } from '../utils/idUtils';
import { logger } from '../utils/logger';
import store from '../store';
import { ORDER_STATUS } from '../constants/orderStatus';
import { updateOrder, addOrder } from '../store/orderSlice';

// Mock 데이터
const mockOrders = new Map();

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
        status: ORDER_STATUS.WAITING,
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
          status: ORDER_STATUS.WAITING,
          timestamp: new Date().toISOString(),
          message: "주문이 접수되었습니다."
        }]
      };

      if (ENV_CONFIG.isDevelopment) {
        // 개발 환경: 목업 데이터 사용
        mockOrders.set(newOrder.id, newOrder);
        
        // Redux store 업데이트
        store.dispatch(addOrder(newOrder));
        
        logger.log('Mock: 새 주문 생성:', newOrder);
        return { data: newOrder };
      } else {
        // 운영 환경: 실제 API 호출
        logger.log('새 주문 생성:', newOrder);
        return await apiClient.post('/orders', newOrder);
      }
    } catch (error) {
      logger.error('주문 생성 실패:', error);
      throw error;
    }
  },

  // 주문 목록 조회
  getOrders: async (params = {}) => {
    const { page = 0, size = 100, ...rest } = params;

    try {
      if (ENV_CONFIG.isDevelopment) {
        // 개발 환경: Redux store의 주문 데이터 사용
        const state = store.getState();
        const orders = state.order?.orders || [];
        return { data: { orders, hasNext: false, currentPage: 0 }};
      } else {
        const response = await apiClient.get('/orders', { params: { page, size, ...rest } });
        return response.data;
      }
    } catch (error) {
      logger.error('주문 목록 조회 실패:', error);
      throw error;
    }
  },

  // 특정 주문 조회
  getOrderById: async (orderId) => {
    try {
      if (ENV_CONFIG.isDevelopment) {
        // 개발 환경: Redux store의 주문 데이터 사용
        const state = store.getState();
        const order = state.order?.orders?.find(order => order.id === orderId);
        if (!order) {
          throw new Error('주문을 찾을 수 없습니다.');
        }
        return { data: order };
      } else {
        return await apiClient.get(`/orders/${orderId}`);
      }
    } catch (error) {
      logger.error(`주문 조회 실패 (ID: ${orderId}):`, error);
      throw error;
    }
  },

  // 실시간 주문 상태 추적
  trackOrder: async (orderId) => {
    try {
      if (ENV_CONFIG.isDevelopment) {
        // 개발 환경: mockOrders에서 주문 데이터 사용
        const order = mockOrders.get(orderId) || store.getState().order?.orders?.find(order => order.id === orderId);
        
        if (!order) {
          throw new Error('주문을 찾을 수 없습니다.');
        }

        // 테스트 주문의 상태 변화를 감지하기 위해 새로운 객체 생성
        const trackedOrder = {
          ...order,
          lastChecked: new Date().toISOString()
        };

        logger.log(`🔄 주문 ${orderId} 추적 시작 (초기 상태: ${trackedOrder.status})`);
        return { data: trackedOrder };
      } else {
        const response = await apiClient.get(`/orders/${orderId}/track`);
        return response;
      }
    } catch (error) {
      logger.error(`주문 추적 실패 (ID: ${orderId}):`, error);
      throw error;
    }
  },

  // 주문 상태 업데이트
  updateOrderStatus: async (orderId, status, message = '') => {
    try {
      if (!Object.values(ORDER_STATUS).includes(status)) {
        throw new Error(`유효하지 않은 주문 상태: ${status}`);
      }

      if (ENV_CONFIG.isDevelopment) {
        // 개발 환경: 주문 찾기 (mockOrders 또는 Redux store)
        let order = mockOrders.get(orderId);
        
        if (!order) {
          // mockOrders에 없으면 Redux store에서 찾기
          const state = store.getState();
          order = state.order?.orders?.find(order => order.id === orderId);
          
          if (!order) {
            throw new Error('주문을 찾을 수 없습니다.');
          }
        }

        // 주문 업데이트
        const updatedOrder = {
          ...order,
          status,
          statusHistory: [
            ...(order.statusHistory || []),
            {
              status,
              timestamp: new Date().toISOString(),
              message: message || `주문 상태가 ${status}로 변경되었습니다.`
            }
          ]
        };

        // mockOrders 업데이트
        mockOrders.set(orderId, updatedOrder);

        // Redux store 업데이트
        store.dispatch(updateOrder(updatedOrder));

        logger.log(`🔄 주문 상태 업데이트 - 주문 ID: ${orderId}, 상태: ${status}`);
        return { data: updatedOrder };
      } else {
        const response = await apiClient.put(`/orders/${orderId}/status`, {
          status,
          message
        });
        return response;
      }
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
};

export default orderAPI; 
