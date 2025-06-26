// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import paymentReducer from "./paymentSlice";
import cartReducer from "./cartSlice";
import addressReducer from "./addressSlice";
import orderReducer from "./orderSlice";
import couponReducer from "./couponSlice";
import storeReducer from "./storeSlice";

const store = configureStore({
  reducer: {
    cart: cartReducer,
    payment: paymentReducer,
    address: addressReducer,
    order: orderReducer,
    coupon: couponReducer,
    store: storeReducer,
  },
});

export default store;
