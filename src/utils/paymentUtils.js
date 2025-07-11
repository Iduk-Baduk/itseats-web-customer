// 결제 관련 유틸리티 함수들

/**
 * 숫자 형식의 결제 ID 생성
 * 백엔드에서 Long 타입으로 받기 위해 숫자 형식 사용
 */
export const generatePaymentId = () => {
  // 현재 시간을 기반으로 한 고유한 숫자 ID 생성
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return timestamp + random;
};

/**
 * 주문 ID 생성 (숫자 형식)
 * 결제 생성 시 사용 - 백엔드에서 Long 타입으로 받기 위해 숫자 형식 사용
 */
export const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return timestamp + random; // 숫자 형식으로 변경
};

/**
 * 결제 ID가 유효한 숫자인지 확인
 */
export const isValidPaymentId = (paymentId) => {
  if (paymentId === null || paymentId === undefined) return false;
  
  // 숫자 또는 숫자 문자열인지 확인
  const num = Number(paymentId);
  return !isNaN(num) && num > 0 && Number.isInteger(num);
};

/**
 * 결제 ID를 안전하게 숫자로 변환
 * 백엔드에서 AUTO_INCREMENT 숫자 ID를 사용하므로 그대로 반환
 */
export const safeParsePaymentId = (paymentId) => {
  if (isValidPaymentId(paymentId)) {
    return Number(paymentId);
  }
  
  // 숫자가 아닌 경우 경고 로그만 출력하고 그대로 반환
  console.warn('paymentId가 숫자가 아닙니다:', paymentId, '타입:', typeof paymentId);
  return paymentId;
};

/**
 * 주문 ID가 유효한 숫자인지 확인 (결제 생성용)
 */
export const isValidOrderId = (orderId) => {
  if (orderId === null || orderId === undefined) return false;
  
  // 숫자 또는 숫자 문자열인지 확인
  const num = Number(orderId);
  return !isNaN(num) && num > 0 && Number.isInteger(num);
};

/**
 * 주문 ID를 안전하게 숫자로 변환 (결제 생성용)
 */
export const safeParseOrderId = (orderId) => {
  if (isValidOrderId(orderId)) {
    return Number(orderId);
  }
  
  // 문자열 형식이면 새로운 숫자 ID 생성
  if (typeof orderId === 'string' && orderId.includes('_')) {
    console.warn('문자열 형식의 orderId를 숫자로 변환할 수 없습니다. 새로운 ID를 생성합니다.');
    return generateOrderId();
  }
  
  // 기본값으로 현재 시간 사용
  return Date.now();
};

/**
 * 토스페이먼츠 결제 응답에서 결제 정보 추출
 */
export const extractPaymentInfo = (tossResponse) => {
  return {
    paymentKey: tossResponse.paymentKey,
    orderId: tossResponse.orderId, // 토스페이먼츠 주문 ID (문자열 그대로 유지)
    amount: tossResponse.totalAmount || tossResponse.amount,
    // paymentId는 별도로 관리 (숫자 형식)
    paymentId: generatePaymentId()
  };
};

/**
 * 결제 상태 확인
 */
export const getPaymentStatus = (status) => {
  const statusMap = {
    'READY': '결제 대기',
    'IN_PROGRESS': '결제 진행 중',
    'DONE': '결제 완료',
    'CANCELED': '결제 취소',
    'ABORTED': '결제 중단',
    'FAILED': '결제 실패'
  };
  
  return statusMap[status] || '알 수 없는 상태';
};

/**
 * 결제 금액 포맷팅
 */
export const formatPaymentAmount = (amount) => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

/**
 * 결제 에러 메시지 변환
 */
export const getPaymentErrorMessage = (error) => {
  const errorMessages = {
    'PAY_PROCESS_CANCELED': '결제가 취소되었습니다.',
    'PAY_PROCESS_ABORTED': '결제가 중단되었습니다.',
    'INVALID_CARD': '유효하지 않은 카드입니다.',
    'INSUFFICIENT_BALANCE': '잔액이 부족합니다.',
    'CARD_EXPIRED': '만료된 카드입니다.',
    'DUPLICATE_ORDER_ID': '중복된 주문번호입니다.',
    'INVALID_AMOUNT': '잘못된 결제 금액입니다.',
    'PAYMENT_NOT_FOUND': '결제 정보를 찾을 수 없습니다.',
    'ALREADY_PROCESSED_PAYMENT': '이미 처리된 결제입니다.',
    'NETWORK_ERROR': '네트워크 연결을 확인해주세요.',
    'TIMEOUT_ERROR': '요청 시간이 초과되었습니다.',
    'NUMBER_FORMAT_EXCEPTION': '결제 ID 형식이 올바르지 않습니다.',
    'SERVER_ERROR': '서버 일시적 오류가 발생했습니다.'
  };
  
  return errorMessages[error] || '결제 처리 중 오류가 발생했습니다.';
}; 
