import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { couponAPI } from '../services';

// 쿠폰 유효성 검사 함수
const isValidCoupon = (coupon, cartTotal = 0) => {
  console.log('🔍 쿠폰 유효성 검사 시작:', {
    couponId: coupon.id,
    couponName: coupon.name,
    cartTotal,
    coupon: {
      validDate: coupon.validDate,
      minOrderAmount: coupon.minOrderAmount,
      isUsed: coupon.isUsed,
      isExpired: coupon.isExpired
    }
  });
  
  // 유효기간 검사
  if (coupon.validDate) {
    const validDate = coupon.validDate instanceof Date ? coupon.validDate : new Date(coupon.validDate);
    const now = new Date();
    if (now > validDate) {
      console.log('❌ 유효기간 만료:', { now, validDate });
      return false;
    }
  }
  
  // 최소 주문 금액 검사 (있는 경우)
  if (coupon.minOrderAmount && coupon.minOrderAmount > 0) {
    if (cartTotal < coupon.minOrderAmount) {
      console.log('❌ 최소 주문 금액 미달성:', { 
        required: coupon.minOrderAmount, 
        current: cartTotal 
      });
      return false;
    }
  }
  
  // 사용 가능 여부 검사
  if (coupon.isUsed || coupon.isExpired) {
    console.log('❌ 이미 사용된 쿠폰 또는 만료된 쿠폰:', { 
      isUsed: coupon.isUsed, 
      isExpired: coupon.isExpired 
    });
    return false;
  }
  
  console.log('✅ 쿠폰 유효성 검사 통과');
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
  selectedCouponIds: [], // 다중 쿠폰 선택 (API 스펙 대응)
};

const couponSlice = createSlice({
  name: 'coupon',
  initialState,
  reducers: {
    applyCoupon(state, action) {
      console.log('🎫 === applyCoupon 액션 시작 ===');
      console.log('🎫 받은 payload:', action.payload);
      
      const { couponId, cartTotal } = action.payload;
      
      console.log('🎫 applyCoupon 액션 실행:', {
        couponId,
        couponIdType: typeof couponId,
        cartTotal,
        cartTotalType: typeof cartTotal,
        availableCoupons: state.coupons.length,
        currentSelectedId: state.selectedCouponId,
        currentSelectedIds: state.selectedCouponIds,
        allCouponIds: state.coupons.map(c => ({ id: c.id, idType: typeof c.id }))
      });
      
      // cartTotal이 제공되지 않았을 때 경고
      if (cartTotal === undefined || cartTotal === null) {
        console.error('❌ applyCoupon: cartTotal이 제공되지 않았습니다', { cartTotal });
        return;
      }
      
      // ID 타입 안전한 검색 (문자열과 숫자 모두 고려)
      const coupon = state.coupons.find(c => c.id === couponId || c.id === String(couponId) || String(c.id) === String(couponId));
      console.log('🎫 쿠폰 검색 결과:', {
        찾은쿠폰: coupon,
        전체쿠폰수: state.coupons.length,
        검색한ID: couponId,
        검색한ID타입: typeof couponId,
        모든쿠폰: state.coupons.map(c => ({ id: c.id, idType: typeof c.id, name: c.name })),
        검색방법들: {
          정확일치: state.coupons.find(c => c.id === couponId),
          문자열변환: state.coupons.find(c => String(c.id) === String(couponId)),
          숫자변환시도: state.coupons.find(c => c.id === Number(couponId))
        }
      });
      
      if (coupon) {
        console.log('🎫 쿠폰 발견! 유효성 검사 진행...');
        const isValid = isValidCoupon(coupon, cartTotal);
        console.log('🎫 쿠폰 유효성 검사 결과:', { 
          isValid, 
          minOrderAmount: coupon.minOrderAmount,
          cartTotal,
          isUsed: coupon.isUsed,
          isExpired: coupon.isExpired
        });
        
        if (isValid) {
          console.log('✅ 쿠폰이 유효함! 상태 업데이트 시작...');
          const previousState = {
            selectedCouponId: state.selectedCouponId,
            selectedCouponIds: [...state.selectedCouponIds]
          };
          
          state.selectedCouponId = couponId;
          // 다중 쿠폰을 위한 배열도 업데이트
          if (!state.selectedCouponIds.includes(couponId)) {
            state.selectedCouponIds.push(couponId);
          }
          
          console.log('✅ 쿠폰 적용 성공!', {
            couponId,
            이전상태: previousState,
            새로운상태: {
              selectedCouponId: state.selectedCouponId,
              selectedCouponIds: [...state.selectedCouponIds]
            }
          });
        } else {
          console.error('❌ 쿠폰 적용 실패: 유효하지 않은 쿠폰');
        }
      } else {
        console.error('❌ 쿠폰 적용 실패: 쿠폰을 찾을 수 없음', {
          찾는ID: couponId,
          가능한ID들: state.coupons.map(c => c.id)
        });
      }
      console.log('🎫 === applyCoupon 액션 종료 ===');
    },
    clearCoupon(state) {
      state.selectedCouponId = null;
      state.selectedCouponIds = [];
    },
    // 다중 쿠폰 관리를 위한 새로운 액션들
    applyCoupons(state, action) {
      const { couponIds, cartTotal } = action.payload;
      
      if (cartTotal === undefined) {
        console.warn('applyCoupons: cartTotal이 제공되지 않았습니다');
        return;
      }
      
      const validCouponIds = couponIds.filter(couponId => {
        const coupon = state.coupons.find(c => c.id === couponId);
        return coupon && isValidCoupon(coupon, cartTotal);
      });
      
      state.selectedCouponIds = validCouponIds;
      // 첫 번째 쿠폰을 주 쿠폰으로 설정 (기존 로직 유지)
      state.selectedCouponId = validCouponIds[0] || null;
    },
    removeCoupon(state, action) {
      const couponId = action.payload;
      state.selectedCouponIds = state.selectedCouponIds.filter(id => id !== couponId);
      
      // 주 쿠폰이 제거된 경우 다음 쿠폰으로 업데이트
      if (state.selectedCouponId === couponId) {
        state.selectedCouponId = state.selectedCouponIds[0] || null;
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

// 정규화된 쿠폰 데이터 selector - fallback 필드 일관성 확보
export const selectNormalizedCoupons = (state) =>
  state.coupon.coupons.map(coupon => ({
    ...coupon,
    discount: coupon.discount || coupon.salePrice || 0,
    type: coupon.type || coupon.deliveryType || 'general',
    name: coupon.name || coupon.storeName || '이름 없는 쿠폰',
    description: coupon.description || (coupon.validDate ? 
      `${new Date(coupon.validDate).toLocaleDateString()}까지` : '설명 없음'),
    validDate: coupon.validDate || null,
    minOrderAmount: coupon.minOrderAmount || 0,
    isUsed: coupon.isUsed || false,
    isExpired: coupon.isExpired || false,
  }));

// 유효한 쿠폰만 선택하는 selector 추가
export const selectValidCoupons = (state, cartTotal = 0) =>
  selectNormalizedCoupons(state).filter(coupon => isValidCoupon(coupon, cartTotal));

export const { applyCoupon, clearCoupon, applyCoupons, removeCoupon } = couponSlice.actions;
export default couponSlice.reducer;
