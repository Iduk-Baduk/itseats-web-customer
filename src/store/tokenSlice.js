import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  saveToken, 
  getToken, 
  isTokenValid, 
  clearToken, 
  isTokenExpiringSoon,
  getTokenInfo 
} from '../utils/tokenUtils';

// 초기 상태
const initialState = {
  token: null,
  isValid: false,
  isLoading: false,
  error: null,
  expiresAt: null,
  issuedAt: null,
  timeRemaining: 0,
  isExpiringSoon: false,
  lastChecked: null
};

// 비동기 액션: 토큰 저장
export const saveTokenAsync = createAsyncThunk(
  'token/saveToken',
  async ({ token, expiresIn }, { rejectWithValue }) => {
    try {
      saveToken(token, expiresIn);
      return { token, expiresIn };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 비동기 액션: 토큰 검증
export const validateTokenAsync = createAsyncThunk(
  'token/validateToken',
  async (_, { rejectWithValue }) => {
    try {
      const tokenInfo = getTokenInfo();
      return tokenInfo;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 비동기 액션: 토큰 갱신 (서버 API 호출)
// ⚠️ 현재 백엔드 지원 대기 중 - 실제 구현 시 아래 주석 해제
// TODO: 백엔드 API 구현 후 실제 토큰 갱신 로직으로 교체
// const response = await authAPI.refreshToken();
// return response.data;
export const refreshTokenAsync = createAsyncThunk(
  'token/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      // 백엔드 지원 대기 중
      throw new Error('토큰 갱신 기능은 현재 지원되지 않습니다. 백엔드 구현 대기 중입니다.');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 토큰 slice
const tokenSlice = createSlice({
  name: 'token',
  initialState,
  reducers: {
    // 토큰 상태 초기화
    initializeToken: (state) => {
      const tokenInfo = getTokenInfo();
      state.token = tokenInfo.hasToken ? getToken() : null;
      state.isValid = tokenInfo.isValid;
      state.expiresAt = tokenInfo.expiresAt;
      state.issuedAt = tokenInfo.issuedAt;
      state.timeRemaining = tokenInfo.timeRemaining;
      state.isExpiringSoon = tokenInfo.isExpiringSoon;
      state.lastChecked = Date.now();
    },

    // 토큰 상태 업데이트
    updateTokenState: (state) => {
      const tokenInfo = getTokenInfo();
      state.isValid = tokenInfo.isValid;
      state.timeRemaining = tokenInfo.timeRemaining;
      state.isExpiringSoon = tokenInfo.isExpiringSoon;
      state.lastChecked = Date.now();
    },

    // 토큰 삭제
    logout: (state) => {
      clearToken();
      state.token = null;
      state.isValid = false;
      state.expiresAt = null;
      state.issuedAt = null;
      state.timeRemaining = 0;
      state.isExpiringSoon = false;
      state.error = null;
      state.lastChecked = Date.now();
    },

    // 에러 초기화
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // saveTokenAsync
      .addCase(saveTokenAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveTokenAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.isValid = true;
        state.error = null;
        
        // 토큰 정보 업데이트
        const tokenInfo = getTokenInfo();
        state.expiresAt = tokenInfo.expiresAt;
        state.issuedAt = tokenInfo.issuedAt;
        state.timeRemaining = tokenInfo.timeRemaining;
        state.isExpiringSoon = tokenInfo.isExpiringSoon;
        state.lastChecked = Date.now();
      })
      .addCase(saveTokenAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // validateTokenAsync
      .addCase(validateTokenAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(validateTokenAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isValid = action.payload.isValid;
        state.timeRemaining = action.payload.timeRemaining;
        state.isExpiringSoon = action.payload.isExpiringSoon;
        state.lastChecked = Date.now();
        
        if (!action.payload.isValid) {
          clearToken(); // localStorage에서 토큰 삭제
          state.token = null;
          state.expiresAt = null;
          state.issuedAt = null;
        }
      })
      .addCase(validateTokenAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // refreshTokenAsync
      .addCase(refreshTokenAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isValid = action.payload.isValid;
        state.timeRemaining = action.payload.timeRemaining;
        state.isExpiringSoon = action.payload.isExpiringSoon;
        state.lastChecked = Date.now();
        state.error = null;
      })
      .addCase(refreshTokenAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        // 토큰 갱신 실패 시 로그아웃
        clearToken(); // localStorage에서 토큰 삭제
        state.token = null;
        state.isValid = false;
        state.expiresAt = null;
        state.issuedAt = null;
        state.timeRemaining = 0;
        state.isExpiringSoon = false;
      });
  }
});

export const { 
  initializeToken, 
  updateTokenState, 
  logout, 
  clearError 
} = tokenSlice.actions;

// 선택자 (안전한 접근)
export const selectToken = (state) => state.token?.token || null;
export const selectIsTokenValid = (state) => state.token?.isValid || false;
export const selectIsTokenLoading = (state) => state.token?.isLoading || false;
export const selectTokenError = (state) => state.token?.error || null;
export const selectTokenExpiresAt = (state) => state.token?.expiresAt || null;
export const selectTokenTimeRemaining = (state) => state.token?.timeRemaining || 0;
export const selectIsTokenExpiringSoon = (state) => state.token?.isExpiringSoon || false;
export const selectTokenLastChecked = (state) => state.token?.lastChecked || null;

export default tokenSlice.reducer; 
