// src/config/development.js
export const DEFAULT_USER = {
  id: "2",
  name: "어드민",
  email: "admin@test.com",
  phone: "010-1234-1234"
};

export function generateDevToken(userId) {
  return `token_${userId}_${Date.now()}`;
}

export const DEV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  apiBaseUrl: 'http://localhost:3000',
  mockApiEnabled: true,
  defaultSimulationInterval: 1000,
  maxSimulationInterval: 10000,
  minSimulationInterval: 1000,
  localStoragePrefix: 'itseats_dev_',
  maxOrderHistory: 50,
  cleanupThreshold: 100
}; 
