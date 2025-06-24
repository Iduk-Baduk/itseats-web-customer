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
import { ORDER_STATUS_CONFIG } from "../constants/orderStatus";
import { calculateETA, getOrderStep, isValidOrderStatus } from "../utils/orderUtils";

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

  // 현재 주문 설정
  useEffect(() => {
    if (actualOrderId && (!currentOrder || currentOrder.id !== actualOrderId)) {
      dispatch(setCurrentOrder(actualOrderId));
    }
    
    // 컴포넌트 언마운트 시 현재 주문 초기화
    return () => {
      dispatch(clearCurrentOrder());
    };
  }, [actualOrderId, currentOrder, dispatch]);

  // 주문 데이터 (Redux에서 가져온 데이터 우선, 없으면 더미 데이터)
  const orderData = useMemo(() => {
    if (orderFromStore) {
      return orderFromStore;
    }
    
    // 더미 데이터 (기존과 호환성 유지)
    return {
      deliveryEta: "2025-06-11T08:11:00",
      orderStatus: "COOKED",
      storeName: "도미노피자 구름톤점",
      orderNumber: "14NKFA",
      orderPrice: 15900,
      orderMenuCount: 1,
      deliveryAddress: "경기 성남시 판교로 242 PDC A동 902호",
      destinationLocation: { lat: 37.501887, lng: 127.039252 },
      storeLocation: { lat: 37.4979, lng: 127.0276 },
      riderRequest: "문 앞에 놔주세요 (초인종 O)",
    };
  }, [orderFromStore]);

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
      dispatch(updateOrderStatus({
        orderId: actualOrderId,
        status,
        message
      }));
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
    isActiveOrder: orderData.orderStatus && [
      'WAITING', 'COOKING', 'COOKED', 'RIDER_READY', 'DELIVERING'
    ].includes(orderData.orderStatus),
    
    isCompletedOrder: orderData.orderStatus && [
      'DELIVERED', 'COMPLETED'
    ].includes(orderData.orderStatus),
    
    isCanceledOrder: orderData.orderStatus === 'CANCELED',
  };
}; 
