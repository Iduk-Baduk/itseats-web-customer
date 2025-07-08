import apiClient from "./apiClient";
import { logger } from "../utils/logger";

const StoreAPI = {
  // 전체 매장 목록 조회 API
  getStores: async ({ page }) => {
    try {
      const response = await apiClient.get("/stores/list", {
        params: { page },
      });
      // logger.log("✅ 매장 목록 조회 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 매장 목록 조회 요청 실패:", error);
      throw error;
    }
  },
  // 카테고리별 매장 목록 조회 API
  getStoresByCategory: async ({ category, sort, page, addressId }) => {
    try {
      const response = await apiClient.get(`/stores/list/${category}`, {
        params: { sort, page, addressId: Number(addressId) || null },
      });
      // logger.log("✅ 카테고리별 매장 목록 조회 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 카테고리별 매장 목록 조회 요청 실패:", error);
      throw error;
    }
  },
  // 매장 검색 API
  searchStores: async ({ keyword, sort, page, addressId }) => {
    try {
      const response = await apiClient.get("/search/stores/list", {
        params: { keyword, sort, page, addressId: Number(addressId) || null },
      });
      // logger.log("✅ 매장 검색 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 매장 검색 요청 실패:", error);
      throw error;
    }
  },
  // 매장 상세 정보 조회 API
  getStoreById: async (storeId) => {
    try {
      const response = await apiClient.get(`/stores/${storeId}`);
      // logger.log("✅ 매장 상세 정보 조회 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 매장 상세 정보 조회 요청 실패:", error);
      throw error;
    }
  },
  // 메뉴 조회 API
  getMenusByStoreId: async (storeId) => {
    try {
      const response = await apiClient.get(`/stores/${storeId}/menus`);
      // logger.log("✅ 매장 메뉴 조회 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 매장 메뉴 조회 요청 실패:", error);
      throw error;
    }
  },
  // 메뉴 옵션 조회 API
  getMenuOptionsByMenuId: async (storeId, menuId) => {
    try {
      const response = await apiClient.get(`/stores/${storeId}/menus/${menuId}/options`);
      logger.log("✅ 매장 메뉴 옵션 조회 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 매장 메뉴 옵션 조회 요청 실패:", error);
      throw error;
    }
  },
};

export default StoreAPI;
