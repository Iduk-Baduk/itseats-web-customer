// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import paymentReducer from "./paymentSlice";
import cartReducer from "./cartSlice";
import addressReducer from "./addressSlice";

const store = configureStore({
  reducer: {
    cart: cartReducer,
    payment: paymentReducer,
    address: addressReducer,
  },
});

export default store;
