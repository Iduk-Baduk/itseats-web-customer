import apiClient from "./apiClient";
import { logger } from "../utils/logger";
import { API_ENDPOINTS } from "../config/api";
import AuthService from "./authService";
import { address, desc } from "motion/react-client";

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
      
      // 백엔드 응답 데이터 로깅
      logger.log("📦 백엔드 응답 데이터:", response.data);
      logger.log("📦 백엔드 응답 상태:", response.status);
      
      // 백엔드 API 응답 구조에 맞춰 데이터 처리
      if (response.data) {
        // 백엔드에서 httpStatus 필드가 있는 경우
        if (response.data.httpStatus === 200) {
          const storeData = response.data.data;
          logger.log("✅ 매장 상세 정보 조회 성공 (httpStatus):", storeData);
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
          };
        }
        // 백엔드에서 직접 데이터를 반환하는 경우
        else if (response.data.name) {
          return {
            storeId: storeId,
            name: response.data.name,
            isLiked: response.data.isLiked || false,
            reviewRating: response.data.review || 0, // 백엔드에서 'review' 필드 사용
            reviewCount: response.data.reviewCount || 0,
            images: response.data.images || [],
            // 기존 프론트엔드 호환성을 위한 추가 필드
            storeImage: response.data.images?.[0] || "/samples/food1.jpg",
            rating: response.data.review || 0,
            description: response.data.description || "",
            address: response.data.address || "",
            location: {
              lat: response.data.location?.lat || 37.4979,
              lng: response.data.location?.lng || 127.0276,
            },
            orderable: response.data.orderable || false,
            defaultDeliveryFee: response.data.defaultDeliveryFee || 0,
            onlyOneDeliveryFee: response.data.onlyOneDeliveryFee || 0,
          };
        }
      }
      
      // 응답 구조가 예상과 다른 경우
      throw new Error(response.data?.message || '매장 정보를 불러올 수 없습니다.');
    } catch (error) {
      logger.error(`❌ 매장 상세 정보 조회 실패 (ID: ${storeId}):`, error);
      
      // 인증 관련 에러 처리
      if (error.statusCode === 401 || error.statusCode === 403) {
        logger.warn('매장 상세 정보 조회에 인증이 필요합니다. 로그인 페이지로 리다이렉트합니다.');
        AuthService.redirectToLogin();
        error.message = '로그인이 필요합니다.';
      } else if (error.statusCode === 500) {
        logger.error('매장 상세 정보 조회 중 서버 오류(500) 발생');
        error.message = '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
        throw error;
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
