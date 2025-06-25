import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  coupons: [
    {
      id: 1,
      name: '시크릿 3천원 할인 (와우전용)',
      discount: 3000,
      description: '2025/07/08까지 사용가능',
      type: '배달',
    },
    {
      id: 2,
      name: '[고객센터 보상] 3,000원 할인',
      discount: 3000,
      description: '2025/07/20까지 사용가능',
      type: '배달·포장',
    },
    {
      id: 3,
      name: '시크릿 3천원 할인 (와우전용)',
      discount: 3000,
      description: '2025/07/08까지 사용가능',
      type: '배달',
    },
  ],
  selectedCouponId: null,
};

const couponSlice = createSlice({
  name: 'coupon',
  initialState,
  reducers: {
    applyCoupon(state, action) {
      state.selectedCouponId = action.payload;
    },
    clearCoupon(state) {
      state.selectedCouponId = null;
    },
  },
});

export const { applyCoupon, clearCoupon } = couponSlice.actions;
export default couponSlice.reducer; 
