// 안전한 ID 생성 유틸리티
export const generateUniqueId = (prefix = 'id') => {
  const timestamp = Date.now();
  // Math.random() 대신 타임스탬프 기반 고유 ID 생성
  const uniqueStr = timestamp.toString(36) + (typeof performance !== 'undefined' ? performance.now().toString(36).replace('.', '') : '0');
  return `${prefix}_${timestamp}_${uniqueStr}`;
};

// 주문 ID 생성 (숫자 형식)
export const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return timestamp + random; // 숫자 형식으로 변경
};

// 결제 ID 생성
export const generatePaymentId = () => {
  return generateUniqueId('payment');
};

// 사용자 ID 생성
export const generateUserId = () => {
  return generateUniqueId('user');
}; 
