import apiClient from './apiClient';

// 쿠폰 API 서비스
export const couponAPI = {
  // 쿠폰 목록 조회
  getCoupons: async () => {
    const data = await apiClient.get('/api/coupons');
    
    // 유효기간을 Date 객체로 변환
    return data.map(coupon => ({
      ...coupon,
      validDate: coupon.validDate ? new Date(coupon.validDate) : null,
    }));
  },

  // 쿠폰 사용
  useCoupon: async (couponId, orderData) => {
    return await apiClient.post(`/api/coupons/${couponId}/use`, orderData);
  },

  // 사용 가능한 쿠폰 조회 (특정 주문에 대해)
  getAvailableCoupons: async (orderData) => {
    return await apiClient.post('/api/coupons/available', orderData);
  },

  // 쿠폰 등록 (프로모션 코드)
  registerCoupon: async (promoCode) => {
    return await apiClient.post('/api/coupons/register', { promoCode });
  },
};

export default couponAPI; 
