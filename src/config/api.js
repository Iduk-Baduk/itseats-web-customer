// API 설정 관리
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  TIMEOUT: parseInt(process.env.REACT_APP_TIMEOUT) || 10000,
  MOCK_MODE: process.env.REACT_APP_MOCK_MODE === 'true',
};

// 환경별 설정
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  version: process.env.REACT_APP_VERSION || '1.0.0',
};

// API 엔드포인트 상수
export const API_ENDPOINTS = {
  // 주문 관련
  ORDERS: '/api/orders',
  ORDER_BY_ID: (id) => `/api/orders/${id}`,
  ORDER_STATUS: (id) => `/api/orders/${id}/status`,
  ORDER_TRACK: (id) => `/api/orders/${id}/track`,
  ORDER_CANCEL: (id) => `/api/orders/${id}/cancel`,
  ORDER_COMPLETE: (id) => `/api/orders/${id}/complete`,
  
  // 결제 관련
  CARDS: '/api/cards',
  CARD_BY_ID: (id) => `/api/cards/${id}`,
  ACCOUNTS: '/api/accounts',
  ACCOUNT_BY_ID: (id) => `/api/accounts/${id}`,
  PAYMENTS: '/api/payments',
  
  // 쿠폰 관련
  COUPONS: '/api/coupons',
  COUPON_USE: (id) => `/api/coupons/${id}/use`,
  COUPON_AVAILABLE: '/api/coupons/available',
  COUPON_REGISTER: '/api/coupons/register',
  
  // 인증 관련
  AUTH_REGISTER: '/api/members/regist',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_REFRESH: '/api/auth/refresh',
};

export default API_CONFIG; 
