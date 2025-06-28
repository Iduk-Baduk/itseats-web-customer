// 안전한 ID 생성 유틸리티
export const generateUniqueId = (prefix = 'id') => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).slice(2, 11);
  return `${prefix}_${timestamp}_${randomStr}`;
};

// 주문 ID 생성
export const generateOrderId = () => {
  return generateUniqueId('order');
};

// 결제 ID 생성
export const generatePaymentId = () => {
  return generateUniqueId('payment');
};

// 사용자 ID 생성
export const generateUserId = () => {
  return generateUniqueId('user');
}; 
