import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

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

// 쿠폰 목록 API 연동 Thunk
export const fetchCoupons = createAsyncThunk(
  'coupon/fetchCoupons',
  async () => {
    const res = await fetch('/api/coupons');
    if (!res.ok) throw new Error('쿠폰 목록을 불러오지 못했습니다.');
    const data = await res.json();
    // 유효기간을 Date 객체로 변환
    return data.map(coupon => ({
      ...coupon,
      validDate: coupon.validDate ? new Date(coupon.validDate) : null,
    }));
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
      const { couponId, cartTotal = 0 } = action.payload;
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

// 정규화된 쿠폰 데이터 selector
export const selectNormalizedCoupons = (state) =>
  state.coupon.coupons.map(coupon => ({
    ...coupon,
    discount: coupon.discount || coupon.salePrice,
    type: coupon.type || coupon.deliveryType,
    name: coupon.name || coupon.storeName,
    description: coupon.description || coupon.validDate
  }));

export const { applyCoupon, clearCoupon } = couponSlice.actions;
export default couponSlice.reducer;
