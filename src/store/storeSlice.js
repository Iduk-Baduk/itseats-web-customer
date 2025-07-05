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
  async ({ category, sort, page, addressId }) => {
    const data = await StoreAPI.getStoresByCategory({
      category,
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

const initialState = {
  stores: [],
  currentPage: 0,
  hasNext: false,
  currentStore: {},
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
      state.currentStore = null;
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
        state.stores = action.payload.stores || [];
        state.currentPage = action.payload.page || 0;
        state.hasNext = action.payload.hasNext || false;
        state.loading = false;
      })
      .addCase(fetchStoresByCategory.rejected, (state, action) => {
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
        if (!state.currentStore || state.currentStore.storeId !== action.payload.storeId) {
          state.currentStore = action.payload;
        }
        else if (state.currentStore.storeId === action.payload.storeId) {
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
        if (!state.currentStore || state.currentStore.storeId !== action.payload.storeId) {
          state.currentStore = state.stores.find(store => store.storeId === action.payload.storeId) || {};
        }

        // 메뉴 그룹별로 나눠진 메뉴를 평탄화
        const allMenus = action.payload.menuGroups.flatMap(group =>
          group.menus.map(menu => ({
            ...menu,
            groupName: group.groupName
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
      });
  },
});

export const { setCurrentStore, clearCurrentStore } = storeSlice.actions;
export default storeSlice.reducer;
