// src/Store.js
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./modules";
import { loadCart } from "./store/localStorage";
import { loadOrdersFromLocalStorage } from "./store/orderSlice";

// ✅ localStorage에서 count 불러오기
const savedCount = localStorage.getItem("count");
const preloadedState = {
  cart: {
    orderMenus: loadCart() || [], // ✅ localStorage에서 장바구니 불러오기
  },
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
if (process.env.NODE_ENV === 'development') {
  window.__REDUX_STORE__ = store;
}

export default store;
