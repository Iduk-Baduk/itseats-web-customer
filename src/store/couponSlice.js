import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { couponAPI } from '../services';

// 쿠폰 유효성 검사 함수
function isValidCoupon(coupon, cartTotal) {
  // console.log('🔍 === 쿠폰 유효성 검사 시작 ===');
  // console.log('🔍 검사할 쿠폰:', {
  //   id: coupon.id,
  //   name: coupon.name,
  //   discount: coupon.discount,
  //   type: coupon.type,
  //   minOrderAmount: coupon.minOrderAmount,
  //   validDate: coupon.validDate,
  //   isUsed: coupon.isUsed,
  //   isExpired: coupon.isExpired
  // });
  // console.log('🔍 장바구니 총액:', cartTotal);

  // 1. 유효기간 체크
  if (coupon.validDate) {
    // console.log('🔍 유효기간 검사 중...');
    const now = new Date();
    const validDate = new Date(coupon.validDate);
    // console.log('🔍 유효기간 비교:', {
    //   현재시간: now.toISOString(),
    //   유효기간: validDate.toISOString(),
    //   만료여부: now > validDate
    // });
    
    if (now > validDate) {
      // console.log('❌ [실패 원인] 유효기간 만료');
      return false;
    }
    // console.log('✅ 유효기간 검사 통과');
  } else {
    // console.log('ℹ️ 유효기간 없음 - 통과');
  }

  // 2. 최소 주문 금액 체크
  if (coupon.minOrderAmount) {
    // console.log('🔍 최소 주문 금액 검사 중...');
    // console.log('🔍 금액 비교:', {
    //   장바구니총액: cartTotal,
    //   최소주문금액: coupon.minOrderAmount,
    //   조건만족: cartTotal >= coupon.minOrderAmount
    // });
    
    if (cartTotal < coupon.minOrderAmount) {
      // console.log('❌ [실패 원인] 최소 주문 금액 미달성:', {
      //   필요금액: coupon.minOrderAmount,
      //   현재금액: cartTotal,
      //   부족금액: coupon.minOrderAmount - cartTotal
      // });
      return false;
    }
    // console.log('✅ 최소 주문 금액 검사 통과');
  } else {
    // console.log('ℹ️ 최소 주문 금액 없음 - 통과');
  }

  // 3. 사용 가능 여부 체크
  // console.log('🔍 사용 가능 여부 검사 중...');
  // console.log('🔍 사용 상태:', {
  //   isUsed: coupon.isUsed,
  //   isExpired: coupon.isExpired
  // });
  
  if (coupon.isUsed) {
    // console.log('❌ [실패 원인] 이미 사용된 쿠폰');
    return false;
  }
  
  if (coupon.isExpired) {
    // console.log('❌ [실패 원인] 만료된 쿠폰 (isExpired = true)');
    return false;
  }

  // console.log('✅ 사용 가능 여부 검사 통과');
  // console.log('🔍 === 쿠폰 유효성 검사 완료: 모든 조건 통과 ===');
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
      // console.log('🎫 === applyCoupon 액션 시작 ===');
      // console.log('🎫 받은 payload:', action.payload);
      
      const { couponId, cartTotal } = action.payload;
      
      // console.log('🎫 applyCoupon 액션 실행:', {
      //   couponId,
      //   cartTotal,
      //   type: typeof couponId,
      //   현재선택된쿠폰들: state.selectedCouponIds,
      //   전체쿠폰개수: state.coupons.length
      // });
      
      // cartTotal 검증
      if (cartTotal === undefined || cartTotal === null) {
        // console.error('❌ applyCoupon: cartTotal이 제공되지 않았습니다', { cartTotal });
        return;
      }
      
      // 쿠폰 찾기 (ID 타입 안전성 고려)
      const coupon = state.coupons.find(c => String(c.id) === String(couponId));
      // console.log('🎫 쿠폰 검색 결과:', {
      //   검색ID: couponId,
      //   검색ID타입: typeof couponId,
      //   찾은쿠폰: coupon ? {
      //     id: coupon.id,
      //     id타입: typeof coupon.id,
      //     name: coupon.name,
      //     discount: coupon.discount,
      //     isStackable: coupon.isStackable
      //   } : null,
      //   전체쿠폰IDs: state.coupons.map(c => ({ id: c.id, type: typeof c.id }))
      // });
      
      if (coupon) {
        // console.log('🎫 쿠폰 발견! 유효성 검사 진행...');
        const validationResult = isValidCoupon(coupon, cartTotal);
        // console.log('🎫 쿠폰 유효성 검사 결과:', {
        //   쿠폰: coupon.name,
        //   유효함: validationResult,
        //   장바구니총액: cartTotal,
        //   최소주문금액: coupon.minOrderAmount,
        //   이미사용됨: coupon.isUsed,
        //   만료됨: coupon.isExpired
        // });
        
        if (validationResult) {
          // console.log('✅ 쿠폰이 유효함! 중복 적용 가능 여부 확인...');
          
          // 이미 선택된 쿠폰인지 확인 (토글 방식)
          const alreadySelected = state.selectedCouponIds.some(id => String(id) === String(couponId));
          
          if (alreadySelected) {
            // 쿠폰 제거
            // console.log('🔄 쿠폰 제거:', couponId);
            state.selectedCouponIds = state.selectedCouponIds.filter(id => String(id) !== String(couponId));
          } else {
            // 새 쿠폰 추가 로직
            const selectedCoupons = state.coupons.filter(c => 
              state.selectedCouponIds.some(id => String(id) === String(c.id))
            );
            const hasNonStackable = selectedCoupons.some(c => !c.isStackable);
            
            // 이미 비중복 쿠폰이 선택되어 있으면 다른 쿠폰 선택 불가
            if (hasNonStackable && coupon.isStackable) {
              // console.error('❌ 쿠폰 적용 실패: 이미 중복 불가능한 쿠폰이 선택됨');
              return;
            }
            
            // 현재 쿠폰이 비중복이면 기존 쿠폰들을 모두 제거
            if (!coupon.isStackable) {
              // console.log('🔄 중복 불가능한 쿠폰 선택 - 기존 쿠폰들 제거');
              state.selectedCouponIds = [];
            }
            
            // console.log('✅ 쿠폰 추가:', couponId);
            state.selectedCouponIds.push(String(couponId));
          }

          // console.log('✅ 쿠폰 적용 성공!', {
          //   현재선택된쿠폰들: state.selectedCouponIds,
          //   적용된쿠폰이름들: state.coupons
          //     .filter(c => state.selectedCouponIds.some(id => String(id) === String(c.id)))
          //     .map(c => c.name)
          // });
        } else {
          // console.error('❌ 쿠폰 적용 실패: 유효하지 않은 쿠폰');
        }
      } else {
        // console.error('❌ 쿠폰 적용 실패: 쿠폰을 찾을 수 없음', {
        //   요청된쿠폰ID: couponId,
        //   요청된쿠폰ID타입: typeof couponId
        // });
      }
      
      // console.log('🎫 === applyCoupon 액션 종료 ===');
    },
    clearCoupon(state) {
      state.selectedCouponId = null;
      state.selectedCouponIds = [];
    },
    clearAllCoupons(state) {
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

export const { applyCoupon, clearCoupon, clearAllCoupons, applyCoupons, removeCoupon } = couponSlice.actions;
export default couponSlice.reducer;
