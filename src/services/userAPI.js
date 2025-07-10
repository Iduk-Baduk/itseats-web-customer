import apiClient from './apiClient';
import { STORAGE_KEYS, logger } from '../utils/logger';
import { API_ENDPOINTS } from '../config/api';

// 재시도 설정
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryBackoff: 2,
};

// 재시도 로직
const retryRequest = async (requestFn, retryCount = 0) => {
  try {
    return await requestFn();
  } catch (error) {
    const isRetryableError = 
      error.statusCode >= 500 || 
      error.statusCode === 0 || 
      error.type === 'NETWORK_ERROR';
    
    if (isRetryableError && retryCount < RETRY_CONFIG.maxRetries) {
      const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.retryBackoff, retryCount);
      logger.warn(`📡 사용자 API 재시도 ${retryCount + 1}/${RETRY_CONFIG.maxRetries} (${delay}ms 후)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retryCount + 1);
    }
    
    throw error;
  }
};

// 토큰에서 사용자 ID 추출 유틸리티 (authAPI와 동일)
const extractUserIdFromToken = (token) => {
  if (!token) return null;
  
  try {
    // JWT 토큰인 경우 디코딩
    if (token.includes('.')) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.sub;
    }
    
    // 간단한 형식인 경우
    const parts = token.split('_');
    return parts.length > 1 ? parts[1] : null;
  } catch (error) {
    logger.error('토큰 파싱 실패:', error);
    return null;
  }
};

// 사용자 API 서비스
export const userAPI = {
  // 사용자 프로필 조회
  getProfile: async () => {
    try {
      logger.log('📡 사용자 프로필 조회 요청');
      
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.USER_PROFILE)
      );
      
      logger.log('✅ 사용자 프로필 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('❌ 사용자 프로필 조회 실패:', error);
      
      if (error.statusCode === 401) {
        error.message = '로그인이 필요합니다.';
      } else {
        error.message = '사용자 정보를 불러오는데 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 사용자 통계 정보 조회
  getStats: async () => {
    try {
      logger.log('📡 사용자 통계 조회 요청');
      
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.USER_STATS)
      );
      
      logger.log('✅ 사용자 통계 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('❌ 사용자 통계 조회 실패:', error);
      
      if (error.statusCode === 401) {
        error.message = '로그인이 필요합니다.';
      } else {
        error.message = '사용자 통계를 불러오는데 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 사용자 즐겨찾기 목록 조회
  getFavorites: async () => {
    try {
      logger.log('📡 사용자 즐겨찾기 목록 조회 요청');
      
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.USER_FAVORITES)
      );
      
      logger.log('✅ 사용자 즐겨찾기 목록 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('❌ 사용자 즐겨찾기 목록 조회 실패:', error);
      
      if (error.statusCode === 401) {
        error.message = '로그인이 필요합니다.';
      } else {
        error.message = '즐겨찾기 목록을 불러오는데 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 즐겨찾기 추가
  addFavorite: async (storeId) => {
    try {
      logger.log(`📡 즐겨찾기 추가 요청 (매장 ID: ${storeId})`);
      
      const response = await retryRequest(() => 
        apiClient.post(API_ENDPOINTS.USER_FAVORITES, { storeId })
      );
      
      logger.log('✅ 즐겨찾기 추가 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('❌ 즐겨찾기 추가 실패:', error);
      
      if (error.statusCode === 409) {
        error.message = '이미 즐겨찾기에 추가된 매장입니다.';
      } else if (error.statusCode === 404) {
        error.message = '매장을 찾을 수 없습니다.';
      } else {
        error.message = '즐겨찾기 추가에 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 즐겨찾기 삭제
  removeFavorite: async (storeId) => {
    try {
      logger.log(`📡 즐겨찾기 삭제 요청 (매장 ID: ${storeId})`);
      
      const response = await retryRequest(() => 
        apiClient.delete(API_ENDPOINTS.USER_FAVORITE_BY_ID(storeId))
      );
      
      logger.log('✅ 즐겨찾기 삭제 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('❌ 즐겨찾기 삭제 실패:', error);
      
      if (error.statusCode === 404) {
        error.message = '즐겨찾기에서 찾을 수 없습니다.';
      } else {
        error.message = '즐겨찾기 삭제에 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 사용자 리뷰 목록 조회
  getReviews: async (params = {}) => {
    try {
      const { page = 0, size = 20, ...rest } = params;
      
      logger.log('📡 사용자 리뷰 목록 조회 요청:', { page, size, ...rest });
      
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.USER_REVIEWS, { params: { page, size, ...rest } })
      );
      
      logger.log('✅ 사용자 리뷰 목록 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('❌ 사용자 리뷰 목록 조회 실패:', error);
      
      if (error.statusCode === 401) {
        error.message = '로그인이 필요합니다.';
      } else {
        error.message = '리뷰 목록을 불러오는데 실패했습니다.';
      }
      
      throw error;
    }
  },
};

export default userAPI; 
