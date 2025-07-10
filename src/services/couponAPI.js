import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { logger } from '../utils/logger';

// 쿠폰 API 서비스
export const couponAPI = {
  // 쿠폰 목록 조회
  getCoupons: async () => {
    try {
      const data = await apiClient.get('/coupons');
      // 데이터를 그대로 반환 (직렬화 문제 방지)
      return data;
    } catch (error) {
      logger.error('쿠폰 조회 실패:', error);
      // 에러가 발생해도 빈 배열 반환하여 Cart 페이지가 정상 로드되도록 함
      return [];
    }
  },

  // 쿠폰 사용 (목업용 - 상태만 변경)
  useCoupon: async (couponId, orderData) => {
    try {
      const coupon = await apiClient.get(`/coupons/${couponId}`);
      const usedCoupon = {
        ...coupon,
        isUsed: true,
        usedAt: new Date().toISOString(),
        orderId: orderData.orderId
      };
      
      return await apiClient.put(`/coupons/${couponId}`, usedCoupon);
    } catch (error) {
      logger.error('쿠폰 사용 실패:', error);
      throw error;
    }
  },

  // 사용 가능한 쿠폰 조회 (간단한 필터링)
  getAvailableCoupons: async (orderData) => {
    try {
      const allCoupons = await apiClient.get('/coupons');
      
      // 사용 가능한 쿠폰 필터링 (간단한 로직)
      const availableCoupons = allCoupons.filter(coupon => 
        !coupon.isUsed && 
        !coupon.isExpired &&
        (orderData.totalAmount >= (coupon.minOrderAmount || 0))
      );
      
      return availableCoupons;
    } catch (error) {
      logger.error('사용 가능한 쿠폰 조회 실패:', error);
      throw error;
    }
  },

  // 쿠폰 등록 (목업용 - 새 쿠폰 추가)
  registerCoupon: async (promoCode) => {
    try {
      // 간단한 프로모션 코드 검증 로직
      const predefinedCoupons = {
        'WELCOME2024': {
          id: `COUPON-${Date.now()}`,
          name: '신규 가입 환영 쿠폰',
          discount: 5000,
          type: 'general',
          description: '신규 가입자 전용 5,000원 할인',
          minOrderAmount: 15000,
          validDate: '2025-12-31T23:59:59.000Z',
          isUsed: false,
          isExpired: false,
          isStackable: true
        }
      };
      
      const newCoupon = predefinedCoupons[promoCode];
      if (!newCoupon) {
        throw new Error('유효하지 않은 프로모션 코드입니다.');
      }
      
      return await apiClient.post('/coupons', newCoupon);
    } catch (error) {
      logger.error('쿠폰 등록 실패:', error);
      throw error;
    }
  },
};

export default couponAPI; 
