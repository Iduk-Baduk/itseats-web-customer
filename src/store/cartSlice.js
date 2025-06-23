// src/store/cartSlice.js
import { createSlice } from "@reduxjs/toolkit";

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
    updateQuantity(state, action) {
      const { menuId, menuOption, delta } = action.payload;
      const target = state.orderMenus.find(
        (menu) =>
          menu.menuId === menuId &&
          JSON.stringify(menu.menuOption) === JSON.stringify(menuOption)
      );
      if (target) {
        target.quantity = Math.max(1, target.quantity + delta);
        const basePrice = target.menuPrice;
        const optionsPrice = target.menuOption.reduce((sum, group) => {
          return (
            sum +
            group.options.reduce((optSum, opt) => optSum + opt.optionPrice, 0)
          );
        }, 0);
        target.menuTotalPrice = (basePrice + optionsPrice) * target.quantity;
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
