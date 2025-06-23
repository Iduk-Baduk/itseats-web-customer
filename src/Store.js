// src/Store.js
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./modules";
import { loadCart } from "./store/localStorage";


// ✅ localStorage에서 count 불러오기
const savedCount = localStorage.getItem("count");
const preloadedState = {
  cart: {
    orderMenus: loadCart() || [], // ✅ localStorage에서 장바구니 불러오기
  },
};

const store = configureStore({
  reducer: rootReducer,
  preloadedState,
  devTools: true,
});

export default store;
