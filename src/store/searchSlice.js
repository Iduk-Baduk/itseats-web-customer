import { createSlice } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from "../utils/logger";

// localStorage에서 초기값 불러오기
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load recent keywords from storage', e);
    return [];
  }
};

// localStorage에 저장
const saveToStorage = (keywords) => {
  try {
    localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(keywords));
  } catch (e) {
    console.error('Failed to save recent keywords to storage', e);
  }
};

const MAX_COUNT = 6;

const initialState = {
  keywords: loadFromStorage(),
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    addKeyword: (state, action) => {
      const keyword = action.payload.trim();
      if (!keyword) return;

      const today = new Date();
      const date = `${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

      // 중복 제거
      state.keywords = state.keywords.filter(item => item.keyword !== keyword);

      // 앞에 추가
      state.keywords.unshift({ keyword, date });

      // 최대 개수 유지
      if (state.keywords.length > MAX_COUNT) {
        state.keywords.pop();
      }

      saveToStorage(state.keywords);
    },

    removeKeyword: (state, action) => {
      state.keywords = state.keywords.filter(item => item.keyword !== action.payload);
      saveToStorage(state.keywords);
    },

    clearKeywords: (state) => {
      state.keywords = [];
      saveToStorage([]);
    },
  },
});

export const { addKeyword, removeKeyword, clearKeywords } = searchSlice.actions;
export default searchSlice.reducer;
