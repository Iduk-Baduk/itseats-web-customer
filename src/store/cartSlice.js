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
      const newItem = action.payload;
      const existingMenuIndex = state.orderMenus.findIndex(
        (menu) =>
          menu.menuId === newItem.menuId &&
          isEqual(menu.menuOption, newItem.menuOption)
      );

      if (existingMenuIndex !== -1) {
        state.orderMenus[existingMenuIndex].quantity += newItem.quantity;
      } else {
        state.orderMenus.push(newItem);
      }
    },
    updateQuantity: (state, action) => {
      const { menuId, menuOption, delta } = action.payload;

      const index = state.orderMenus.findIndex(
        (menu) => menu.menuId === menuId && isEqual(menu.menuOption, menuOption) // deep equal
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
        (menu, idx) =>
          menu.menuId !== action.payload.menuId ||
          !isEqual(menu.menuOption, action.payload.menuOption)
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
