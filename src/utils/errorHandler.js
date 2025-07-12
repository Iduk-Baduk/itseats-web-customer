import { ENV_CONFIG } from '../config/api';

// 에러 타입 상수
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

// 에러 코드에 따른 메시지 매핑
const ERROR_MESSAGES = {
  400: '잘못된 요청입니다.',
  401: '로그인이 필요합니다.',
  403: '접근 권한이 없습니다.',
  404: '요청한 페이지를 찾을 수 없습니다.',
  409: '이미 존재하는 데이터입니다.',
  422: '입력한 정보를 확인해 주세요.',
  429: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  500: '서버 일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  502: '서버에 일시적인 문제가 있습니다.',
  503: '서비스를 일시적으로 사용할 수 없습니다.',
};

/**
 * 에러를 분석하고 사용자 친화적인 메시지로 변환
 * @param {Error} error - 발생한 에러
 * @returns {Object} 처리된 에러 정보
 */
export const processError = (error) => {
  let errorType = ERROR_TYPES.UNKNOWN_ERROR;
  let message = '알 수 없는 오류가 발생했습니다.';
  let statusCode = null;
  let originalError = error;

  // Axios 에러인 경우
  if (error.response) {
    statusCode = error.response.status;
    errorType = getErrorTypeByStatus(statusCode);
    
    // 백엔드에서 제공하는 메시지가 있으면 우선 사용
    if (error.response.data?.message) {
      message = error.response.data.message;
    } else {
      message = ERROR_MESSAGES[statusCode] || message;
    }
  } 
  // 네트워크 에러인 경우
  else if (error.request) {
    errorType = ERROR_TYPES.NETWORK_ERROR;
    message = '네트워크 연결을 확인해 주세요.';
  }
  // 기타 에러인 경우
  else {
    message = error.message || message;
  }

  // 개발 환경에서는 상세 정보 로깅
  if (ENV_CONFIG.isDevelopment) {
    console.group('🚨 Error Details');
    console.error('Type:', errorType);
    console.error('Message:', message);
    console.error('Status Code:', statusCode);
    console.error('Original Error:', originalError);
    console.groupEnd();
  }

  return {
    type: errorType,
    message,
    statusCode,
    originalError,
  };
};

/**
 * HTTP 상태 코드에 따른 에러 타입 반환
 * @param {number} statusCode - HTTP 상태 코드
 * @returns {string} 에러 타입
 */
const getErrorTypeByStatus = (statusCode) => {
  if (statusCode === 401 || statusCode === 403) {
    return ERROR_TYPES.AUTH_ERROR;
  }
  if (statusCode >= 400 && statusCode < 500) {
    return ERROR_TYPES.VALIDATION_ERROR;
  }
  if (statusCode >= 500) {
    return ERROR_TYPES.SERVER_ERROR;
  }
  return ERROR_TYPES.UNKNOWN_ERROR;
};

/**
 * 에러를 토스트로 표시하는 헬퍼 함수
 * @param {Error} error - 발생한 에러
 * @param {Function} showToast - 토스트 표시 함수
 */
export const handleErrorWithToast = (error, showToast) => {
  const processedError = processError(error);
  showToast(processedError.message);
};

/**
 * 주문 관련 에러 처리
 * @param {Error} error - 발생한 에러
 * @returns {Object} 주문 관련 에러 정보
 */
export const handleOrderError = (error) => {
  const processedError = processError(error);
  
  // 주문 관련 특별한 에러 처리
  if (processedError.statusCode === 409) {
    processedError.message = '이미 진행 중인 주문이 있습니다.';
  } else if (processedError.statusCode === 422) {
    processedError.message = '주문 정보를 확인해 주세요.';
  }
  
  return processedError;
};

/**
 * 결제 관련 에러 처리
 * @param {Error} error - 발생한 에러
 * @returns {Object} 결제 관련 에러 정보
 */
export const handlePaymentError = (error) => {
  const processedError = processError(error);
  
  // 결제 관련 특별한 에러 처리
  if (processedError.statusCode === 402) {
    processedError.message = '결제에 실패했습니다. 결제 정보를 확인해 주세요.';
  } else if (processedError.statusCode === 409) {
    processedError.message = '이미 등록된 결제 수단입니다.';
  }
  
  return processedError;
};

/**
 * 매장 관련 에러 처리
 * @param {Error} error - 발생한 에러
 * @returns {Object} 매장 관련 에러 정보
 */
export const handleStoreError = (error) => {
  const processedError = processError(error);
  
  // 매장 관련 특별한 에러 처리
  if (processedError.statusCode === 404) {
    processedError.message = '매장을 찾을 수 없습니다.';
  } else if (processedError.statusCode === 500) {
    processedError.message = '매장 정보를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.';
  } else if (processedError.statusCode === 401) {
    processedError.message = '로그인이 필요합니다.';
  }
  
  return processedError;
};

export default {
  processError,
  handleErrorWithToast,
  handleOrderError,
  handlePaymentError,
  handleStoreError,
  ERROR_TYPES,
}; 
