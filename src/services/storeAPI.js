import apiClient from "./apiClient";
import { logger } from "../utils/logger";
import { API_ENDPOINTS } from "../config/api";
import AuthService from "./authService";

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
    // 500 에러는 재시도하지 않음 (서버 내부 오류이므로)
    if (error.statusCode === 500) {
      throw error;
    }
    
    const isRetryableError = 
      error.statusCode >= 502 || 
      error.statusCode === 0 || 
      error.type === 'NETWORK_ERROR';
    
    if (isRetryableError && retryCount < RETRY_CONFIG.maxRetries) {
      const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.retryBackoff, retryCount);
      logger.warn(`📡 매장 API 재시도 ${retryCount + 1}/${RETRY_CONFIG.maxRetries} (${delay}ms 후)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retryCount + 1);
    }
    
    throw error;
  }
};

const StoreAPI = {
  // 전체 매장 목록 조회 API
  getStores: async ({ page }) => {
    try {
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.STORES, {
          params: { page },
        })
      );
      logger.log("✅ 매장 목록 조회 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 매장 목록 조회 요청 실패:", error);
      
      if (error.statusCode === 401) {
        error.message = '로그인이 필요합니다.';
      } else {
        error.message = '매장 목록을 불러오는데 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 카테고리별 매장 목록 조회 API
  getStoresByCategory: async ({ category, sort, page, addressId }) => {
    try {
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.STORES_BY_CATEGORY(category), {
          params: { sort, page, addressId: Number(addressId) || null },
        })
      );
      logger.log("✅ 카테고리별 매장 목록 조회 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 카테고리별 매장 목록 조회 요청 실패:", error);
      
      if (error.statusCode === 404) {
        error.message = '해당 카테고리를 찾을 수 없습니다.';
      } else {
        error.message = '매장 목록을 불러오는데 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 매장 검색 API
  searchStores: async ({ keyword, sort, page, addressId }) => {
    try {
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.STORE_SEARCH, {
          params: { keyword, sort, page, addressId: Number(addressId) || null },
        })
      );
      logger.log("✅ 매장 검색 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 매장 검색 요청 실패:", error);
      
      if (error.statusCode === 422) {
        error.message = '검색어를 확인해주세요.';
      } else {
        error.message = '매장 검색에 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 매장 상세 정보 조회 API
  getStoreById: async (storeId) => {
    try {
      logger.log(`📡 매장 상세 정보 조회 요청 (ID: ${storeId})`);
      
      // 인증 상태 확인
      const isAuthenticated = AuthService.isAuthenticated();
      logger.log(`🔐 인증 상태: ${isAuthenticated}`);
      
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.STORE_BY_ID(storeId))
      );
      
      // 백엔드 API 응답 구조에 맞춰 데이터 처리
      if (response.data && response.data.httpStatus === 200) {
        const storeData = response.data.data;
        logger.log("✅ 매장 상세 정보 조회 성공:", storeData);
        return {
          storeId: storeId,
          name: storeData.name,
          isLiked: storeData.isLiked || false,
          reviewRating: storeData.reviewRating || 0,
          reviewCount: storeData.reviewCount || 0,
          images: storeData.images || [],
          // 기존 프론트엔드 호환성을 위한 추가 필드
          storeImage: storeData.images?.[0] || "/samples/food1.jpg",
          rating: storeData.reviewRating || 0,
          reviewCount: storeData.reviewCount || 0
        };
      } else {
        throw new Error(response.data?.message || '매장 정보를 불러올 수 없습니다.');
      }
    } catch (error) {
      logger.error(`❌ 매장 상세 정보 조회 실패 (ID: ${storeId}):`, error);
      
      // 인증 관련 에러 처리
      if (error.statusCode === 401 || error.statusCode === 403) {
        logger.warn('매장 상세 정보 조회에 인증이 필요합니다. 로그인 페이지로 리다이렉트합니다.');
        AuthService.redirectToLogin();
        error.message = '로그인이 필요합니다.';
      } else if (error.statusCode === 500) {
        // 500 에러 시 임시 데이터 반환 (사용자 경험 개선)
        logger.warn('매장 상세 정보 조회 실패, 임시 데이터 반환');
        return {
          storeId: storeId,
          name: "매장 정보를 불러올 수 없습니다",
          isLiked: false,
          reviewRating: 0,
          reviewCount: 0,
          images: ["/samples/food1.jpg"],
          storeImage: "/samples/food1.jpg",
          rating: 0,
          reviewCount: 0,
          _isTemporary: true // 임시 데이터임을 표시
        };
      } else if (error.statusCode === 404) {
        error.message = '매장을 찾을 수 없습니다.';
      } else {
        error.message = '매장 정보를 불러오는데 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 메뉴 조회 API
  getMenusByStoreId: async (storeId) => {
    try {
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.STORE_MENUS(storeId))
      );
      logger.log("✅ 매장 메뉴 조회 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 매장 메뉴 조회 요청 실패:", error);
      
      if (error.statusCode === 404) {
        error.message = '매장을 찾을 수 없습니다.';
      } else {
        error.message = '메뉴를 불러오는데 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 메뉴 옵션 조회 API
  getMenuOptionsByMenuId: async (storeId, menuId) => {
    try {
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.MENU_OPTIONS(storeId, menuId))
      );
      logger.log("✅ 매장 메뉴 옵션 조회 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 매장 메뉴 옵션 조회 요청 실패:", error);
      
      if (error.statusCode === 404) {
        error.message = '메뉴를 찾을 수 없습니다.';
      } else {
        error.message = '메뉴 옵션을 불러오는데 실패했습니다.';
      }
      
      throw error;
    }
  },
};

export default StoreAPI;
