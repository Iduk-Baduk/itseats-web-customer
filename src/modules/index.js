// src/modules/index.js
import { combineReducers } from "redux";
import cart from "../store/cartSlice";
import counter from "./counterModule";
import paymentReducer from "../store/paymentSlice"; // ✅ 추가
import addressReducer from "../store/addressSlice";
import orderReducer from "../store/orderSlice";
import couponReducer from "../store/couponSlice";
import storeReducer from "../store/storeSlice"; // ✅ storeReducer 추가

const rootReducer = combineReducers({
  cart, counter,
  payment: paymentReducer, // ✅ 여기에 추가!
  address: addressReducer,
  order: orderReducer,
  coupon: couponReducer, // ✅ 쿠폰 리듀서 추가
  store: storeReducer, // ✅ 매장 리듀서 추가
});

export default rootReducer;
