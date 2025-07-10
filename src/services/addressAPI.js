import apiClient from "./apiClient";
import { logger } from "../utils/logger";
import { API_ENDPOINTS } from "../config/api";

// 재시도 설정
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1초
  retryBackoff: 2, // 지수 백오프
};

// 재시도 로직
const retryRequest = async (requestFn, retryCount = 0) => {
  try {
    return await requestFn();
  } catch (error) {
    // 재시도 가능한 에러인지 확인 (500, 502, 503, 네트워크 에러)
    const isRetryableError = 
      error.statusCode >= 500 || 
      error.statusCode === 0 || 
      error.type === 'NETWORK_ERROR';
    
    if (isRetryableError && retryCount < RETRY_CONFIG.maxRetries) {
      const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.retryBackoff, retryCount);
      logger.warn(`📡 주소 API 재시도 ${retryCount + 1}/${RETRY_CONFIG.maxRetries} (${delay}ms 후)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retryCount + 1);
    }
    
    throw error;
  }
};

// 로컬 스토리지에서 주소 목록 가져오기
const getAddressesFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem("itseats-address");
    if (stored) {
      const data = JSON.parse(stored);
      return data.addresses || [];
    }
  } catch (error) {
    logger.warn("로컬 스토리지에서 주소 목록을 가져오는데 실패했습니다:", error);
  }
  return [];
};

const AddressAPI = {
  // 주소 목록 조회 API
  getAddressList: async () => {
    try {
      const response = await retryRequest(() => apiClient.get(API_ENDPOINTS.ADDRESSES));
      logger.log("✅ 주소 목록 조회 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 주소 목록 조회 요청 실패:", error);
      
      // 서버 오류 시 로컬 스토리지에서 데이터 반환
      if (error.statusCode >= 500 || error.type === 'NETWORK_ERROR') {
        logger.info("🔄 서버 오류로 인해 로컬 데이터를 사용합니다.");
        const localAddresses = getAddressesFromLocalStorage();
        if (localAddresses.length > 0) {
          return localAddresses.map(addr => ({
            addressId: addr.id,
            mainAddress: addr.roadAddress || addr.address,
            detailAddress: addr.detailAddress || "",
            lat: addr.lat,
            lng: addr.lng,
            addressCategory: addr.label === "집" ? "HOUSE" : addr.label === "회사" ? "COMPANY" : "NONE",
          }));
        }
      }
      
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

      const response = await retryRequest(() => apiClient.post(API_ENDPOINTS.ADDRESSES, newAddress));
      logger.log("✅ 주소 추가 성공:", response.data);
      return response.data.addressId; // 성공적으로 추가된 주소 ID 반환

    } catch (error) {
      logger.error("📡 주소 추가 요청 실패:", error);
      
      // 서버 오류 시 로컬에 임시 저장
      if (error.statusCode >= 500 || error.type === 'NETWORK_ERROR') {
        logger.warn("🔄 서버 오류로 인해 주소가 로컬에 임시 저장됩니다.");
        const tempId = `temp_${Date.now()}`;
        const localAddress = {
          id: tempId,
          label,
          address: [roadAddress, detailAddress].filter(Boolean).join(' '),
          roadAddress,
          detailAddress,
          lat,
          lng,
          isTemporary: true,
        };
        
        // 로컬 스토리지에 임시 저장
        const stored = localStorage.getItem("itseats-address");
        const data = stored ? JSON.parse(stored) : { addresses: [], selectedAddressId: null };
        data.addresses.push(localAddress);
        if (!data.selectedAddressId) {
          data.selectedAddressId = tempId;
        }
        localStorage.setItem("itseats-address", JSON.stringify(data));
        
        return tempId;
      }
      
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

      const response = await retryRequest(() => apiClient.put(API_ENDPOINTS.ADDRESS_BY_ID(addressId), updatedAddress));
      logger.log("✅ 주소 수정 성공:", response.data);
      return response.data;

    } catch (error) {
      logger.error("📡 주소 수정 요청 실패:", error);
      
      // 서버 오류 시 로컬 업데이트
      if (error.statusCode >= 500 || error.type === 'NETWORK_ERROR') {
        logger.warn("🔄 서버 오류로 인해 주소가 로컬에서만 수정됩니다.");
        const stored = localStorage.getItem("itseats-address");
        if (stored) {
          const data = JSON.parse(stored);
          const index = data.addresses.findIndex(addr => addr.id === addressId);
          if (index !== -1) {
            data.addresses[index] = {
              ...data.addresses[index],
              label,
              address: [roadAddress, detailAddress].filter(Boolean).join(' '),
              roadAddress,
              detailAddress,
              lat,
              lng,
              isTemporary: true,
            };
            localStorage.setItem("itseats-address", JSON.stringify(data));
          }
        }
        return { success: true, message: "로컬에서 수정되었습니다." };
      }
      
      throw error;
    }
  },

  // 주소 삭제 API
  deleteAddress: async (addressId) => {
    try {
      const response = await retryRequest(() => apiClient.delete(API_ENDPOINTS.ADDRESS_BY_ID(addressId)));
      logger.log("✅ 주소 삭제 성공:", response.data);
      return response.data;
    } catch (error) {
      logger.error("📡 주소 삭제 요청 실패:", error);
      
      // 서버 오류 시 로컬에서 삭제
      if (error.statusCode >= 500 || error.type === 'NETWORK_ERROR') {
        logger.warn("🔄 서버 오류로 인해 주소가 로컬에서만 삭제됩니다.");
        const stored = localStorage.getItem("itseats-address");
        if (stored) {
          const data = JSON.parse(stored);
          data.addresses = data.addresses.filter(addr => addr.id !== addressId);
          if (data.selectedAddressId === addressId) {
            data.selectedAddressId = data.addresses[0]?.id || null;
          }
          localStorage.setItem("itseats-address", JSON.stringify(data));
        }
        return { success: true, message: "로컬에서 삭제되었습니다." };
      }
      
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
