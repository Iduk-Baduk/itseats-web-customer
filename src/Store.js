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
      if (cartData.orderMenus || cartData.requestInfo) {
        return cartData;
      }
      // 기존 구조 (배열만 있는 경우) 호환성 유지
      if (Array.isArray(cartData)) {
        return {
          orderMenus: cartData,
          requestInfo: {
            storeRequest: '',
            deliveryRequest: '문 앞에 놔주세요 (초인종 O)',
            disposableChecked: false,
          }
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
    }
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

export default store;
