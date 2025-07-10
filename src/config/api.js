// API 설정 관리
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || parseInt(import.meta.env.VITE_TIMEOUT) || 10000,
};

// 환경별 설정
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  TOSS_CLIENT_KEY: import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq',
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
  ORDER_CONFIRM: '/orders/confirm',
  
  // 결제 관련
  CARDS: '/cards',
  CARD_BY_ID: (id) => `/cards/${id}`,
  ACCOUNTS: '/accounts',
  ACCOUNT_BY_ID: (id) => `/accounts/${id}`,
  PAYMENTS: '/payments',
  PAYMENT_BY_ID: (id) => `/payments/${id}`,
  PAYMENT_STATUS: (id) => `/payments/${id}/status`,
  PAYMENT_CONFIRM: (paymentId) => `/payments/${paymentId}/confirm`,
  
  // 쿠폰 관련
  COUPONS: '/coupons',
  COUPON_USE: (id) => `/coupons/${id}/use`,
  COUPON_AVAILABLE: '/coupons/available',
  COUPON_REGISTER: '/coupons/register',
  
  // 주소 관련
  ADDRESSES: '/addresses',
  ADDRESS_BY_ID: (id) => `/addresses/${id}`,
  
  // 매장 관련
  STORES: '/stores/list',
  STORES_BY_CATEGORY: (category) => `/stores/list/${category}`,
  STORE_SEARCH: '/search/stores/list',
  STORE_BY_ID: (id) => `/stores/${id}`,
  STORE_MENUS: (storeId) => `/stores/${storeId}/menus`,
  MENU_OPTIONS: (storeId, menuId) => `/stores/${storeId}/menus/${menuId}/options`,
  
  // 사용자 관련
  USER_PROFILE: '/members/me',
  USER_STATS: '/members/stats',
  USER_FAVORITES: '/members/favorites',
  USER_FAVORITE_BY_ID: (storeId) => `/members/favorites/${storeId}`,
  USER_REVIEWS: '/members/reviews',
  
  // 인증 관련 (백엔드 팀 제공 명세에 맞게 수정)
  AUTH_LOGIN: '/login',                    // ✅ POST /api/login (baseURL에 이미 /api 포함)
  AUTH_LOGOUT: '/auths/logout',            // ✅ POST /api/auths/logout?memberId={memberId}
  AUTH_REFRESH: '/auths/reissue',          // ✅ GET /api/auths/reissue?memberId={memberId}
  AUTH_REGISTER: '/members/sign-up',       // ✅ POST /api/members/sign-up
  AUTH_ME: '/members/me',                  // ✅ GET /api/members/me (인증 필요)
};

export default API_CONFIG; 
