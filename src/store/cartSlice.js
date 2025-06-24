import { createSlice } from "@reduxjs/toolkit";

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
    addToCart: (state, action) => {
      const newItem = action.payload;
      const existingItemIndex = state.orderMenus.findIndex(
        (item) => item.menuId === newItem.menuId && 
        JSON.stringify(item.selectedOptions) === JSON.stringify(newItem.selectedOptions)
      );

      if (existingItemIndex >= 0) {
        // 기존 아이템이 있으면 수량 증가
        state.orderMenus[existingItemIndex].quantity += newItem.quantity;
      } else {
        // 새 아이템 추가
        state.orderMenus.push(newItem);
      }
      
      saveToLocalStorage(state);
    },
    updateCartItem: (state, action) => {
      const { index, updates } = action.payload;
      if (index >= 0 && index < state.orderMenus.length) {
        state.orderMenus[index] = { ...state.orderMenus[index], ...updates };
        saveToLocalStorage(state);
      }
    },
    removeFromCart: (state, action) => {
      const index = action.payload;
      if (index >= 0 && index < state.orderMenus.length) {
        state.orderMenus.splice(index, 1);
        saveToLocalStorage(state);
      }
    },
    clearCart: (state) => {
      state.orderMenus = [];
      saveToLocalStorage(state);
    },
    updateQuantity: (state, action) => {
      const { index, quantity } = action.payload;
      if (index >= 0 && index < state.orderMenus.length) {
        if (quantity <= 0) {
          state.orderMenus.splice(index, 1);
        } else {
          state.orderMenus[index].quantity = quantity;
        }
        saveToLocalStorage(state);
      }
    },
  },
});

export const { 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart, 
  updateQuantity 
} = cartSlice.actions;

export default cartSlice.reducer; 
