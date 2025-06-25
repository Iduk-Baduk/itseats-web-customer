import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { trackOrderAsync, updateOrderStatus } from '../store/orderSlice';
import { ORDER_STATUS } from '../constants/orderStatus';

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
    enabledStatuses = [
      ORDER_STATUS.WAITING,
      ORDER_STATUS.COOKING,
      ORDER_STATUS.COOKED,
      ORDER_STATUS.RIDER_READY,
      ORDER_STATUS.DELIVERING
    ]
  } = options;

  const dispatch = useDispatch();
  const intervalRef = useRef(null);
  const isTrackingRef = useRef(false);
  const lastStatusRef = useRef(null);

  /**
   * 주문 상태를 확인하고 업데이트
   */
  const trackOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      const orderData = await dispatch(trackOrderAsync(orderId)).unwrap();
      
      // 상태가 변경된 경우
      if (lastStatusRef.current !== orderData.status) {
        const previousStatus = lastStatusRef.current;
        lastStatusRef.current = orderData.status;
        
        // Redux 상태 업데이트
        dispatch(updateOrderStatus({
          orderId,
          status: orderData.status,
          message: orderData.statusMessage
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
        
        console.log(`📦 주문 ${orderId} 상태 변경: ${previousStatus} → ${orderData.status}`);
      }
      
      // 완료 상태에 도달하면 추적 중단
      const completedStatuses = [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELED];
      if (completedStatuses.includes(orderData.status)) {
        stopTracking();
      }
      
    } catch (error) {
      console.error('주문 추적 실패:', error);
      // 에러가 지속되면 추적 중단 (예: 3번 연속 실패)
    }
  }, [orderId, dispatch, onStatusChange]);

  /**
   * 추적 시작
   */
  const startTracking = useCallback(() => {
    if (isTrackingRef.current || !orderId) return;
    
    console.log(`🚀 주문 ${orderId} 추적 시작`);
    isTrackingRef.current = true;
    
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
    
    console.log(`⏹️ 주문 ${orderId} 추적 중단`);
    isTrackingRef.current = false;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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
      stopTracking();
    };
  }, [orderId, autoStart, startTracking, stopTracking]);

  // orderId가 변경되면 추적 재시작
  useEffect(() => {
    if (isTrackingRef.current) {
      stopTracking();
      if (orderId) {
        startTracking();
      }
    }
  }, [orderId, startTracking, stopTracking]);

  return {
    isTracking: isTrackingRef.current,
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
  const trackingHooks = orderIds.map(orderId => 
    useOrderTracking(orderId, { ...options, autoStart: false })
  );

  const startAllTracking = useCallback(() => {
    trackingHooks.forEach(hook => hook.startTracking());
  }, [trackingHooks]);

  const stopAllTracking = useCallback(() => {
    trackingHooks.forEach(hook => hook.stopTracking());
  }, [trackingHooks]);

  const refreshAllStatus = useCallback(() => {
    trackingHooks.forEach(hook => hook.refreshStatus());
  }, [trackingHooks]);

  useEffect(() => {
    if (options.autoStart !== false) {
      startAllTracking();
    }

    return () => {
      stopAllTracking();
    };
  }, [orderIds.length, startAllTracking, stopAllTracking, options.autoStart]);

  return {
    trackingStates: trackingHooks,
    startAllTracking,
    stopAllTracking,
    refreshAllStatus,
  };
};

export default useOrderTracking; 
