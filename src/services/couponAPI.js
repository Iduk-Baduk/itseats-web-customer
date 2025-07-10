import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { logger } from '../utils/logger';

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
      logger.warn(`📡 쿠폰 API 재시도 ${retryCount + 1}/${RETRY_CONFIG.maxRetries} (${delay}ms 후)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retryCount + 1);
    }
    
    throw error;
  }
};

// 쿠폰 API 서비스
export const couponAPI = {
  // 쿠폰 목록 조회
  getCoupons: async () => {
    try {
      logger.log('📡 쿠폰 목록 조회 요청');
      
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.COUPONS)
      );
      
      logger.log('✅ 쿠폰 목록 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('❌ 쿠폰 조회 실패:', error);
      
      // 백엔드 에러 메시지 처리
      if (error.originalError?.response?.data?.message) {
        error.message = error.originalError.response.data.message;
      } else if (error.statusCode === 401) {
        error.message = '로그인이 필요합니다.';
      } else {
        error.message = '쿠폰 목록을 불러오는데 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 사용 가능한 쿠폰 조회
  getAvailableCoupons: async (orderData) => {
    try {
      logger.log('📡 사용 가능한 쿠폰 조회 요청:', orderData);
      
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.COUPON_AVAILABLE, { params: orderData })
      );
      
      logger.log('✅ 사용 가능한 쿠폰 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('❌ 사용 가능한 쿠폰 조회 실패:', error);
      
      if (error.statusCode === 401) {
        error.message = '로그인이 필요합니다.';
      } else if (error.statusCode === 422) {
        error.message = '주문 정보를 확인해주세요.';
      } else {
        error.message = '사용 가능한 쿠폰을 불러오는데 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 쿠폰 사용
  useCoupon: async (couponId, orderData) => {
    try {
      logger.log(`📡 쿠폰 사용 요청 (ID: ${couponId})`);
      
      const response = await retryRequest(() => 
        apiClient.post(API_ENDPOINTS.COUPON_USE(couponId), orderData)
      );
      
      logger.log(`✅ 쿠폰 사용 성공 (ID: ${couponId}):`, response.data);
      return response.data;
    } catch (error) {
      logger.error(`❌ 쿠폰 사용 실패 (ID: ${couponId}):`, error);
      
      if (error.statusCode === 404) {
        error.message = '쿠폰을 찾을 수 없습니다.';
      } else if (error.statusCode === 409) {
        error.message = '이미 사용된 쿠폰입니다.';
      } else if (error.statusCode === 422) {
        error.message = '쿠폰 사용 조건을 확인해주세요.';
      } else {
        error.message = '쿠폰 사용에 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 쿠폰 등록
  registerCoupon: async (promoCode) => {
    try {
      logger.log('📡 쿠폰 등록 요청:', promoCode);
      
      const response = await retryRequest(() => 
        apiClient.post(API_ENDPOINTS.COUPON_REGISTER, { promoCode })
      );
      
      logger.log('✅ 쿠폰 등록 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('❌ 쿠폰 등록 실패:', error);
      
      if (error.statusCode === 409) {
        error.message = '이미 등록된 쿠폰입니다.';
      } else if (error.statusCode === 422) {
        error.message = '유효하지 않은 프로모션 코드입니다.';
      } else {
        error.message = '쿠폰 등록에 실패했습니다.';
      }
      
      throw error;
    }
  },
};

export default couponAPI; 
