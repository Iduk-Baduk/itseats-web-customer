// src/Store.js
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./modules";
import { loadCart } from "./store/localStorage";

// localStorage에서 주문 데이터 로드
const loadOrdersFromLocalStorage = () => {
  try {
    const serialized = localStorage.getItem("itseats-orders");
    return serialized ? JSON.parse(serialized) : [];
  } catch (e) {
    console.warn("Could not load orders from localStorage", e);
    return [];
  }
};

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

export default store;
