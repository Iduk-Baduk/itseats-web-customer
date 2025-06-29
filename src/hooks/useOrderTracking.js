import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { trackOrderAsync, updateOrderStatus } from '../store/orderSlice';
import { ORDER_STATUS } from '../constants/orderStatus';

// 완료 상태 상수 배열 (성능 최적화를 위해 최상위에서 정의)
const COMPLETED_STATUSES = [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELED];

/**
 * 실시간 주문 추적을 위한 커스텀 훅
 * @param {string} orderId - 추적할 주문 ID
 * @param {Object} options - 옵션 설정
 * @returns {Object} 추적 상태와 제어 함수들
 */
export const useOrderTracking = (orderId, options = {}) => {
  const {
    pollingInterval = 10000, // 10초마다 폴링
    autoStart = true,
    onStatusChange = null,
  } = options;

  const dispatch = useDispatch();
  const intervalRef = useRef(null);
  const isTrackingRef = useRef(false);
  const [isTracking, setIsTracking] = useState(false);
  const lastStatusRef = useRef(null);
  const errorCountRef = useRef(0);
  const MAX_ERROR_COUNT = 3;

  /**
   * 내부적으로 추적을 중단하는 헬퍼 함수
   */
  const internalStopTracking = useCallback((reason = '') => {
    isTrackingRef.current = false;
    setIsTracking(false);
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      console.error(`주문 ${orderId} interval 정리 실패:`, error);
    }
  }, [orderId]);

  /**
   * 주문 상태를 확인하고 업데이트
   */
  const trackOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      const response = await dispatch(trackOrderAsync(orderId)).unwrap();
      const orderData = response.data; // API 응답에서 data 추출
      errorCountRef.current = 0;
      
      // 상태가 변경된 경우
      if (lastStatusRef.current !== orderData.status) {
        const previousStatus = lastStatusRef.current;
        lastStatusRef.current = orderData.status;
        
        // 상태 메시지 가져오기
        const statusMessage = orderData.statusHistory?.length > 0
          ? orderData.statusHistory[orderData.statusHistory.length - 1].message
          : `주문 상태가 ${orderData.status}로 변경되었습니다.`;
        
        // Redux 상태 업데이트
        dispatch(updateOrderStatus({
          orderId,
          status: orderData.status,
          message: statusMessage
        }));
        
        // 콜백 실행
        if (onStatusChange) {
          onStatusChange({
            orderId,
            previousStatus,
            currentStatus: orderData.status,
            orderData
          });
        }
      }
      
      // 완료 상태에 도달하면 추적 중단
      if (COMPLETED_STATUSES.includes(orderData.status)) {
        internalStopTracking('완료 상태');
      }
      
    } catch (error) {
      console.error('주문 추적 실패:', error);
      errorCountRef.current++;
      if (errorCountRef.current >= MAX_ERROR_COUNT) {
        console.error(`주문 ${orderId} 추적 중단: ${MAX_ERROR_COUNT}번 연속 실패`);
        internalStopTracking('연속 실패');
      }
    }
  }, [orderId, dispatch, onStatusChange, internalStopTracking]);

  /**
   * 추적 시작
   */
  const startTracking = useCallback(() => {
    if (isTrackingRef.current || !orderId) return;
    
    isTrackingRef.current = true;
    setIsTracking(true);
    
    // 즉시 한 번 실행
    trackOrder();
    
    // 주기적 실행 설정
    intervalRef.current = setInterval(trackOrder, pollingInterval);
  }, [orderId, trackOrder, pollingInterval]);

  /**
   * 추적 중단
   */
  const stopTracking = useCallback(() => {
    if (!isTrackingRef.current) return;
    
    isTrackingRef.current = false;
    setIsTracking(false);
    
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      console.error(`주문 ${orderId} interval 정리 실패:`, error);
    }
  }, [orderId]);

  /**
   * 수동으로 상태 확인
   */
  const refreshStatus = useCallback(() => {
    trackOrder();
  }, [trackOrder]);

  // 자동 시작 및 정리
  useEffect(() => {
    if (autoStart && orderId) {
      startTracking();
    }

    return () => {
      try {
        stopTracking();
      } catch (error) {
        console.error(`컴포넌트 언마운트 시 주문 ${orderId} 추적 정리 실패:`, error);
      }
    };
  }, [orderId, autoStart]);

  // orderId가 변경되면 추적 재시작
  useEffect(() => {
    if (isTrackingRef.current) {
      try {
        stopTracking();
        if (orderId) {
          startTracking();
        }
      } catch (error) {
        console.error(`주문 ID 변경 시 추적 재시작 실패:`, error);
      }
    }
  }, [orderId]);

  return {
    isTracking,
    startTracking,
    stopTracking,
    refreshStatus,
  };
};

/**
 * 여러 주문을 동시에 추적하기 위한 훅
 * @param {Array} orderIds - 추적할 주문 ID 배열
 * @param {Object} options - 옵션 설정
 * @returns {Object} 추적 상태와 제어 함수들
 */
export const useMultipleOrderTracking = (orderIds = [], options = {}) => {
  const {
    pollingInterval = 10000,
    onStatusChange = null,
  } = options;

  const dispatch = useDispatch();
  const intervalRefs = useRef({});
  const lastStatusesRef = useRef({});
  
  // 주문 상태 추적 함수
  const trackOrders = useCallback(async () => {
    for (const orderId of orderIds) {
      try {
        const response = await dispatch(trackOrderAsync(orderId)).unwrap();
        const orderData = response.data;
        
        // 상태가 변경된 경우에만 업데이트
        if (lastStatusesRef.current[orderId] !== orderData.status) {
          const previousStatus = lastStatusesRef.current[orderId];
          lastStatusesRef.current[orderId] = orderData.status;
          
          // 상태 메시지 가져오기
          const statusMessage = orderData.statusHistory?.length > 0
            ? orderData.statusHistory[orderData.statusHistory.length - 1].message
            : `주문 상태가 ${orderData.status}로 변경되었습니다.`;
          
          // Redux 상태 업데이트
          dispatch(updateOrderStatus({
            orderId,
            status: orderData.status,
            message: statusMessage
          }));
          
          // 콜백 실행
          if (onStatusChange) {
            onStatusChange({
              orderId,
              previousStatus,
              currentStatus: orderData.status,
              orderData
            });
          }
        }
      } catch (error) {
        logger.error(`주문 추적 실패 (${orderId}):`, error);
      }
    }
  }, [orderIds, dispatch, onStatusChange]);

  // 추적 시작/중지 처리
  useEffect(() => {
    // 초기 상태 설정
    orderIds.forEach(orderId => {
      if (!lastStatusesRef.current[orderId]) {
        lastStatusesRef.current[orderId] = null;
      }
    });

    // 즉시 한 번 실행
    trackOrders();
    
    // 주기적 실행 설정
    const intervalId = setInterval(trackOrders, pollingInterval);
    
    // 클린업
    return () => {
      clearInterval(intervalId);
    };
  }, [orderIds, trackOrders, pollingInterval]);

  return {
    isTracking: orderIds.length > 0,
    trackingIds: orderIds,
  };
};

export default useOrderTracking; 
