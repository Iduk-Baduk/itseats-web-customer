import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { couponAPI } from '../services';

function isValidCoupon(coupon, cartTotal) {
  console.log('🧪 isValidCoupon 검사 시작:', coupon, cartTotal);

  if (!coupon.canUsed) {
    console.log('❌ canUsed false');
    return false;
  }

  const now = new Date();
  const validDate = new Date(coupon.validDate);
  if (now > validDate) {
    console.log('❌ validDate expired', now, validDate);
    return false;
  }

  if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
    console.log('❌ minOrderAmount 부족', cartTotal, coupon.minOrderAmount);
    return false;
  }

  if (coupon.isUsed || coupon.isExpired) {
    console.log('❌ 이미 사용됨 or 만료됨');
    return false;
  }

  console.log('✅ isValidCoupon 통과');
  return true;
}


export const fetchCoupons = createAsyncThunk(
  'coupon/fetchCoupons',
  async () => {
    const res = await couponAPI.getCoupons();
    const rawCoupons = res.myCouponDtos;
    return rawCoupons.map(c => ({
      id: String(c.couponId),
      storeId: c.storeId ? String(c.storeId) : null,
      discountValue: c.discountValue,
      minOrderAmount: c.minPrice,
      couponType: c.couponType,
      validDate: c.validDate,
      isStackable: c.isStackable ?? false,
      canUsed: c.canUsed !== undefined ? c.canUsed : true,
      isUsed: c.isUsed || false,
      isExpired: c.isExpired || false,
    }));
  }
);

const initialState = {
  coupons: [],
  loading: false,
  error: null,
  selectedCouponIds: [],
};

const couponSlice = createSlice({
  name: 'coupon',
  initialState,
  reducers: {
    applyCoupon(state, action) {
  const { couponId, cartTotal } = action.payload;
  console.log('🚀 [reducer] applyCoupon called with:', couponId, cartTotal);

  console.log('🗂️ [reducer] state.coupons:', state.coupons);

  const coupon = state.coupons.find(c => String(c.id) === String(couponId));
  console.log('🔍 [reducer] coupon found:', coupon);

  if (coupon && isValidCoupon(coupon, cartTotal)) {
    const alreadySelected = state.selectedCouponIds.includes(String(couponId));
    console.log('✅ [reducer] alreadySelected:', alreadySelected);

    if (alreadySelected) {
      state.selectedCouponIds = state.selectedCouponIds.filter(id => id !== String(couponId));
      console.log('❎ [reducer] coupon removed, selectedCouponIds:', state.selectedCouponIds);
    } else {
      const selectedCoupons = state.coupons.filter(c =>
        state.selectedCouponIds.includes(String(c.id))
      );
      const hasNonStackable = selectedCoupons.some(c => !c.isStackable);
      console.log('🔗 [reducer] hasNonStackable:', hasNonStackable);

      if (hasNonStackable && coupon.isStackable) {
        console.log('⛔ [reducer] skip adding stackable because non-stackable selected');
        return;
      }

      if (!coupon.isStackable) {
        state.selectedCouponIds = [];
      }

      state.selectedCouponIds.push(String(couponId));
      console.log('✅ [reducer] coupon added, selectedCouponIds:', state.selectedCouponIds);
    }
  } else {
    console.log('⚠️ [reducer] coupon invalid or not found');
  }
}
,
    removeCoupon(state, action) {
      const { couponId } = action.payload;
      state.selectedCouponIds = state.selectedCouponIds.filter(id => String(id) !== String(couponId));

      if (state.selectedCouponIds.length === 0) {
        state.selectedCouponId = null;
      } else if (state.selectedCouponId === couponId) {
        state.selectedCouponId = state.selectedCouponIds[0];
      }
    },
    clearCoupon(state) {
      state.selectedCouponIds = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        console.log('✅ [fetchCoupons.fulfilled] payload:', action.payload);
        state.loading = false;
        state.coupons = action.payload;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { applyCoupon, removeCoupon, clearCoupon } = couponSlice.actions;

export const selectNormalizedCoupons = createSelector(
  state => state.coupon?.coupons,
  (coupons) => Array.isArray(coupons) ? coupons : []
);

export default couponSlice.reducer;
