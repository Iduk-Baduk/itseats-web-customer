import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';

// 주문 API 서비스
export const orderAPI = {
  // 새 주문 생성
  createOrder: async (orderData) => {
    // API 스펙에 맞는 데이터 구조 검증
    const {
      coupons = [],
      totalCost,
      paymentMethod,
      paymentStatus = "PENDING",
      storeRequest = "",
      riderRequest = "",
      orderDetails
    } = orderData;

    // 주문 상세 정보 검증
    const {
      addrId,
      storeId,
      orderMenus,
      deliveryType = "DEFAULT"
    } = orderDetails || {};

    // 필수 필드 검증
    if (!totalCost || !paymentMethod || !addrId || !storeId || !orderMenus?.length) {
      throw new Error("필수 주문 정보가 누락되었습니다.");
    }

    // 서버로 전송할 데이터 구조
    const requestData = {
      // 주문 기본 정보
      orderId: null, // 서버에서 생성
      coupons,
      totalCost,
      paymentMethod,
      paymentStatus,
      storeRequest,
      riderRequest,
      
      // 주문 상세 정보
      addrId,
      storeId,
      orderMenus: orderMenus.map(menu => ({
        menuId: menu.menuId,
        menuName: menu.menuName,
        menuOptions: menu.menuOptions || [],
        menuTotalPrice: menu.menuTotalPrice,
        quantity: menu.quantity
      })),
      deliveryType
    };

    return await apiClient.post(API_ENDPOINTS.ORDERS, requestData);
  },

  // 주문 목록 조회
  getOrders: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.ORDERS, { params });
  },

  // 특정 주문 조회
  getOrderById: async (orderId) => {
    return await apiClient.get(API_ENDPOINTS.ORDER_BY_ID(orderId));
  },

  // 주문 상태 업데이트
  updateOrderStatus: async (orderId, status, message) => {
    return await apiClient.patch(API_ENDPOINTS.ORDER_STATUS(orderId), {
      status,
      message,
    });
  },

  // 주문 취소
  cancelOrder: async (orderId, reason) => {
    return await apiClient.patch(API_ENDPOINTS.ORDER_CANCEL(orderId), {
      reason,
    });
  },

  // 주문 완료 처리
  completeOrder: async (orderId) => {
    return await apiClient.patch(API_ENDPOINTS.ORDER_COMPLETE(orderId));
  },

  // 실시간 주문 상태 추적 (WebSocket 대안으로 폴링)
  trackOrder: async (orderId) => {
    return await apiClient.get(API_ENDPOINTS.ORDER_TRACK(orderId));
  },
};

export default orderAPI; 
