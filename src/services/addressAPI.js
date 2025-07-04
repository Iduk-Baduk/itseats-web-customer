import apiClient from "./apiClient";
import { logger } from "../utils/logger";

const AddressAPI = {
  // 주소 목록 조회 API
  getAddressList: async () => {
    try {
      const response = await apiClient.get("/addresses");
      // logger.log("✅ 주소 목록 조회 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 주소 목록 조회 요청 실패:", error);
      throw error;
    }
  },

  // 주소 추가 API
  createAddress: async (addressData) => {
    const { label, roadAddress, detailAddress, lat, lng } = addressData;

    if (!label || !roadAddress || lat === undefined || lng === undefined) {
      throw new Error("필수 주소 정보가 누락되었습니다.");
    }

    try {
      // API 명세에 맞춰 변환
      const newAddress = {
        mainAddress: roadAddress,
        detailAddress: detailAddress || "",
        lat,
        lng,
        addressCategory: getCategoryFromLabel(label),
      }

      const response = await apiClient.post("/addresses", newAddress);
      // logger.log("✅ 주소 추가 성공:", response.data);
      return response.data.addressId; // 성공적으로 추가된 주소 ID 반환

    } catch (error) {
      logger.error("📡 주소 추가 요청 실패:", error);
      throw error;
    }
  },

  // 주소 수정 API
  updateAddress: async (addressId, addressData) => {
    const { label, roadAddress, detailAddress, lat, lng } = addressData;

    if (!label || !roadAddress || lat === undefined || lng === undefined) {
      throw new Error("필수 주소 정보가 누락되었습니다.");
    }

    try {
      const updatedAddress = {
        mainAddress: roadAddress,
        detailAddress: detailAddress || "",
        lat,
        lng,
        addressCategory: getCategoryFromLabel(label),
      }

      const response = await apiClient.put(`/addresses/${addressId}`, updatedAddress);
      // logger.log("✅ 주소 수정 성공:", response.data);
      return response.data;

    } catch (error) {
      logger.error("📡 주소 수정 요청 실패:", error);
      throw error;
    }
  },

  // 주소 삭제 API
  deleteAddress: async (addressId) => {
    try {
      const response = await apiClient.delete(`/addresses/${addressId}`);
      // logger.log("✅ 주소 삭제 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 주소 삭제 요청 실패:", error);
      throw error;
    }
  },
};

function getCategoryFromLabel(label) {
  switch (label) {
    case "집":
      return "HOUSE";
    case "회사":
      return "COMPANY";
    default:
      return "NONE";
  }
}

export default AddressAPI;
