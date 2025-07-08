import { v4 as uuidv4 } from 'uuid';

// 멱등성 키 생성
export const generateIdempotencyKey = () => {
  return uuidv4();
};

// 결제 금액 포맷팅 (원 단위)
export const formatAmount = (amount) => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

// 결제 상태 한글 변환
export const getPaymentStatusText = (status) => {
  const statusMap = {
    'READY': '결제 대기',
    'IN_PROGRESS': '결제 진행 중',
    'DONE': '결제 완료',
    'CANCELED': '결제 취소',
    'ABORTED': '결제 중단',
    'FAILED': '결제 실패'
  };
  return statusMap[status] || status;
};

// 결제 수단 한글 변환
export const getPaymentMethodText = (method) => {
  const methodMap = {
    'CARD': '카드',
    'TRANSFER': '계좌이체',
    'VIRTUAL_ACCOUNT': '가상계좌',
    'PHONE': '휴대폰',
    'GIFTCON': '상품권',
    'PAYPAL': '페이팔'
  };
  return methodMap[method] || method;
};

// 결제 데이터 검증
export const validatePaymentData = (paymentData) => {
  const required = ['amount', 'orderId', 'orderName', 'customerName'];
  const missing = required.filter(field => !paymentData[field]);
  
  if (missing.length > 0) {
    throw new Error(`필수 결제 정보가 누락되었습니다: ${missing.join(', ')}`);
  }

  if (paymentData.amount <= 0) {
    throw new Error('결제 금액은 0보다 커야 합니다.');
  }

  return true;
};

// URL 파라미터에서 결제 정보 추출
export const extractPaymentParams = (searchParams) => {
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const status = searchParams.get('status');

  return {
    paymentKey,
    orderId,
    amount: amount ? parseInt(amount) : null,
    status
  };
};

// 결제 에러 메시지 변환
export const getPaymentErrorMessage = (error) => {
  const errorMessages = {
    'INVALID_CARD': '유효하지 않은 카드입니다.',
    'INSUFFICIENT_BALANCE': '잔액이 부족합니다.',
    'CARD_EXPIRED': '만료된 카드입니다.',
    'INVALID_PIN': '잘못된 PIN 번호입니다.',
    'PAYMENT_CANCELED': '결제가 취소되었습니다.',
    'PAYMENT_FAILED': '결제에 실패했습니다.',
    'NETWORK_ERROR': '네트워크 오류가 발생했습니다.',
    'TIMEOUT': '결제 시간이 초과되었습니다.'
  };

  return errorMessages[error] || '결제 중 오류가 발생했습니다.';
};

// 결제 성공 여부 확인
export const isPaymentSuccess = (status) => {
  return status === 'DONE';
};

// 결제 실패 여부 확인
export const isPaymentFailed = (status) => {
  return ['CANCELED', 'ABORTED', 'FAILED'].includes(status);
};

// 결제 진행 중 여부 확인
export const isPaymentInProgress = (status) => {
  return ['READY', 'IN_PROGRESS'].includes(status);
}; 
