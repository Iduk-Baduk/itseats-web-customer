// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import paymentReducer from "./paymentSlice";
import addressReducer from "./addressSlice";
import cartReducer from "./cartSlice";

const store = configureStore({
  reducer: {
    payment: paymentReducer,
    address: addressReducer,
    cart: cartReducer,
  },
});

export default store;
