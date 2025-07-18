import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { processError } from '../utils/errorHandler';
import AuthService from './authService';
import { logger } from '../utils/logger';

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
  async (config) => {
    // 인증이 필요한 API 엔드포인트인지 확인
    const requiresAuth = AuthService.requiresAuthForEndpoint(config.url || '');
    
    if (requiresAuth && !AuthService.isAuthenticated()) {
      logger.warn('인증이 필요한 API 요청이지만 토큰이 없음:', config.url);
      AuthService.redirectToLogin();
      return Promise.reject(new Error('로그인이 필요합니다.'));
    }

    // 토큰 추가 (비동기 처리)
    try {
      const token = await AuthService.getTokenAsync();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        logger.log(`🔐 요청에 토큰 추가: ${config.method?.toUpperCase()} ${config.url}`);
      }
    } catch (error) {
      logger.error('토큰 가져오기 실패:', error);
    }

    return config;
  },
  (error) => {
    logger.error('요청 인터셉터 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    return response.data; // 자동으로 .data 반환
  },
  async (error) => {
    // 서버 연결 실패 시 더 친화적인 메시지
    if (!error.response) {
      const networkError = new Error('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      networkError.type = 'NETWORK_ERROR';
      networkError.statusCode = 0;
      networkError.originalError = error;
      return Promise.reject(networkError);
    }

    // 401 에러 시 토큰 갱신 시도
    if (error.response.status === 401) {
      logger.warn('401 에러 발생, 토큰 갱신 시도');
      
      // 개발 환경에서는 401 에러 시 자동 로그아웃 비활성화
      if (import.meta.env.DEV) {
        logger.warn('개발 환경: 401 에러 발생했지만 자동 로그아웃을 건너뜁니다.');
        return Promise.reject(error);
      }
      
      const refreshSuccess = await AuthService.refreshToken();
      if (refreshSuccess) {
        // 토큰 갱신 성공 시 원래 요청 재시도
        const originalRequest = error.config;
        const newToken = AuthService.getToken();
        
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          logger.log('🔄 토큰 갱신 후 원래 요청 재시도');
          return apiClient(originalRequest);
        }
      } else {
        // 토큰 갱신 실패 시 로그인 페이지로 리다이렉트
        logger.warn('토큰 갱신 실패, 로그인 페이지로 리다이렉트');
        AuthService.removeToken();
        AuthService.redirectToLogin();
        return Promise.reject(new Error('로그인이 만료되었습니다. 다시 로그인해주세요.'));
      }
    }

    // 통합 에러 처리
    const processedError = processError(error);
    
    // 인증 에러 처리 (403 포함)
    if (processedError.statusCode === 401 || processedError.statusCode === 403) {
      logger.warn('인증 에러 발생:', processedError.message);
      AuthService.removeToken();
      AuthService.redirectToLogin();
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
