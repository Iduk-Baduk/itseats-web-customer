import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';

// 쿠폰 API 서비스
export const couponAPI = {
  // 쿠폰 목록 조회
  getCoupons: async () => {
    const data = await apiClient.get(API_ENDPOINTS.COUPONS);
    
    // 데이터를 그대로 반환 (직렬화 문제 방지)
    return data;
  },

  // 쿠폰 사용
  useCoupon: async (couponId, orderData) => {
    return await apiClient.post(API_ENDPOINTS.COUPON_USE(couponId), orderData);
  },

  // 사용 가능한 쿠폰 조회 (특정 주문에 대해)
  getAvailableCoupons: async (orderData) => {
    return await apiClient.post(API_ENDPOINTS.COUPON_AVAILABLE, orderData);
  },

  // 쿠폰 등록 (프로모션 코드)
  registerCoupon: async (promoCode) => {
    return await apiClient.post(API_ENDPOINTS.COUPON_REGISTER, { promoCode });
  },
};

export default couponAPI; 
