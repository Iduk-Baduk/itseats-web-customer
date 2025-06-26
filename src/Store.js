// src/Store.js
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./modules";
// import { loadCart } from "./store/localStorage"; // 현재 미사용
import { loadOrdersFromLocalStorage } from "./store/orderSlice";

// ✅ localStorage에서 count 불러오기 (현재 미사용)
// const savedCount = localStorage.getItem("count");
// localStorage에서 전체 카트 데이터 로드
const loadCartWithRequests = () => {
  try {
    const serializedCart = localStorage.getItem("itseats-cart");
    if (serializedCart) {
      const cartData = JSON.parse(serializedCart);
      // 새로운 구조에 맞게 데이터 반환
      if (cartData.orderMenus || cartData.requestInfo || cartData.currentStore) {
        return {
          orderMenus: cartData.orderMenus || [],
          requestInfo: cartData.requestInfo || {
            storeRequest: '',
            deliveryRequest: '문 앞에 놔주세요 (초인종 O)',
            disposableChecked: false,
          },
          currentStore: cartData.currentStore || null,
          _version: cartData._version,
          _migratedAt: cartData._migratedAt
        };
      }
      // 기존 구조 (배열만 있는 경우) 호환성 유지
      if (Array.isArray(cartData)) {
        return {
          orderMenus: cartData,
          requestInfo: {
            storeRequest: '',
            deliveryRequest: '문 앞에 놔주세요 (초인종 O)',
            disposableChecked: false,
          },
          currentStore: null
        };
      }
    }
  } catch (e) {
    console.warn("Could not load cart data from localStorage", e);
  }
  return {
    orderMenus: [],
    requestInfo: {
      storeRequest: '',
      deliveryRequest: '문 앞에 놔주세요 (초인종 O)',
      disposableChecked: false,
    },
    currentStore: null
  };
};

const preloadedState = {
  cart: loadCartWithRequests(), // ✅ localStorage에서 전체 카트 데이터 불러오기
  order: {
    orders: loadOrdersFromLocalStorage(),
    currentOrder: null,
    isLoading: false,
    error: null,
  },
};

const store = configureStore({
  reducer: rootReducer,
  preloadedState,
  devTools: true,
});

// 개발 환경에서 store를 window 객체에 노출 (테스트용)
if (import.meta.env.DEV) {
  window.__REDUX_STORE__ = store;
}

// 개발 환경에서 브라우저 콘솔에서 Redux 상태 확인을 위한 전역 함수
if (process.env.NODE_ENV === 'development') {
  window.debugRedux = {
    getState: () => store.getState(),
    getCart: () => store.getState().cart,
    getCoupons: () => store.getState().coupon,
    logCartState: () => {
      const state = store.getState();
      console.log('🛒 장바구니 상태:', {
        orderMenus: state.cart.orderMenus,
        menuCount: state.cart.orderMenus.length,
        cartTotal: state.cart.orderMenus.reduce((sum, menu) => {
          const price = menu.price || menu.menuPrice || menu.totalPrice || 0;
          return sum + (price * menu.quantity);
        }, 0)
      });
    },
    logCouponState: () => {
      const state = store.getState();
      console.log('🎫 쿠폰 상태:', {
        coupons: state.coupon.coupons,
        selectedCouponId: state.coupon.selectedCouponId,
        selectedCouponIds: state.coupon.selectedCouponIds,
        loading: state.coupon.loading,
        error: state.coupon.error
      });
    },
    logFullState: () => {
      console.log('🔍 전체 Redux 상태:', store.getState());
    }
  };
  
  console.log('🔧 Redux 디버깅 도구가 활성화되었습니다!');
  console.log('브라우저 콘솔에서 다음 명령어를 사용할 수 있습니다:');
  console.log('- debugRedux.logCartState() : 장바구니 상태 확인');
  console.log('- debugRedux.logCouponState() : 쿠폰 상태 확인');
  console.log('- debugRedux.logFullState() : 전체 상태 확인');
}

export default store;
