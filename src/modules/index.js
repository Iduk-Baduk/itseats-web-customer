// src/modules/index.js
import { combineReducers } from "redux";
import cart from "../store/cartSlice";
import counter from "./counterModule";
import paymentReducer from "../store/paymentSlice"; // ✅ 추가
import addressReducer from "../store/addressSlice";
import orderReducer from "../store/orderSlice";

const rootReducer = combineReducers({
  cart, counter,
  payment: paymentReducer, // ✅ 여기에 추가!
  address: addressReducer,
  order: orderReducer,
});

export default rootReducer;
