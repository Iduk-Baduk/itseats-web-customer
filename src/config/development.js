// 개발 환경 설정
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000
};

export const DEV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  apiBaseUrl: 'http://localhost:8080/api',
  localStoragePrefix: 'itseats_dev_',
  maxOrderHistory: 50,
  cleanupThreshold: 100
}; 
