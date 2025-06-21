// src/modules/index.js
import { combineReducers } from "redux";
import counter from "./counterModule";
import paymentReducer from "../store/paymentSlice"; // ✅ 추가

const rootReducer = combineReducers({
  counter,
  payment: paymentReducer, // ✅ 여기에 추가!
});

export default rootReducer;
