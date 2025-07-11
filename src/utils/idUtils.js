// 안전한 ID 생성 유틸리티
export const generateUniqueId = (prefix = 'id') => {
  const timestamp = Date.now();
  // Math.random() 대신 타임스탬프 기반 고유 ID 생성
  const uniqueStr = timestamp.toString(36) + (typeof performance !== 'undefined' ? performance.now().toString(36).replace('.', '') : '0');
  return `${prefix}_${timestamp}_${uniqueStr}`;
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

/**
 * UUID를 Long 타입으로 변환
 * @param {string} uuid - UUID 문자열
 * @returns {number} Long 타입 숫자
 */
export const uuidToLong = (uuid) => {
  if (!uuid || typeof uuid !== 'string') {
    return null;
  }
  
  try {
    // UUID에서 하이픈 제거
    const cleanUuid = uuid.replace(/-/g, '');
    
    // 첫 16자리를 사용하여 숫자로 변환 (JavaScript의 Number.MAX_SAFE_INTEGER 제한 고려)
    const hexPart = cleanUuid.substring(0, 16);
    const longValue = parseInt(hexPart, 16);
    
    // 안전한 범위 내로 조정 (Java Long.MAX_VALUE = 9223372036854775807)
    const maxLong = 9223372036854775807;
    return longValue % maxLong;
  } catch (error) {
    console.warn('UUID를 Long으로 변환 실패:', error);
    return null;
  }
};

/**
 * UUID가 유효한지 확인
 * @param {string} uuid - UUID 문자열
 * @returns {boolean} 유효한 UUID 여부
 */
export const isValidUuid = (uuid) => {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * 큰 숫자를 안전하게 처리하는 유틸리티
 * JavaScript Number.MAX_SAFE_INTEGER 한계를 우회하기 위한 함수들
 */

/**
 * 큰 숫자를 문자열로 안전하게 변환
 * @param {string|number} value - 변환할 값
 * @returns {string} 안전한 문자열
 */
export const safeBigNumberToString = (value) => {
  if (!value) return '';
  
  // 이미 문자열인 경우 그대로 반환
  if (typeof value === 'string') {
    return value;
  }
  
  // 숫자인 경우 문자열로 변환
  if (typeof value === 'number') {
    return value.toString();
  }
  
  // 기타 타입은 문자열로 변환
  return String(value);
};

/**
 * 큰 숫자가 JavaScript 안전 범위 내에 있는지 확인
 * @param {string|number} value - 확인할 값
 * @returns {boolean} 안전 범위 내 여부
 */
export const isSafeNumber = (value) => {
  if (!value) return false;
  
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return !isNaN(num) && num <= Number.MAX_SAFE_INTEGER;
};

/**
 * paymentId를 백엔드 호환 형식으로 변환 (개선된 버전)
 * @param {string|number} paymentId - 원본 paymentId
 * @returns {string|null} 백엔드 호환 paymentId (문자열)
 */
export const convertPaymentIdForBackend = (paymentId) => {
  if (!paymentId) {
    return null;
  }
  
  // 문자열로 변환
  const paymentIdString = safeBigNumberToString(paymentId);
  
  // 숫자 형태인지 검증
  if (!/^\d+$/.test(paymentIdString)) {
    console.warn('paymentId가 숫자 형태가 아닙니다:', paymentId);
    return null;
  }
  
  // JavaScript 안전 범위를 초과하는 경우 경고
  if (!isSafeNumber(paymentIdString)) {
    console.warn('paymentId가 JavaScript 안전 범위를 초과합니다:', paymentIdString);
    console.warn('백엔드에서 문자열로 처리해야 합니다.');
  }
  
  return paymentIdString;
}; 
