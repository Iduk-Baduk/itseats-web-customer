import { useEffect, useRef, useCallback, useState } from 'react';
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
  } = options;

  const dispatch = useDispatch();
  const intervalRef = useRef(null);
  const isTrackingRef = useRef(false);
  const [isTracking, setIsTracking] = useState(false);
  const lastStatusRef = useRef(null);
  const errorCountRef = useRef(0);
  const MAX_ERROR_COUNT = 3;

  /**
   * 주문 상태를 확인하고 업데이트
   */
  const trackOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      const orderData = await dispatch(trackOrderAsync(orderId)).unwrap();
      errorCountRef.current = 0; // 성공 시 에러 카운터 초기화
      
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
      errorCountRef.current++;
      if (errorCountRef.current >= MAX_ERROR_COUNT) {
        console.error(`주문 ${orderId} 추적 중단: ${MAX_ERROR_COUNT}번 연속 실패`);
        stopTracking();
      }
    }
  }, [orderId, dispatch, onStatusChange, stopTracking]);

  /**
   * 추적 시작
   */
  const startTracking = useCallback(() => {
    if (isTrackingRef.current || !orderId) return;
    
    console.log(`🚀 주문 ${orderId} 추적 시작`);
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
    
    console.log(`⏹️ 주문 ${orderId} 추적 중단`);
    isTrackingRef.current = false;
    setIsTracking(false);
    
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
  const dispatch = useDispatch();
  const [trackingStates, setTrackingStates] = useState({});
  const intervalRefs = useRef({});
  
  // orderIds 배열을 문자열로 변환하여 의존성 체크
  const orderIdsString = orderIds.join(',');
  
  // 각 주문에 대한 추적 상태 초기화
  useEffect(() => {
    const newStates = {};
    orderIds.forEach(orderId => {
      if (!trackingStates[orderId]) {
        newStates[orderId] = {
          isTracking: false,
          lastStatus: null,
          errorCount: 0
        };
      }
    });
    
    if (Object.keys(newStates).length > 0) {
      setTrackingStates(prev => ({ ...prev, ...newStates }));
    }
  }, [orderIdsString, trackingStates]);
  
  // 개별 주문 추적 함수
  const trackOrder = useCallback(async (orderId) => {
    try {
      const orderData = await dispatch(trackOrderAsync(orderId)).unwrap();
      
      setTrackingStates(prev => ({
        ...prev,
        [orderId]: {
          ...prev[orderId],
          errorCount: 0,
          lastStatus: orderData.status
        }
      }));
      
      // 상태 변경 콜백 실행
      if (options.onStatusChange) {
        options.onStatusChange({
          orderId,
          currentStatus: orderData.status,
          orderData
        });
      }
      
      // 완료 상태 확인
      const completedStatuses = ['DELIVERED', 'COMPLETED', 'CANCELED'];
      if (completedStatuses.includes(orderData.status)) {
        stopTracking(orderId);
      }
      
    } catch (error) {
      console.error(`주문 ${orderId} 추적 실패:`, error);
      
      setTrackingStates(prev => {
        const currentState = prev[orderId] || {};
        const newErrorCount = (currentState.errorCount || 0) + 1;
        
        if (newErrorCount >= 3) {
          console.error(`주문 ${orderId} 추적 중단: 3번 연속 실패`);
          stopTracking(orderId);
        }
        
        return {
          ...prev,
          [orderId]: {
            ...currentState,
            errorCount: newErrorCount
          }
        };
      });
    }
     }, [dispatch, options, stopTracking]);

  // 개별 주문 추적 시작
  const startTracking = useCallback((orderId) => {
    if (intervalRefs.current[orderId]) return;
    
    console.log(`🚀 주문 ${orderId} 추적 시작`);
    
    setTrackingStates(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], isTracking: true }
    }));
    
    // 즉시 실행
    trackOrder(orderId);
    
    // 주기적 실행
    intervalRefs.current[orderId] = setInterval(() => {
      trackOrder(orderId);
    }, options.pollingInterval || 10000);
  }, [trackOrder, options.pollingInterval]);

  // 개별 주문 추적 중단
  const stopTracking = useCallback((orderId) => {
    if (intervalRefs.current[orderId]) {
      clearInterval(intervalRefs.current[orderId]);
      delete intervalRefs.current[orderId];
    }
    
    setTrackingStates(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], isTracking: false }
    }));
    
    console.log(`⏹️ 주문 ${orderId} 추적 중단`);
  }, []);

  // 모든 주문 추적 시작
  const startAllTracking = useCallback(() => {
    orderIds.forEach(orderId => startTracking(orderId));
  }, [orderIds, startTracking]);

  // 모든 주문 추적 중단
  const stopAllTracking = useCallback(() => {
    orderIds.forEach(orderId => stopTracking(orderId));
  }, [orderIds, stopTracking]);

  // 모든 주문 상태 새로고침
  const refreshAllStatus = useCallback(() => {
    orderIds.forEach(orderId => trackOrder(orderId));
  }, [orderIds, trackOrder]);

  // 자동 시작
  useEffect(() => {
    if (options.autoStart !== false) {
      startAllTracking();
    }

    return () => {
      stopAllTracking();
    };
  }, [orderIdsString, options.autoStart, startAllTracking, stopAllTracking]);

  return {
    trackingStates,
    startAllTracking,
    stopAllTracking,
    refreshAllStatus,
    startTracking,
    stopTracking,
  };
};

export default useOrderTracking; 
