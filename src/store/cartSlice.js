// src/store/cartSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { createMenuOptionHash } from "../utils/hashUtils";

// localStorage 저장 함수 추가
const saveToLocalStorage = (state) => {
  try {
    const serializedState = JSON.stringify({
      orderMenus: state.orderMenus,
      requestInfo: state.requestInfo
    });
    localStorage.setItem("itseats-cart", serializedState);
  } catch (e) {
    console.warn("Could not save cart state to localStorage", e);
  }
};

const initialState = {
  orderMenus: [], // [{ menuId, menuName, ... }]
  requestInfo: {
    storeRequest: '',
    deliveryRequest: '문 앞에 놔주세요 (초인종 O)',
    disposableChecked: false,
  },
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    initializeCart(state, action) {
      const cartData = action.payload || {};
      state.orderMenus = cartData.orderMenus || [];
      state.requestInfo = cartData.requestInfo || initialState.requestInfo;
      saveToLocalStorage(state);
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
      saveToLocalStorage(state);
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
        if (newQuantity <= 0) {
          // 수량이 0 이하가 되면 아이템 제거
          state.orderMenus.splice(index, 1);
        } else {
          target.quantity = newQuantity;
        }
        saveToLocalStorage(state);
      }
    },
    removeMenu(state, action) {
      const { menuId, menuOptionHash } = action.payload;
      state.orderMenus = state.orderMenus.filter(
        (menu) =>
          menu.menuId !== menuId ||
          createMenuOptionHash(menu.menuOption) !== menuOptionHash
      );
      saveToLocalStorage(state);
    },
    clearCart(state) {
      state.orderMenus = [];
      state.requestInfo = initialState.requestInfo;
      saveToLocalStorage(state);
    },
    updateRequestInfo(state, action) {
      state.requestInfo = { ...state.requestInfo, ...action.payload };
      saveToLocalStorage(state);
    },
  },
});

export const {
  initializeCart,
  addMenu,
  updateQuantity,
  removeMenu,
  clearCart,
  updateRequestInfo,
} = cartSlice.actions;

// Selectors
export const selectRequestInfo = (state) => state.cart.requestInfo;

export default cartSlice.reducer;
