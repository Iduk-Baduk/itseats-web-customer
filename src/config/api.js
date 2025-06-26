// API 설정 관리
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  TIMEOUT: parseInt(import.meta.env.VITE_TIMEOUT) || 10000,
};

// 환경별 설정
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
};

// API 엔드포인트 상수
export const API_ENDPOINTS = {
  // 주문 관련
  ORDERS: '/orders',
  ORDER_BY_ID: (id) => `/orders/${id}`,
  ORDER_STATUS: (id) => `/orders/${id}/status`,
  ORDER_TRACK: (id) => `/orders/${id}/track`,
  ORDER_CANCEL: (id) => `/orders/${id}/cancel`,
  ORDER_COMPLETE: (id) => `/orders/${id}/complete`,
  
  // 결제 관련
  CARDS: '/cards',
  CARD_BY_ID: (id) => `/cards/${id}`,
  ACCOUNTS: '/accounts',
  ACCOUNT_BY_ID: (id) => `/accounts/${id}`,
  PAYMENTS: '/payments',
  
  // 쿠폰 관련
  COUPONS: '/coupons',
  COUPON_USE: (id) => `/coupons/${id}/use`,
  COUPON_AVAILABLE: '/coupons/available',
  COUPON_REGISTER: '/coupons/register',
  
  // 인증 관련
  AUTH_REGISTER: '/members/regist',
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh',
};

export default API_CONFIG; 
