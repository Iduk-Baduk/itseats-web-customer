import apiClient from './apiClient';
import { API_CONFIG, API_ENDPOINTS, ENV_CONFIG } from '../config/api';
import { generateOrderId } from '../utils/idUtils';
import { logger } from '../utils/logger';
import { ORDER_STATUS } from '../constants/orderStatus';
import { retryOrderTracking } from '../utils/apiRetry';

// 재시도 설정
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryBackoff: 2,
};

// 재시도 로직
const retryRequest = async (requestFn, retryCount = 0) => {
  try {
    return await requestFn();
  } catch (error) {
    const isRetryableError = 
      error.statusCode >= 500 || 
      error.statusCode === 0 || 
      error.type === 'NETWORK_ERROR';
    
    if (isRetryableError && retryCount < RETRY_CONFIG.maxRetries) {
      const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.retryBackoff, retryCount);
      logger.warn(`📡 주문 API 재시도 ${retryCount + 1}/${RETRY_CONFIG.maxRetries} (${delay}ms 후)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retryCount + 1);
    }
    
    throw error;
  }
};

// 주문 API 서비스
export const orderAPI = {
  // 새 주문 생성 (배달비, 배달 시간, 주문 금액 통합 조회) - 명세서 기반
  createOrderWithDeliveryInfo: async (orderData) => {
    try {
      const {
        addrId,
        storeId,
        orderMenus = [],
        coupons = [],
        deliveryType = 'DEFAULT'
      } = orderData;

      // 필수 필드 검증
      if (!addrId || !storeId || !orderMenus.length) {
        throw new Error("필수 주문 정보가 누락되었습니다.");
      }

      // 명세서에 맞는 주문 데이터 구성
      const newOrderRequest = {
        addrId: parseInt(addrId),
        storeId: parseInt(storeId),
        orderMenus: orderMenus.map(menu => ({
          menuId: menu.menuId,
          menuName: menu.menuName,
          menuOption: Array.isArray(menu.menuOptions) ? menu.menuOptions : [], // 백엔드 명세에 맞게 menuOption으로 변경
          menuTotalPrice: menu.menuTotalPrice || 0,
          quantity: menu.quantity
        })),
        coupons: Array.isArray(coupons) ? coupons : [],
        deliveryType: deliveryType // 'DEFAULT' 또는 'ONLY_ONE'
      };

      logger.log('📡 배달 정보 포함 주문 생성 요청:', newOrderRequest);
      
      const response = await retryRequest(() => 
        apiClient.post(API_ENDPOINTS.ORDERS_NEW, newOrderRequest)
      );
      
      logger.log('✅ 배달 정보 포함 주문 생성 성공:', response.data);
      return response; // 전체 응답 객체 반환 (httpStatus, message, data 포함)
    } catch (error) {
      logger.error('❌ 배달 정보 포함 주문 생성 실패:', error);
      
      // 백엔드 에러 메시지 처리
      if (error.originalError?.response?.data?.message) {
        error.message = error.originalError.response.data.message;
      } else if (error.statusCode === 422) {
        error.message = '주문 정보를 확인해주세요.';
      } else if (error.statusCode === 409) {
        error.message = '이미 진행 중인 주문이 있습니다.';
      } else if (error.statusCode === 404) {
        error.message = '요청한 주소, 가맹점, 메뉴, 쿠폰을 찾을 수 없습니다.';
      } else {
        error.message = '주문 생성에 실패했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      throw error;
    }
  },

  // 새 주문 생성 (기존 메서드 - 호환성 유지)
  createOrder: async (orderData) => {
    try {
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

      // 백엔드 API 형식에 맞춰 주문 데이터 구성
      const newOrder = {
        storeId: parseInt(storeId),
        storeName,
        totalPrice: Number(totalPrice),
        deliveryFee: Number(deliveryFee),
        orderMenus: orderMenus.map(menu => ({
          menuId: menu.menuId,
          menuName: menu.menuName,
          quantity: menu.quantity,
          price: menu.price,
          options: menu.options || []
        })),
        deliveryAddress: {
          mainAddress: deliveryAddress.roadAddress || deliveryAddress.address,
          detailAddress: deliveryAddress.detailAddress || "",
          lat: deliveryAddress.lat,
          lng: deliveryAddress.lng
        },
        paymentMethod: {
          type: paymentMethod.type,
          id: paymentMethod.id
        },
        storeRequest,
        riderRequest,
        couponIds: coupons.map(coupon => coupon.id)
      };

      logger.log('📡 새 주문 생성 요청:', newOrder);
      
      const response = await retryRequest(() => 
        apiClient.post(API_ENDPOINTS.ORDERS, newOrder)
      );
      
      logger.log('✅ 주문 생성 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('❌ 주문 생성 실패:', error);
      
      // 백엔드 에러 메시지 처리
      if (error.originalError?.response?.data?.message) {
        error.message = error.originalError.response.data.message;
      } else if (error.statusCode === 422) {
        error.message = '주문 정보를 확인해주세요.';
      } else if (error.statusCode === 409) {
        error.message = '이미 진행 중인 주문이 있습니다.';
      } else {
        error.message = '주문 생성에 실패했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      throw error;
    }
  },

  // 주문 목록 조회
  getOrders: async (params = {}) => {
    const { page = 0, size = 20, status, ...rest } = params;

    try {
      const queryParams = { 
        page, 
        size, 
        ...(status && { orderStatus: status }),
        ...rest 
      };
      
      logger.log('📡 주문 목록 조회 요청:', queryParams);
      
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.ORDERS, { params: queryParams })
      );
      
      logger.log('✅ 주문 목록 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('❌ 주문 목록 조회 실패:', error);
      
      if (error.statusCode === 401) {
        error.message = '로그인이 필요합니다.';
      } else {
        error.message = '주문 목록을 불러오는데 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 특정 주문 조회
  getOrderById: async (orderId) => {
    try {
      logger.log(`📡 주문 조회 요청 (ID: ${orderId})`);
      
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.ORDER_BY_ID(orderId))
      );
      
      logger.log(`✅ 주문 조회 성공 (ID: ${orderId}):`, response.data);
      return response.data;
    } catch (error) {
      logger.error(`❌ 주문 조회 실패 (ID: ${orderId}):`, error);
      
      if (error.statusCode === 404) {
        error.message = '주문을 찾을 수 없습니다.';
      } else if (error.statusCode === 401) {
        error.message = '로그인이 필요합니다.';
      } else {
        error.message = '주문 정보를 불러오는데 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 실시간 주문 상태 추적
  trackOrder: async (orderId) => {
    try {
      logger.log(`📡 주문 추적 요청 (ID: ${orderId})`);
      
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.ORDER_STATUS(orderId))
      );
      
      logger.log(`✅ 주문 추적 성공 (ID: ${orderId}):`, response.data);
      return response.data;
    } catch (error) {
      logger.error(`❌ 주문 추적 실패 (ID: ${orderId}):`, error);
      
      if (error.statusCode === 404) {
        error.message = '주문을 찾을 수 없습니다.';
      } else {
        error.message = '주문 상태를 확인하는데 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 주문 상태 업데이트
  updateOrderStatus: async (orderId, orderStatus, message = '') => {
    try {
      if (!Object.values(ORDER_STATUS).includes(orderStatus)) {
        throw new Error(`유효하지 않은 주문 상태: ${orderStatus}`);
      }

      logger.log(`📡 주문 상태 업데이트 요청 (ID: ${orderId}, Status: ${orderStatus})`);
      
      const response = await retryRequest(() => 
        apiClient.put(API_ENDPOINTS.ORDER_STATUS(orderId), {
          orderStatus,
          message
        })
      );
      
      logger.log(`✅ 주문 상태 업데이트 성공 (ID: ${orderId}):`, response.data);
      return response.data;
    } catch (error) {
      logger.error(`❌ 주문 상태 업데이트 실패 (ID: ${orderId}):`, error);
      
      if (error.statusCode === 404) {
        error.message = '주문을 찾을 수 없습니다.';
      } else if (error.statusCode === 422) {
        error.message = '주문 상태 변경이 불가능합니다.';
      } else {
        error.message = '주문 상태 업데이트에 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 주문 취소
  cancelOrder: async (orderId, reason = '') => {
    try {
      logger.log(`📡 주문 취소 요청 (ID: ${orderId})`);
      
      const response = await retryRequest(() => 
        apiClient.post(API_ENDPOINTS.ORDER_CANCEL(orderId), {
          reason: reason || '고객 요청으로 취소'
        })
      );
      
      logger.log(`✅ 주문 취소 성공 (ID: ${orderId}):`, response.data);
      return response.data;
    } catch (error) {
      logger.error(`❌ 주문 취소 실패 (ID: ${orderId}):`, error);
      
      if (error.statusCode === 404) {
        error.message = '주문을 찾을 수 없습니다.';
      } else if (error.statusCode === 422) {
        error.message = '취소할 수 없는 주문입니다.';
      } else {
        error.message = '주문 취소에 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 주문 완료 처리
  completeOrder: async (orderId) => {
    try {
      logger.log(`📡 주문 완료 요청 (ID: ${orderId})`);
      
      const response = await retryRequest(() => 
        apiClient.post(API_ENDPOINTS.ORDER_COMPLETE(orderId))
      );
      
      logger.log(`✅ 주문 완료 성공 (ID: ${orderId}):`, response.data);
      return response.data;
    } catch (error) {
      logger.error(`❌ 주문 완료 처리 실패 (ID: ${orderId}):`, error);
      
      if (error.statusCode === 404) {
        error.message = '주문을 찾을 수 없습니다.';
      } else if (error.statusCode === 422) {
        error.message = '완료 처리할 수 없는 주문입니다.';
      } else {
        error.message = '주문 완료 처리에 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 토스페이먼츠 결제 승인 (백엔드 API 호출) - DEPRECATED: paymentAPI.confirmPayment 사용 권장
  confirmPayment: async (paymentData) => {
    const { paymentId, orderId, amount, paymentKey } = paymentData;
    
    try {
      const requestData = {
        paymentKey,
        orderId,
        amount: Number(amount)
      };
      
      logger.log('📡 백엔드 결제 승인 요청:', requestData);
      
      // paymentId 유효성 검사 (숫자여야 함)
      if (!paymentId || isNaN(paymentId)) {
        throw new Error('유효하지 않은 paymentId입니다.');
      }
      
      // 백엔드 명세에 따른 올바른 엔드포인트 사용
      const response = await retryRequest(() => 
        apiClient.post(API_ENDPOINTS.ORDER_CONFIRM(paymentId), requestData)
      );
      
      logger.log('✅ 백엔드 결제 승인 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('❌ 백엔드 결제 승인 실패:', error);
      
      // 백엔드 에러 응답 처리
      if (error.originalError?.response?.data?.message) {
        error.message = error.originalError.response.data.message;
      } else if (error.statusCode === 422) {
        error.message = '결제 정보를 확인해주세요.';
      } else if (error.statusCode === 409) {
        error.message = '이미 처리된 결제입니다.';
      } else {
        error.message = '결제 승인 처리 중 오류가 발생했습니다.';
      }
      
      throw error;
    }
  },
};

export default orderAPI; 
