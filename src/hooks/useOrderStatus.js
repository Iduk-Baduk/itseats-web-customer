import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  setCurrentOrder,
  selectCurrentOrder,
  selectOrderById,
  selectIsLoading,
  selectError,
  updateOrderStatus,
  clearCurrentOrder,
} from "../store/orderSlice";
import { ORDER_STATUS, ORDER_STATUS_CONFIG } from "../constants/orderStatus";
import { calculateETA, getOrderStep, isValidOrderStatus } from "../utils/orderUtils";

// 상태 배열 상수
const ACTIVE_ORDER_STATUSES = [
  ORDER_STATUS.WAITING, 
  ORDER_STATUS.COOKING, 
  ORDER_STATUS.COOKED, 
  ORDER_STATUS.RIDER_READY, 
  ORDER_STATUS.DELIVERING
];

const COMPLETED_ORDER_STATUSES = [
  ORDER_STATUS.DELIVERED, 
  ORDER_STATUS.COMPLETED
];

/**
 * 주문 상태 관리를 위한 커스텀 훅
 * @param {string} orderId - 주문 ID (URL 파라미터에서 자동 추출)
 * @returns {Object} 주문 상태 관련 데이터와 함수들
 */
export const useOrderStatus = (orderId = null) => {
  const dispatch = useDispatch();
  const params = useParams();
  
  // orderId가 없으면 URL 파라미터에서 추출
  const actualOrderId = orderId || params.orderId;
  
  // Redux 상태
  const currentOrder = useSelector(selectCurrentOrder);
  const orderFromStore = useSelector(state => selectOrderById(state, actualOrderId));
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  // 현재 주문 설정 - 무한 루프 방지를 위해 의존성 배열에서 currentOrder 제거
  useEffect(() => {
    if (actualOrderId) {
      dispatch(setCurrentOrder(actualOrderId));
    }
    
    // 컴포넌트 언마운트 시 현재 주문 초기화
    return () => {
      dispatch(clearCurrentOrder());
    };
  }, [actualOrderId, dispatch]); // currentOrder 의존성 제거

  // 주문 데이터 (Redux에서 가져온 데이터 우선, 없으면 더미 데이터)
  const orderData = useMemo(() => {
    if (orderFromStore) {
      // Redux 데이터를 OrderStatus 컴포넌트에서 기대하는 형식으로 변환
      return {
        id: orderFromStore.id,
        orderStatus: orderFromStore.status || orderFromStore.orderStatus, // 두 필드명 모두 지원
        deliveryEta: orderFromStore.deliveryEta || "2025-06-11T08:11:00",
        storeName: orderFromStore.storeName || "도미노피자 구름톤점",
        orderNumber: orderFromStore.orderNumber || "14NKFA",
        orderPrice: orderFromStore.orderPrice || orderFromStore.totalPrice || 15900,
        orderMenuCount: orderFromStore.orderMenuCount || orderFromStore.menuCount || 1,
        deliveryAddress: orderFromStore.deliveryAddress || "경기 성남시 판교로 242 PDC A동 902호",
        destinationLocation: orderFromStore.destinationLocation || { lat: 37.501887, lng: 127.039252 },
        storeLocation: orderFromStore.storeLocation || { lat: 37.4979, lng: 127.0276 },
        riderRequest: orderFromStore.riderRequest || "문 앞에 놔주세요 (초인종 O)",
        statusHistory: orderFromStore.statusHistory || [],
        createdAt: orderFromStore.createdAt,
        ...orderFromStore // 나머지 필드들도 포함
      };
    }
    
    // 더미 데이터 (기존과 호환성 유지)
    return {
      id: actualOrderId || "dummy-order",
      orderStatus: "COOKED",
      deliveryEta: "2025-06-11T08:11:00",
      storeName: "도미노피자 구름톤점",
      orderNumber: "14NKFA",
      orderPrice: 15900,
      orderMenuCount: 1,
      deliveryAddress: "경기 성남시 판교로 242 PDC A동 902호",
      destinationLocation: { lat: 37.501887, lng: 127.039252 },
      storeLocation: { lat: 37.4979, lng: 127.0276 },
      riderRequest: "문 앞에 놔주세요 (초인종 O)",
      statusHistory: [],
      createdAt: new Date().toISOString()
    };
  }, [orderFromStore, actualOrderId]);

  // 주문 상태 정보 계산
  const orderStatusInfo = useMemo(() => {
    const status = orderData.orderStatus;
    
    if (!isValidOrderStatus(status)) {
      console.warn(`Unknown order status: ${status}`);
      return {
        step: -1,
        person: "잇츠잇츠",
        message: "주문 상태를 확인 중입니다",
        image: null,
        showMap: false,
        showETA: false
      };
    }
    
    return ORDER_STATUS_CONFIG[status];
  }, [orderData.orderStatus]);

  // 도착 예정시간 계산
  const etaInfo = useMemo(() => {
    return calculateETA(orderData.deliveryEta);
  }, [orderData.deliveryEta]);

  // 진행률 단계 계산
  const progressStep = useMemo(() => {
    return getOrderStep(orderData.orderStatus);
  }, [orderData.orderStatus]);

  // 주문 상태 업데이트 함수
  const updateStatus = (status, message = null) => {
    if (actualOrderId) {
      try {
        dispatch(updateOrderStatus({
          orderId: actualOrderId,
          status,
          message
        }));
      } catch (error) {
        console.error('주문 상태 업데이트 실패:', error);
        throw error; // 호출자가 에러를 처리할 수 있도록 재던짐
      }
    }
  };

  return {
    // 데이터
    orderData,
    orderStatusInfo,
    etaInfo,
    progressStep,
    isLoading,
    error,
    
    // 함수
    updateStatus,
    
    // 유틸리티
    isActiveOrder: orderData.orderStatus && ACTIVE_ORDER_STATUSES.includes(orderData.orderStatus),
    
    isCompletedOrder: orderData.orderStatus && COMPLETED_ORDER_STATUSES.includes(orderData.orderStatus),
    
    isCanceledOrder: orderData.orderStatus === ORDER_STATUS.CANCELED,
  };
}; 
