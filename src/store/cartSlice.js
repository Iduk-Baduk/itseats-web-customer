// src/store/cartSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { createMenuOptionHash } from "../utils/hashUtils";

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
      const newItemHash = createMenuOptionHash(newItem.menuOption);
      const existingMenuIndex = state.orderMenus.findIndex(
        (menu) =>
          menu.menuId === newItem.menuId &&
          createMenuOptionHash(menu.menuOption) === newItemHash
      );

      if (existingMenuIndex !== -1) {
        state.orderMenus[existingMenuIndex].quantity += newItem.quantity;
      } else {
        state.orderMenus.push(newItem);
      }
    },
    updateQuantity: (state, action) => {
      const { menuId, menuOptionHash, delta } = action.payload;

      const index = state.orderMenus.findIndex(
        (menu) => 
          menu.menuId === menuId && 
          createMenuOptionHash(menu.menuOption) === menuOptionHash
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
      const { menuId, menuOptionHash } = action.payload;
      state.orderMenus = state.orderMenus.filter(
        (menu) =>
          menu.menuId !== menuId ||
          createMenuOptionHash(menu.menuOption) !== menuOptionHash
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
