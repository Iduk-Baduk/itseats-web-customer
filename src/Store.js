// src/Store.js
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./modules";
import { loadCart } from "./store/localStorage";


// ✅ localStorage에서 count 불러오기
const savedCount = localStorage.getItem("count");
const preloadedState = {
  counter: {
    count: savedCount ? parseInt(savedCount, 10) : 0,
    cart: { orderMenus: loadCart() },
  },
};

const store = configureStore({
  reducer: rootReducer,
  preloadedState,
  devTools: true,
});

export default store;
