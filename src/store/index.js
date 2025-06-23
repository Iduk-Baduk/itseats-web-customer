// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import paymentReducer from "./paymentSlice";

const store = configureStore({
  reducer: {
    payment: paymentReducer,
  },
});

export default store;
