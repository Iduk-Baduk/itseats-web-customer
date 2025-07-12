import { logger } from './logger';

/**
 * API 재시도 유틸리티
 * @param {Function} apiCall - API 호출 함수
 * @param {Object} options - 재시도 옵션
 * @param {number} options.maxRetries - 최대 재시도 횟수 (기본값: 3)
 * @param {number} options.delay - 재시도 간격 (ms, 기본값: 1000)
 * @param {number} options.backoff - 지수 백오프 배수 (기본값: 2)
 * @param {Function} options.shouldRetry - 재시도 여부를 결정하는 함수
 * @returns {Promise} API 호출 결과
 */
export async function retryApiCall(apiCall, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = (error) => {
      // 네트워크 에러나 5xx 에러일 때만 재시도
      return !error.response || (error.response.status >= 500 && error.response.status < 600);
    }
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      lastError = error;
      
      // 마지막 시도이거나 재시도하지 않을 에러인 경우
      if (attempt === maxRetries || !shouldRetry(error)) {
        logger.error(`API 호출 실패 (시도 ${attempt + 1}/${maxRetries + 1}):`, error);
        throw error;
      }
      
      // 재시도 대기
      const waitTime = delay * Math.pow(backoff, attempt);
      logger.warn(`API 호출 실패, ${waitTime}ms 후 재시도 (${attempt + 1}/${maxRetries + 1}):`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
}

/**
 * 특정 API 엔드포인트에 대한 재시도 래퍼
 * @param {string} endpoint - API 엔드포인트
 * @param {Object} options - 재시도 옵션
 * @returns {Function} 재시도 로직이 포함된 API 함수
 */
export function createRetryableApi(endpoint, options = {}) {
  return {
    get: (params) => retryApiCall(() => fetch(`${endpoint}?${new URLSearchParams(params)}`), options),
    post: (data) => retryApiCall(() => fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }), options),
    put: (data) => retryApiCall(() => fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }), options),
    delete: () => retryApiCall(() => fetch(endpoint, { method: 'DELETE' }), options)
  };
}

/**
 * 주문 추적 전용 재시도 함수
 * @param {string} orderId - 주문 ID
 * @param {Function} apiCall - 주문 추적 API 호출 함수
 * @returns {Promise} 주문 추적 결과
 */
export async function retryOrderTracking(orderId, apiCall) {
  return retryApiCall(apiCall, {
    maxRetries: 2,
    delay: 2000,
    shouldRetry: (error) => {
      // 주문 추적은 500 에러나 네트워크 에러일 때만 재시도
      return !error.response || error.response.status === 500;
    }
  });
} 
