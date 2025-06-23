// src/modules/index.js
import { combineReducers } from "redux";
import counter from "./counterModule";
import paymentReducer from "../store/paymentSlice"; // ✅ 추가
import addressReducer from "../store/addressSlice";

const rootReducer = combineReducers({
  counter,
  payment: paymentReducer, // ✅ 여기에 추가!
  address: addressReducer,
});

export default rootReducer;
