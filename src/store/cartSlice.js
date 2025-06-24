import { createSlice } from "@reduxjs/toolkit";
import { createMenuOptionHash } from "../utils/hashUtils";

const loadFromLocalStorage = () => {
  try {
    const serializedState = localStorage.getItem("itseats-cart");
    if (serializedState === null) {
      return {
        orderMenus: [],
      };
    }
    return JSON.parse(serializedState);
  } catch (e) {
    console.warn("Could not load cart state from localStorage", e);
    return {
      orderMenus: [],
    };
  }
};

const saveToLocalStorage = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("itseats-cart", serializedState);
  } catch (e) {
    console.warn("Could not save cart state to localStorage", e);
  }
};

const initialState = loadFromLocalStorage();

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
