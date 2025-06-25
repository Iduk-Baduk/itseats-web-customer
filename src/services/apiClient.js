import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { processError } from '../utils/errorHandler';

// API 클라이언트 생성
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    return response.data; // 자동으로 .data 반환
  },
  (error) => {
    // 통합 에러 처리
    const processedError = processError(error);
    
    // 인증 에러 처리
    if (processedError.statusCode === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
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
