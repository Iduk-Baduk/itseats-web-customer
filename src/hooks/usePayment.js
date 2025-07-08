import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { tossPaymentAPI } from '../services/tossPaymentAPI';
import { generateIdempotencyKey, validatePaymentData, getPaymentErrorMessage } from '../utils/paymentUtils';
import { logger } from '../utils/logger';

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const dispatch = useDispatch();

  // 결제 준비 및 실행
  const processPayment = useCallback(async (paymentData) => {
    setLoading(true);
    setError(null);
    setPaymentStatus('PREPARING');

    try {
      // 결제 데이터 검증
      validatePaymentData(paymentData);

      // 멱등성 키 생성
      const idempotencyKey = generateIdempotencyKey();

      logger.log('결제 프로세스 시작:', { paymentData, idempotencyKey });

      // 1. 결제 준비 요청
      setPaymentStatus('PREPARING');
      const prepareResult = await tossPaymentAPI.preparePayment({
        ...paymentData,
        idempotencyKey
      });

      logger.log('결제 준비 완료:', prepareResult);

      // 2. 결제창 실행
      setPaymentStatus('REQUESTING');
      await tossPaymentAPI.requestPayment('카드', {
        ...paymentData,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/failure`,
      });

      setPaymentStatus('REDIRECTING');
      logger.log('결제창 실행 완료 - 리다이렉트 대기 중');

    } catch (err) {
      logger.error('결제 프로세스 오류:', err);
      setError(getPaymentErrorMessage(err.message));
      setPaymentStatus('FAILED');
    } finally {
      setLoading(false);
    }
  }, []);

  // 결제 승인 (성공 페이지에서 호출)
  const confirmPayment = useCallback(async (paymentKey, orderId, amount) => {
    setLoading(true);
    setError(null);
    setPaymentStatus('CONFIRMING');

    try {
      logger.log('결제 승인 시작:', { paymentKey, orderId, amount });

      const result = await tossPaymentAPI.confirmPayment({
        paymentKey,
        orderId,
        amount
      });

      logger.log('결제 승인 성공:', result);
      setPaymentStatus('SUCCESS');

      return result;
    } catch (err) {
      logger.error('결제 승인 오류:', err);
      setError(getPaymentErrorMessage(err.message));
      setPaymentStatus('FAILED');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 결제 취소
  const cancelPayment = useCallback(async (paymentKey, cancelReason) => {
    setLoading(true);
    setError(null);
    setPaymentStatus('CANCELING');

    try {
      logger.log('결제 취소 시작:', { paymentKey, cancelReason });

      const result = await tossPaymentAPI.cancelPayment(paymentKey, {
        cancelReason: cancelReason || '사용자 요청'
      });

      logger.log('결제 취소 성공:', result);
      setPaymentStatus('CANCELED');

      return result;
    } catch (err) {
      logger.error('결제 취소 오류:', err);
      setError(getPaymentErrorMessage(err.message));
      setPaymentStatus('FAILED');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 결제 조회
  const getPayment = useCallback(async (paymentKey) => {
    setLoading(true);
    setError(null);

    try {
      logger.log('결제 조회 시작:', paymentKey);

      const result = await tossPaymentAPI.getPayment(paymentKey);

      logger.log('결제 조회 성공:', result);
      setPaymentStatus(result.status);

      return result;
    } catch (err) {
      logger.error('결제 조회 오류:', err);
      setError(getPaymentErrorMessage(err.message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 상태 초기화
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setPaymentStatus(null);
  }, []);

  return {
    // 상태
    loading,
    error,
    paymentStatus,
    
    // 액션
    processPayment,
    confirmPayment,
    cancelPayment,
    getPayment,
    clearError,
    reset
  };
}; 
