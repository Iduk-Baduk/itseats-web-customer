import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/apiClient";

// 매장 목록 조회 API 연동
export const fetchStores = createAsyncThunk("store/fetchStores", async () => {
  const data = await apiClient.get("/stores/list");
  // console.log('🏪 fetchStores API 응답:', data.data.stores);
  return data.data.stores;
});

// 카테고리별 매장 목록 조회 API 연동
export const fetchStoresByCategory = createAsyncThunk(
  "store/fetchStoresByCategory",
  async (category) => {
    const data = await apiClient.get(`/stores/list/${category}`);
    // console.log('🏪 fetchStoresByCategory API 응답:', data.data.stores);
    return data.data.stores;
  }
);

// 특정 매장 정보 조회 API 연동
export const fetchStoreById = createAsyncThunk(
  "store/fetchStoreById",
  async (storeId) => {
    const data = await apiClient.get(`/stores/${storeId}`);
    // console.log('🏪 fetchStoreById API 응답:', data.data);
    return data.data;
  }
);

// 메뉴 목록 조회 API 연동
export const fetchMenusByStoreId = createAsyncThunk(
  "store/fetchMenusByStoreId",
  async (storeId) => {
    const data = await apiClient.get(`/stores/${storeId}/menus`);
    // console.log('🏪 fetchMenusByStoreId API 응답:', data.data);
    return data.data.menuGroups;
  }
);

// 메뉴 옵션 조회 API 연동
export const fetchMenuOptionsById = createAsyncThunk(
  "store/fetchMenuOptionsById",
  async ({ storeId, menuId }) => {
    const data = await apiClient.get(`/stores/${storeId}/${menuId}/options`);
    // console.log('🏪 fetchMenuOptionsById API 응답:', data.data);
    return data.data;
  }
);

const initialState = {
  stores: [],
  currentStore: null,
  currentMenuGroups: null,
  currentMenuOptions: null,
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
        state.loading = false;
        state.stores = action.payload;
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
        state.loading = false;
        state.stores = action.payload;
      })
      .addCase(fetchStoresByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 특정 매장 조회
      .addCase(fetchStoreById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStoreById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentStore = action.payload;
      })
      .addCase(fetchStoreById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 메뉴 목록 조회
      .addCase(fetchMenusByStoreId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenusByStoreId.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMenuGroups = action.payload;
      })
      .addCase(fetchMenusByStoreId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 메뉴 옵션 조회
      .addCase(fetchMenuOptionsById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenuOptionsById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMenuOptions = action.payload;
      })
      .addCase(fetchMenuOptionsById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setCurrentStore, clearCurrentStore } = storeSlice.actions;
export default storeSlice.reducer;
