// src/modules/index.js
import { combineReducers } from "redux";
import cart from "../store/cartSlice";
import counter from "./counterModule";
import paymentReducer from "../store/paymentSlice";
import addressReducer from "../store/addressSlice";
import orderReducer from "../store/orderSlice";
import couponReducer from "../store/couponSlice";
import storeReducer from "../store/storeSlice";
import searchReducer from "../store/searchSlice";

const rootReducer = combineReducers({
  cart, counter,
  payment: paymentReducer,
  address: addressReducer,
  order: orderReducer,
  coupon: couponReducer,
  store: storeReducer,
  search: searchReducer,
});

export default rootReducer;
