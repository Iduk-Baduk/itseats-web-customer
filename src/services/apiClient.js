import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { processError } from '../utils/errorHandler';
import { getToken, isTokenValid, clearToken } from '../utils/tokenUtils';

// API 클라이언트 생성
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    // 요청 정보 로깅
    console.log(`🔍 API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('🔍 요청 헤더:', config.headers);
    console.log('🔍 요청 데이터:', config.data);
    
    // 로그인 요청은 토큰 제외
    if (config.url?.includes('/login')) {
      console.log('🔓 로그인 요청 - 토큰 제외');
      return config;
    }

    // 토큰 유효성 검사 후 추가
    if (isTokenValid()) {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔐 토큰 추가됨');
      }
    } else {
      console.log('⚠️ 유효한 토큰 없음');
    }
    return config;
  },
  (error) => {
    console.error('❌ 요청 인터셉터 에러:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    // login 요청일 때는 전체 응답 반환
    if (response.config.url?.includes('/login')) {
      return response;
    }

    return response.data; // 자동으로 .data 반환
  },
  (error) => {
    // 서버 연결 실패 시 더 친화적인 메시지
    if (!error.response) {
      const networkError = new Error('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      networkError.type = 'NETWORK_ERROR';
      networkError.statusCode = 0;
      networkError.originalError = error;
      return Promise.reject(networkError);
    }

    // 통합 에러 처리
    const processedError = processError(error);
    
    // 인증 에러 처리
    if (processedError.statusCode === 401 || processedError.statusCode === 403) {
      clearToken();
      window.location.href = '/login';
    }
    
    // 500 에러 시 사용자 친화적 메시지
    if (processedError.statusCode === 500) {
      processedError.message = '서버 일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
    
    // 처리된 에러 정보로 새로운 에러 생성
    const enhancedError = new Error(processedError.message);
    enhancedError.type = processedError.type;
    enhancedError.statusCode = processedError.statusCode;
    enhancedError.originalError = processedError.originalError;
    
    return Promise.reject(enhancedError);
  }
);

export default apiClient; 
