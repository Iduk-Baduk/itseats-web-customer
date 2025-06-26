// src/store/cartSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { createMenuOptionHash } from "../utils/hashUtils";
import { loadAndMigrateCartData } from "../utils/dataMigration";

// localStorage 저장 함수 추가
const saveToLocalStorage = (state) => {
  try {
    const serializedState = JSON.stringify({
      orderMenus: state.orderMenus,
      requestInfo: state.requestInfo,
      currentStore: state.currentStore
    });
    localStorage.setItem("itseats-cart", serializedState);
  } catch (e) {
    console.warn("Could not save cart state to localStorage", e);
  }
};

// 마이그레이션된 데이터로 초기 상태 설정
const migratedCartData = loadAndMigrateCartData();

const initialState = {
  orderMenus: migratedCartData.orderMenus || [], // [{ menuId, menuName, ... }]
  requestInfo: migratedCartData.requestInfo || {
    storeRequest: '',
    deliveryRequest: '문 앞에 놔주세요 (초인종 O)',
    disposableChecked: false,
  },
  currentStore: migratedCartData.currentStore || null, // { storeId, storeName, storeImage }
  _version: migratedCartData._version,
  _migratedAt: migratedCartData._migratedAt,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    initializeCart(state, action) {
      const cartData = action.payload || {};
      state.orderMenus = cartData.orderMenus || [];
      state.requestInfo = cartData.requestInfo || initialState.requestInfo;
      state.currentStore = cartData.currentStore || null;
      saveToLocalStorage(state);
    },
    addMenu(state, action) {
      const newItem = action.payload;
      
      // 가게 정보 검증
      if (!newItem.storeId || !newItem.storeName) {
        console.error('addMenu: 가게 정보가 누락되었습니다', newItem);
        return;
      }

      // 첫 번째 메뉴 추가 시 현재 가게 설정
      if (state.orderMenus.length === 0) {
        state.currentStore = {
          storeId: newItem.storeId,
          storeName: newItem.storeName,
          storeImage: newItem.storeImage || null
        };
      }

      // 다른 가게 메뉴 추가 시도 시 에러 처리 (타입 안전 비교)
      if (state.currentStore && String(state.currentStore.storeId) !== String(newItem.storeId)) {
        // 이 경우는 UI에서 미리 확인 모달을 띄워야 함
        console.warn(`다른 가게 메뉴 추가 시도: 현재 가게 ${state.currentStore.storeId} (${typeof state.currentStore.storeId}), 새 가게 ${newItem.storeId} (${typeof newItem.storeId})`);
        return;
      }

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
    // 다른 가게 메뉴로 장바구니를 교체하는 액션
    replaceCartWithNewStore(state, action) {
      const newItem = action.payload;
      
      if (!newItem.storeId || !newItem.storeName) {
        console.error('replaceCartWithNewStore: 가게 정보가 누락되었습니다', newItem);
        return;
      }

      // 기존 장바구니 비우기
      state.orderMenus = [];
      state.requestInfo = initialState.requestInfo;
      
      // 새 가게 정보 설정
      state.currentStore = {
        storeId: newItem.storeId,
        storeName: newItem.storeName,
        storeImage: newItem.storeImage || null
      };

      // 새 메뉴 추가
      state.orderMenus.push(newItem);
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
          
          // 장바구니가 비어있으면 현재 가게 정보도 초기화
          if (state.orderMenus.length === 0) {
            state.currentStore = null;
          }
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
      
      // 장바구니가 비어있으면 현재 가게 정보도 초기화
      if (state.orderMenus.length === 0) {
        state.currentStore = null;
      }
      
      saveToLocalStorage(state);
    },
    clearCart(state) {
      state.orderMenus = [];
      state.requestInfo = initialState.requestInfo;
      state.currentStore = null;
      saveToLocalStorage(state);
    },
    updateRequestInfo(state, action) {
      state.requestInfo = { ...state.requestInfo, ...action.payload };
      saveToLocalStorage(state);
    },
    updateCurrentStore(state, action) {
      state.currentStore = action.payload;
      saveToLocalStorage(state);
    },
  },
});

export const {
  initializeCart,
  addMenu,
  replaceCartWithNewStore,
  updateQuantity,
  removeMenu,
  clearCart,
  updateRequestInfo,
  updateCurrentStore,
} = cartSlice.actions;

// Selectors
export const selectRequestInfo = (state) => state.cart.requestInfo;
export const selectCurrentStore = (state) => state.cart.currentStore;
export const selectCartItemCount = (state) => state.cart.orderMenus.reduce((sum, menu) => sum + menu.quantity, 0);

export default cartSlice.reducer;
