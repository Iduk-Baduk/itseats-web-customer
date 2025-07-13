// 환경에 따른 로깅 유틸리티
export const logger = {
  log: (...args) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    if (import.meta.env.DEV) {
      console.error(...args);
    }
  }
};

// localStorage 키 상수
export const STORAGE_KEYS = {
  CURRENT_USER: 'currentUser',
  AUTH_TOKEN: 'itseats_access_token',
  ORDERS: 'itseats-orders',
  FAVORITES: 'itseats-favorites',
  RECENT_SEARCHES: 'itseats-recent-searches',
}; 
