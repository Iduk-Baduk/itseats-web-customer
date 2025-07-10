import apiClient from "./apiClient";
import { logger } from "../utils/logger";
import { API_ENDPOINTS } from "../config/api";

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
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.STORE_BY_ID(storeId))
      );
      logger.log("✅ 매장 상세 정보 조회 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 매장 상세 정보 조회 요청 실패:", error);
      
      if (error.statusCode === 404) {
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
