import { useState, useEffect, useCallback, useRef } from 'react';
import { usePayment } from './usePayment';
import { logger } from '../utils/logger';

export const usePaymentPolling = (paymentKey, orderId, options = {}) => {
  const {
    interval = 3000, // 3초마다 폴링
    maxAttempts = 20, // 최대 20번 시도 (1분)
    onStatusChange,
    onComplete,
    onError
  } = options;

  const { getPayment } = usePayment();
  const [status, setStatus] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  
  const intervalRef = useRef(null);
  const attemptsRef = useRef(0);

  // 폴링 시작
  const startPolling = useCallback(async () => {
    if (!paymentKey || !orderId) {
      logger.warn('폴링 시작 실패: paymentKey 또는 orderId가 없습니다.');
      return;
    }

    setIsPolling(true);
    setError(null);
    attemptsRef.current = 0;

    logger.log('결제 상태 폴링 시작:', { paymentKey, orderId });

    const poll = async () => {
      try {
        attemptsRef.current += 1;
        setAttempts(attemptsRef.current);

        logger.log(`폴링 시도 ${attemptsRef.current}/${maxAttempts}`);

        const result = await getPayment(paymentKey);
        const currentStatus = result.status;

        logger.log('결제 상태 조회 결과:', { status: currentStatus, result });

        // 상태 변경 콜백 호출
        if (onStatusChange && currentStatus !== status) {
          onStatusChange(currentStatus, result);
        }

        setStatus(currentStatus);

        // 최종 상태인지 확인
        if (isFinalStatus(currentStatus)) {
          logger.log('결제 최종 상태 도달:', currentStatus);
          stopPolling();
          
          if (onComplete) {
            onComplete(currentStatus, result);
          }
          return;
        }

        // 최대 시도 횟수 초과
        if (attemptsRef.current >= maxAttempts) {
          logger.warn('폴링 최대 시도 횟수 초과');
          stopPolling();
          
          const error = new Error('결제 상태 확인 시간이 초과되었습니다.');
          setError(error);
          
          if (onError) {
            onError(error);
          }
          return;
        }

      } catch (err) {
        logger.error('폴링 중 오류:', err);
        setError(err);
        
        // 오류 발생 시에도 폴링 중단
        stopPolling();
        
        if (onError) {
          onError(err);
        }
      }
    };

    // 즉시 첫 번째 폴링 실행
    await poll();

    // 주기적 폴링 설정
    intervalRef.current = setInterval(poll, interval);

  }, [paymentKey, orderId, interval, maxAttempts, onStatusChange, onComplete, onError, getPayment, status]);

  // 폴링 중지
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    logger.log('결제 상태 폴링 중지');
  }, []);

  // 최종 상태인지 확인
  const isFinalStatus = (status) => {
    return ['DONE', 'CANCELED', 'ABORTED', 'FAILED'].includes(status);
  };

  // 컴포넌트 언마운트 시 폴링 중지
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // 수동으로 폴링 재시작
  const restartPolling = useCallback(() => {
    stopPolling();
    startPolling();
  }, [stopPolling, startPolling]);

  return {
    status,
    attempts,
    isPolling,
    error,
    startPolling,
    stopPolling,
    restartPolling
  };
}; 
