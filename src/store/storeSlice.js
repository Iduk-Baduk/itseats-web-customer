import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/apiClient";
import StoreAPI from "../services/storeAPI";

// 전체 매장 목록 조회 API 연동
export const fetchStores = createAsyncThunk(
  "store/fetchStores",
  async ({ page }) => {
    const data = await StoreAPI.getStores({ page });
    return data;
  }
);

// 카테고리별 매장 목록 조회 API 연동
export const fetchStoresByCategory = createAsyncThunk(
  "store/fetchStoresByCategory",
  async ({ category, sort, page, addressId, next }) => {
    console.log("Fetching stores by category:", { category, sort, page, addressId, next });
    // 카테고리별 매장
    const data = await StoreAPI.getStoresByCategory({
      category,
      sort,
      page,
      addressId,
    });
    data.next = next; // 무한스크롤로 다음페이지를 조회하는지 여부
    return data;
  }
);

// 매장 검색 API 연동
export const fetchStoresByKeyword = createAsyncThunk(
  "store/fetchStoresByKeyword",
  async ({ keyword, sort, page, addressId }) => {
    const data = await StoreAPI.searchStores({
      keyword,
      sort,
      page,
      addressId,
    });
    return data;
  }
);

// 매장 상세 정보 조회 API 연동
export const fetchStoreById = createAsyncThunk(
  "store/fetchStoreById",
  async (storeId) => {
    const data = await StoreAPI.getStoreById(storeId);
    return { ...data, storeId };
  }
);

// 메뉴 조회 API 연동
export const fetchMenusByStoreId = createAsyncThunk(
  "store/fetchMenusByStoreId",
  async (storeId) => {
    const data = await StoreAPI.getMenusByStoreId(storeId);
    return { ...data, storeId };
  }
);

// 메뉴 옵션 조회 API 연동
export const fetchMenuOptionsByMenuId = createAsyncThunk(
  "store/fetchMenuOptionsByMenuId",
  async ({ storeId, menuId }) => {
    const data = await StoreAPI.getMenuOptionsByMenuId(storeId, menuId);
    return { ...data, storeId };
  }
);

const initialState = {
  stores: [],
  currentPage: 0,
  hasNext: false,
  currentStore: {},
  currentMenu: {},
  loading: false,
  error: null,
};

const storeSlice = createSlice({
  name: "store",
  initialState,
  reducers: {
    setCurrentStore(state, action) {
      state.currentStore = action.payload;
    },
    clearCurrentStore(state) {
      state.currentStore = {};
      state.currentMenu = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // 매장 목록 조회
      .addCase(fetchStores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStores.fulfilled, (state, action) => {
        state.stores = action.payload.stores || [];
        state.currentPage = action.payload.page || 0;
        state.hasNext = action.payload.hasNext || false;
        state.loading = false;
      })
      .addCase(fetchStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 카테고리별 매장 목록 조회
      .addCase(fetchStoresByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStoresByCategory.fulfilled, (state, action) => {
        const newStores = action.payload.stores || [];

        console.log("fetchStoresByCategory.fulfilled: ", action.payload);

        // 기존 매장 목록과 새로 가져온 매장 목록 병합
        if (action.payload.next) {
          if (state.currentPage < action.payload.currentPage) { // 중복 방지
            state.stores = mergeUniqueStores(state.stores, newStores);
            state.currentPage = action.payload.currentPage || 0;
            state.hasNext = action.payload.hasNext || false;
          }
        } else {
          state.stores = newStores;
          state.currentPage = action.payload.currentPage || 0;
          state.hasNext = action.payload.hasNext || false;
        }
        console.log("Current page:", state.currentPage, "Has next:", state.hasNext);
        state.loading = false;
      })
      .addCase(fetchStoresByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 매장 검색
      .addCase(fetchStoresByKeyword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStoresByKeyword.fulfilled, (state, action) => {
        state.stores = action.payload.stores || [];
        state.currentPage = action.payload.page || 0;
        state.hasNext = action.payload.hasNext || false;
        state.loading = false;
      })
      .addCase(fetchStoresByKeyword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 매장 상세 정보 조회
      .addCase(fetchStoreById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStoreById.fulfilled, (state, action) => {
        // 현재 매장이 설정되어 있지 않거나, 다른 매장이라면 업데이트
        if (
          !state.currentStore ||
          state.currentStore.storeId !== action.payload.storeId
        ) {
          state.currentStore = action.payload;
          console.log("Updating current store with new data:", action.payload);
        } else if (state.currentStore.storeId === action.payload.storeId) {
          // 이미 같은 매장이라면 기존 메뉴를 유지
          state.currentStore = {
            ...state.currentStore,
            ...action.payload,
          };
        }
        state.loading = false;
      })
      .addCase(fetchStoreById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 메뉴 조회
      .addCase(fetchMenusByStoreId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenusByStoreId.fulfilled, (state, action) => {
        // 현재 매장이 설정되어 있지 않거나, 다른 매장이라면 업데이트
        if (
          !state.currentStore ||
          state.currentStore.storeId !== action.payload.storeId
        ) {
          state.currentStore = state.stores.find(
            (store) => store.storeId === action.payload.storeId
          ) || { storeId: action.payload.storeId };
        }

        // 메뉴 그룹별로 나눠진 메뉴를 평탄화
        const allMenus = action.payload.menuGroups.flatMap((group) =>
          group.menus.map((menu) => ({
            ...menu,
            groupName: group.groupName,
          }))
        );
        state.currentStore = {
          ...state.currentStore,
          menus: allMenus,
        };
        state.loading = false;
      })
      .addCase(fetchMenusByStoreId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 메뉴 옵션 조회
      .addCase(fetchMenuOptionsByMenuId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenuOptionsByMenuId.fulfilled, (state, action) => {
        // 메뉴 옵션을 현재 매장에 추가
        state.currentMenu = action.payload || {};
        state.loading = false;
      })
      .addCase(fetchMenuOptionsByMenuId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

// 유틸리티 함수: 매장 목록 병합
export function mergeUniqueStores(existingStores, newStores) {
  const storeMap = new Map();

  // 기존 매장 추가
  existingStores.forEach((store) => {
    storeMap.set(store.storeId, store);
  });

  // 새 매장 추가 (동일 ID가 있으면 덮어씀)
  newStores.forEach((store) => {
    storeMap.set(store.storeId, store);
  });

  return Array.from(storeMap.values());
}


export const { setCurrentStore, clearCurrentStore } = storeSlice.actions;
export default storeSlice.reducer;
