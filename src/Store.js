import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./modules";

const store = configureStore({
  reducer: rootReducer,
  devTools: true, // ✅ Redux DevTools 자동 지원
});

export default store;
