import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/apiClient';
import StoreAPI from '../services/storeAPI';

// 전체 매장 목록 조회 API 연동
export const fetchStores = createAsyncThunk(
  'store/fetchStores',
  async ({ page }) => {
    const data = await StoreAPI.getStores({ page });
    return data;
  }
);

// 특정 매장 정보 조회 API 연동
export const fetchStoreById = createAsyncThunk(
  'store/fetchStoreById',
  async (storeId) => {
    const data = await apiClient.get(`/stores/${storeId}`);
    // console.log('🏪 fetchStoreById API 응답:', data);
    return data;
  }
);

const initialState = {
  stores: [],
  currentPage: 0,
  hasNext: false,
  currentStore: null,
  loading: false,
  error: null,
};

const storeSlice = createSlice({
  name: 'store',
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
      });
  },
});

export const { setCurrentStore, clearCurrentStore } = storeSlice.actions;
export default storeSlice.reducer; 
