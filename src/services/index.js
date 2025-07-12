// API 서비스 통합 내보내기
export { default as apiClient } from './apiClient';
export { orderAPI } from './orderAPI';
export { paymentAPI } from './paymentAPI';
export { couponAPI } from './couponAPI';
export { userAPI } from './userAPI';
export { regist } from './authAPI';
export { tossPaymentAPI } from './tossPaymentAPI';

// 편의를 위한 통합 객체
export const API = {
  orders: () => import('./orderAPI').then(module => module.orderAPI),
  payments: () => import('./paymentAPI').then(module => module.paymentAPI),
  coupons: () => import('./couponAPI').then(module => module.couponAPI),
  user: () => import('./userAPI').then(module => module.userAPI),
  tossPayments: () => import('./tossPaymentAPI').then(module => module.tossPaymentAPI),
}; 
