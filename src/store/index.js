// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import paymentReducer from "./paymentSlice";
import cartReducer from "./cartSlice";
import addressReducer from "./addressSlice";
import orderReducer from "./orderSlice";

const store = configureStore({
  reducer: {
    cart: cartReducer,
    payment: paymentReducer,
    address: addressReducer,
    order: orderReducer,
  },
});

export default store;
