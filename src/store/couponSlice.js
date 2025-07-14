import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { couponAPI } from '../services';

function isValidCoupon(coupon, cartTotal) {

  if (!coupon.canUsed) {
    return false;
  }

  const now = new Date();
  const validDate = new Date(coupon.validDate);
  if (now > validDate) {
    return false;
  }

  if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
    return false;
  }

  if (coupon.isUsed || coupon.isExpired) {
    return false;
  }

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

  const coupon = state.coupons.find(c => String(c.id) === String(couponId));

  if (coupon && isValidCoupon(coupon, cartTotal)) {
    const alreadySelected = state.selectedCouponIds.includes(String(couponId));

    if (alreadySelected) {
      state.selectedCouponIds = state.selectedCouponIds.filter(id => id !== String(couponId));
    } else {
      const selectedCoupons = state.coupons.filter(c =>
        state.selectedCouponIds.includes(String(c.id))
      );
      const hasNonStackable = selectedCoupons.some(c => !c.isStackable);

      if (hasNonStackable && coupon.isStackable) {
        return;
      }

      if (!coupon.isStackable) {
        state.selectedCouponIds = [];
      }

      state.selectedCouponIds.push(String(couponId));
    }
  } 
}
,
    removeCoupon(state, action) {
      const { couponId } = action.payload;
      state.selectedCouponIds = state.selectedCouponIds.filter(id => String(id) !== String(couponId));
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
