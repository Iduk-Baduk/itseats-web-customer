import apiClient from "./apiClient";
import { logger } from "../utils/logger";

const StoreAPI = {
    // 전체 매장 목록 조회 API
    getStores: async ({ page }) => {
        try {
            const response = await apiClient.get("/stores/list", { params: { page } });
            logger.log("✅ 매장 목록 조회 성공:", response.data);
            return response.data;
        } catch (error) {
            logger.error("📡 매장 목록 조회 요청 실패:", error);
            throw error;
        }
    },
}

export default StoreAPI;
