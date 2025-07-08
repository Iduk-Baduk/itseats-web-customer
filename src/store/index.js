// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import paymentReducer from "./paymentSlice";
import cartReducer from "./cartSlice";
import addressReducer from "./addressSlice";
import orderReducer from "./orderSlice";
import couponReducer from "./couponSlice";
import storeReducer from "./storeSlice";
import searchReducer from "./searchSlice";

// 이 파일은 사용되지 않음 (2025/07/08)
const store = configureStore({
  reducer: {
    cart: cartReducer,
    payment: paymentReducer,
    address: addressReducer,
    order: orderReducer,
    coupon: couponReducer,
    store: storeReducer,
    search: searchReducer,
  },
});

export default store;
