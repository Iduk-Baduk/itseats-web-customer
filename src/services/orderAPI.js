import apiClient from './apiClient';
import { API_ENDPOINTS, ENV_CONFIG } from '../config/api';
import { generateOrderId } from '../utils/idUtils';
import { logger } from '../utils/logger';
import store from '../store';
import { ORDER_STATUS } from '../constants/orderStatus';
import { updateOrder, addOrder } from '../store/orderSlice';
import { retryOrderTracking } from '../utils/apiRetry';

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

        logger.log(`🔄 주문 ${orderId} 추적 시작 (초기 상태: ${trackedOrder.orderStatus})`);
        return { data: trackedOrder };
      } else {
        // 운영 환경: 재시도 로직이 포함된 API 호출
        const response = await retryOrderTracking(orderId, () => apiClient.get(`/orders/${orderId}/status`));
        return response.data;
      }
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
          orderStatus,
          statusHistory: [
            ...(order.statusHistory || []),
            {
              orderStatus,
              timestamp: new Date().toISOString(),
              message: message || `주문 상태가 ${orderStatus}로 변경되었습니다.`
            }
          ]
        };

        // mockOrders 업데이트
        mockOrders.set(orderId, updatedOrder);

        // Redux store 업데이트
        store.dispatch(updateOrder(updatedOrder));

        logger.log(`🔄 주문 상태 업데이트 - 주문 ID: ${orderId}, 상태: ${orderStatus}`);
        return { data: updatedOrder };
      } else {
        const response = await apiClient.put(`/orders/${orderId}/status`, {
          orderStatus,
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

  // 토스페이먼츠 결제 승인 (백엔드 API 호출)
  confirmPayment: async (paymentData) => {
    const { orderId, amount, paymentKey } = paymentData;
    
    try {
      logger.log('백엔드 결제 승인 요청:', { orderId, amount, paymentKey });
      
      if (ENV_CONFIG.isDevelopment) {
        // 개발 환경: Mock 응답
        logger.log('Mock: 백엔드 결제 승인 성공');
        
        // 2초 지연으로 실제 API 호출 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock 성공 응답 (백엔드 응답 형식에 맞춤)
        return {
          data: {
            paymentKey,
            orderId,
            amount: Number(amount),
            status: 'DONE',
            method: 'CARD',
            totalAmount: Number(amount),
            balanceAmount: 0,
            suppliedAmount: Math.floor(Number(amount) / 1.1),
            vat: Number(amount) - Math.floor(Number(amount) / 1.1),
            taxFreeAmount: 0,
            approvedAt: new Date().toISOString(),
            useEscrow: false,
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
              amount: Number(amount),
            },
            receiptUrl: 'https://dashboard.tosspayments.com/receipt',
            // 백엔드에서 추가하는 필드들
            tossPaymentKey: paymentKey,
            tossOrderId: orderId,
            paymentStatus: 'COMPLETED'
          }
        };
      } else {
        // 운영 환경: 백엔드 API 호출
        const response = await apiClient.post(API_ENDPOINTS.ORDER_CONFIRM, {
          orderId,
          amount: Number(amount),
          paymentKey
        });
        
        logger.log('백엔드 결제 승인 성공:', response.data);
        return response;
      }
    } catch (error) {
      logger.error('백엔드 결제 승인 실패:', error);
      
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
