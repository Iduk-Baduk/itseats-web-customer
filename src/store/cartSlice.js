// src/store/cartSlice.js
import { createSlice } from "@reduxjs/toolkit";
import isEqual from "lodash.isequal";

const initialState = {
  orderMenus: [], // [{ menuId, menuName, ... }]
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    initializeCart(state, action) {
      state.orderMenus = action.payload;
    },
    addMenu(state, action) {
      state.orderMenus.push(action.payload);
    },
    updateQuantity: (state, action) => {
  const { menuId, menuOption, delta } = action.payload;

  const index = state.orderMenus.findIndex(
    (menu) =>
      menu.menuId === menuId &&
      isEqual(menu.menuOption, menuOption) // deep equal
  );

  if (index !== -1) {
    const target = state.orderMenus[index];
    const newQuantity = target.quantity + delta;
    if (newQuantity >= 1) {
      target.quantity = newQuantity;
    }
  }
},
    removeMenu(state, action) {
      state.orderMenus = state.orderMenus.filter(
        (menu, idx) => idx !== action.payload
      );
    },
    clearCart(state) {
      state.orderMenus = [];
    },
  },
});

export const {
  initializeCart,
  addMenu,
  updateQuantity,
  removeMenu,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
