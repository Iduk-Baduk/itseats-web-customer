import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { couponAPI } from '../services';

// 쿠폰 유효성 검사 함수
function isValidCoupon(coupon, cartTotal) {
  // 1. 유효기간 체크
  if (coupon.validDate) {
    const now = new Date();
    const validDate = new Date(coupon.validDate);
    
    if (now > validDate) {
      return false;
    }
  }

  // 2. 최소 주문 금액 체크
  if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
    return false;
  }

  // 3. 사용 가능 여부 체크
  if (coupon.isUsed || coupon.isExpired) {
    return false;
  }

  return true;
}

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
  selectedCouponIds: [], // 다중 쿠폰 선택 (API 스펙 대응)
};

const couponSlice = createSlice({
  name: 'coupon',
  initialState,
  reducers: {
    applyCoupon(state, action) {
      const { couponId, cartTotal } = action.payload;
      
      // cartTotal 검증
      if (cartTotal === undefined || cartTotal === null) {
        return;
      }
      
      // 쿠폰 찾기 (ID 타입 안전성 고려)
      const coupon = state.coupons.find(c => String(c.id) === String(couponId));
      
      if (coupon && isValidCoupon(coupon, cartTotal)) {
        // 이미 선택된 쿠폰인지 확인 (토글 방식)
        const alreadySelected = state.selectedCouponIds.some(id => String(id) === String(couponId));
        
        if (alreadySelected) {
          // 쿠폰 제거
          state.selectedCouponIds = state.selectedCouponIds.filter(id => String(id) !== String(couponId));
        } else {
          // 새 쿠폰 추가 로직
          const selectedCoupons = state.coupons.filter(c => 
            state.selectedCouponIds.some(id => String(id) === String(c.id))
          );
          const hasNonStackable = selectedCoupons.some(c => !c.isStackable);
          
          // 이미 비중복 쿠폰이 선택되어 있으면 다른 쿠폰 선택 불가
          if (hasNonStackable && coupon.isStackable) {
            return;
          }
          
          // 현재 쿠폰이 비중복이면 기존 쿠폰들을 모두 제거
          if (!coupon.isStackable) {
            state.selectedCouponIds = [];
          }
          
          state.selectedCouponIds.push(String(couponId));
        }

        // 단일 쿠폰 선택 호환성 유지
        state.selectedCouponId = state.selectedCouponIds.length > 0 ? state.selectedCouponIds[0] : null;
      }
    },
    
    clearCoupon(state) {
      state.selectedCouponId = null;
      state.selectedCouponIds = [];
    },
    
    clearAllCoupons(state) {
      state.selectedCouponIds = [];
      state.selectedCouponId = null;
    },
    
    applyCoupons(state, action) {
      const { couponIds, cartTotal } = action.payload;
      
      if (!Array.isArray(couponIds) || couponIds.length === 0) {
        return;
      }
      
      const validCouponIds = couponIds.filter(couponId => {
        const coupon = state.coupons.find(c => String(c.id) === String(couponId));
        return coupon && isValidCoupon(coupon, cartTotal);
      });
      
      state.selectedCouponIds = validCouponIds.map(id => String(id));
      state.selectedCouponId = validCouponIds.length > 0 ? validCouponIds[0] : null;
    },
    
    removeCoupon(state, action) {
      const { couponId } = action.payload;
      state.selectedCouponIds = state.selectedCouponIds.filter(id => String(id) !== String(couponId));
      
      // 제거된 쿠폰이 메인 선택 쿠폰이었다면 업데이트
      if (String(state.selectedCouponId) === String(couponId)) {
        state.selectedCouponId = state.selectedCouponIds.length > 0 ? state.selectedCouponIds[0] : null;
      }
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

export const { applyCoupon, clearCoupon, clearAllCoupons, applyCoupons, removeCoupon } = couponSlice.actions;

// 정규화된 쿠폰 데이터 selector (메모이제이션 적용)
export const selectNormalizedCoupons = createSelector(
  state => state.coupon?.coupons,
  (coupons) => {
    if (!Array.isArray(coupons)) {
      return [];
    }
    return coupons.map(coupon => ({
      ...coupon,
      id: String(coupon.id),
      discount: Number(coupon.discount || 0),
      minOrderAmount: Number(coupon.minOrderAmount || 0),
      isStackable: Boolean(coupon.isStackable)
    }));
  }
);

// 유효한 쿠폰만 반환하는 선택자
export const selectValidCoupons = (state, cartTotal = 0) =>
  selectNormalizedCoupons(state).filter(coupon => isValidCoupon(coupon, cartTotal));

export default couponSlice.reducer;
