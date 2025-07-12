import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  setCurrentOrder,
  selectCurrentOrder,
  selectIsLoading,
  selectError,
  updateOrderStatus,
  clearCurrentOrder,
  clearCurrentOrderStatus,
  trackOrderAsync,
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
 * @param {string} orderId - 주문 ID (선택사항, URL 파라미터에서 자동 추출)
 * @returns {Object} 주문 상태 관련 데이터와 함수들
 */
export function useOrderStatus(orderId = null) {
  const dispatch = useDispatch();
  const params = useParams();
  
  // orderId가 없으면 URL 파라미터에서 추출
  const actualOrderId = orderId || params.orderId;
  
  // Redux 상태
  const currentOrder = useSelector(selectCurrentOrder);
  const currentOrderStatus = useSelector(state => state.order.currentOrderStatus);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  // 현재 주문 설정
  useEffect(() => {
    if (actualOrderId) {
      dispatch(trackOrderAsync(actualOrderId));
    }
    
    // 컴포넌트 언마운트 시 현재 주문 초기화
    return () => {
      dispatch(clearCurrentOrderStatus());
    };
  }, [actualOrderId, dispatch]);

  // 주문 데이터 (Redux에서 가져온 데이터만 사용)
  const orderData = useMemo(() => {
    if (currentOrderStatus) {
      // Redux 데이터를 OrderStatus 컴포넌트에서 기대하는 형식으로 변환
      return {
        id: currentOrderStatus.orderId,
        orderStatus: currentOrderStatus.orderStatus,
        deliveryEta: currentOrderStatus.deliveryEta || null,
        storeName: currentOrderStatus.storeName,
        orderNumber: currentOrderStatus.orderNumber,
        orderPrice: currentOrderStatus.orderPrice || 0,
        orderMenuCount: currentOrderStatus.orderMenuCount || 1,
        deliveryAddress: currentOrderStatus.deliveryAddress,
        destinationLocation: currentOrderStatus.destinationLocation || { lat: 37.501887, lng: 127.039252 },
        storeLocation: currentOrderStatus.storeLocation || { lat: 37.4979, lng: 127.0276 },
        riderRequest: currentOrderStatus.riderRequest,
        ...currentOrderStatus // 나머지 필드들도 포함
      };
    }
    
    return null;
  }, [currentOrderStatus]);

  // 주문 상태 정보 계산
  const orderStatusInfo = useMemo(() => {
    const orderStatus = orderData?.orderStatus;
    
    if (!isValidOrderStatus(orderStatus)) {
      console.warn(`Unknown order status: ${orderStatus}`);
      return {
        step: -1,
        person: "잇츠잇츠",
        message: "주문 상태를 확인 중입니다",
        image: null,
        showMap: false,
        showETA: false
      };
    }
    
    return ORDER_STATUS_CONFIG[orderStatus];
  }, [orderData?.orderStatus]);

  // 도착 예정시간 계산
  const etaInfo = useMemo(() => {
    return calculateETA(orderData?.deliveryEta);
  }, [orderData?.deliveryEta]);

  // 진행률 단계 계산
  const progressStep = useMemo(() => {
    return getOrderStep(orderData?.orderStatus);
  }, [orderData?.orderStatus]);

  // 주문 상태 업데이트 함수
  const updateStatus = (orderStatus, message = null) => {
    if (actualOrderId && isValidOrderStatus(orderStatus)) {
      try {
        // 상태가 실제로 변경되었는지 확인
        if (orderData?.orderStatus !== orderStatus) {
          dispatch(updateOrderStatus({
            orderId: actualOrderId,
            orderStatus,
            message: message || ORDER_STATUS_CONFIG[orderStatus]?.message || `주문 상태가 ${orderStatus}로 변경되었습니다.`
          }));
        }
      } catch (error) {
        console.error('주문 상태 업데이트 실패:', error);
        throw error;
      }
    }
  };

  return {
    orderData,
    isLoading,
    error,
    hasData: !!orderData,
    orderStatusInfo,
    etaInfo,
    progressStep,
    updateStatus,
    isActiveOrder: orderData?.orderStatus && ACTIVE_ORDER_STATUSES.includes(orderData.orderStatus),
    isCompletedOrder: orderData?.orderStatus && COMPLETED_ORDER_STATUSES.includes(orderData.orderStatus),
    isCanceledOrder: orderData?.orderStatus === ORDER_STATUS.CANCELED,
  };
} 
