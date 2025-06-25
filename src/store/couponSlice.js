import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { couponAPI } from '../services';

// 쿠폰 유효성 검사 함수
const isValidCoupon = (coupon, cartTotal = 0) => {
  // 유효기간 검사
  if (coupon.validDate && new Date() > coupon.validDate) {
    return false;
  }
  
  // 최소 주문 금액 검사 (있는 경우)
  if (coupon.minOrderAmount && coupon.minOrderAmount > 0) {
    if (cartTotal < coupon.minOrderAmount) {
      return false;
    }
  }
  
  // 사용 가능 여부 검사
  if (coupon.isUsed || coupon.isExpired) {
    return false;
  }
  
  return true;
};

// 쿠폰 목록 API 연동 Thunk - Axios 기반으로 변경
export const fetchCoupons = createAsyncThunk(
  'coupon/fetchCoupons',
  async () => {
    return await couponAPI.getCoupons();
  }
);

// 사용 가능한 쿠폰 조회 Thunk
export const fetchAvailableCoupons = createAsyncThunk(
  'coupon/fetchAvailableCoupons',
  async (orderData) => {
    return await couponAPI.getAvailableCoupons(orderData);
  }
);

// 쿠폰 사용 Thunk
export const useCouponAsync = createAsyncThunk(
  'coupon/useCoupon',
  async ({ couponId, orderData }) => {
    return await couponAPI.useCoupon(couponId, orderData);
  }
);

const initialState = {
  coupons: [],
  loading: false,
  error: null,
  selectedCouponId: null,
};

const couponSlice = createSlice({
  name: 'coupon',
  initialState,
  reducers: {
    applyCoupon(state, action) {
      const { couponId, cartTotal } = action.payload;
      
      // cartTotal이 제공되지 않았을 때 경고
      if (cartTotal === undefined) {
        console.warn('applyCoupon: cartTotal이 제공되지 않았습니다');
        return;
      }
      
      const coupon = state.coupons.find(c => c.id === couponId);
      if (coupon && isValidCoupon(coupon, cartTotal)) {
        state.selectedCouponId = couponId;
      }
    },
    clearCoupon(state) {
      state.selectedCouponId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

// 정규화된 쿠폰 데이터 selector - fallback 필드 일관성 확보
export const selectNormalizedCoupons = (state) =>
  state.coupon.coupons.map(coupon => ({
    ...coupon,
    discount: coupon.discount || coupon.salePrice || 0,
    type: coupon.type || coupon.deliveryType || 'general',
    name: coupon.name || coupon.storeName || '이름 없는 쿠폰',
    description: coupon.description || (coupon.validDate ? 
      `${coupon.validDate.toLocaleDateString()}까지` : '설명 없음'),
    validDate: coupon.validDate || null,
    minOrderAmount: coupon.minOrderAmount || 0,
    isUsed: coupon.isUsed || false,
    isExpired: coupon.isExpired || false,
  }));

// 유효한 쿠폰만 선택하는 selector 추가
export const selectValidCoupons = (state, cartTotal = 0) =>
  selectNormalizedCoupons(state).filter(coupon => isValidCoupon(coupon, cartTotal));

export const { applyCoupon, clearCoupon } = couponSlice.actions;
export default couponSlice.reducer;
