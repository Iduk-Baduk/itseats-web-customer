import React, { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { tossPaymentAPI } from '../../services/tossPaymentAPI';
import { paymentTestUtils } from '../../utils/paymentTestUtils';
import { tossWidgetManager } from '../../utils/tossWidgetManager';
import { logger } from '../../utils/logger';

const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY || "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
const customerKey = import.meta.env.VITE_TOSS_CUSTOMER_KEY || "2TERsuSTRNCJMuXpIi-Rt";

export const TossPaymentWidget = forwardRef(({ 
  amount, 
  orderId, 
  orderName, 
  customerEmail, 
  customerName, 
  customerMobilePhone,
  onPaymentSuccess,
  onPaymentError 
}, ref) => {
  const [ready, setReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  
  // 결제 시도 추적
  const paymentAttemptRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const initStartTimeRef = useRef(null);
  const isMountedRef = useRef(true);

  // 외부에서 호출할 수 있는 결제 함수를 ref로 expose
  useImperativeHandle(ref, () => ({
    requestPayment: handlePayment,
    isReady: ready,
    isLoading,
    isProcessing,
    error
  }));

  // 위젯 초기화 및 렌더링
  useEffect(() => {
    async function initializeAndRenderWidgets() {
      if (!isMountedRef.current) return;
      
      initStartTimeRef.current = performance.now();
      
      try {
        setIsLoading(true);
        setError(null);
        setRetryCount(0);
        
        logger.log('토스페이먼츠 위젯 초기화 및 렌더링 시작');
        
        // 간단한 테스트: 2초 후 성공으로 처리
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (!isMountedRef.current) {
          logger.log('컴포넌트가 언마운트되어 초기화 중단');
          return;
        }

        // 성능 메트릭 저장
        const initDuration = performance.now() - initStartTimeRef.current;
        setPerformanceMetrics(prev => ({
          ...prev,
          initDuration: initDuration.toFixed(2)
        }));
        
        setReady(true);
        logger.log('토스페이먼츠 위젯 초기화 및 렌더링 완료 (테스트 모드)');
        
      } catch (err) {
        if (!isMountedRef.current) {
          logger.log('컴포넌트가 언마운트되어 에러 처리 중단');
          return;
        }
        
        logger.error('토스페이먼츠 위젯 초기화/렌더링 실패:', err);
        setError(`결제 위젯을 불러오는데 실패했습니다: ${err.message}`);
        
        // 재시도 로직
        if (retryCount < 3) {
          const retryDelay = Math.pow(2, retryCount) * 1000;
          logger.log(`재시도 예약: ${retryDelay}ms 후 (${retryCount + 1}/3)`);
          retryTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setRetryCount(prev => prev + 1);
              initializeAndRenderWidgets();
            }
          }, retryDelay);
        } else {
          logger.error('최대 재시도 횟수 초과');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }

    initializeAndRenderWidgets();

    // 클린업
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [retryCount]);

  // 결제 금액이 변경될 때마다 위젯 업데이트
  useEffect(() => {
    if (ready && tossWidgetManager.getWidgets()) {
      tossWidgetManager.getWidgets().setAmount(amount);
    }
  }, [amount, ready]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // 결제 처리 함수
  const handlePayment = useCallback(async () => {
    // 이미 처리 중이면 중복 실행 방지
    if (isProcessing) {
      logger.warn('결제가 이미 진행 중입니다.');
      return;
    }

    // 위젯이 준비되지 않았으면 에러
    if (!ready) {
      setError('결제 위젯이 준비되지 않았습니다.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setLastError(null);

    try {
      logger.log('토스페이먼츠 결제 요청 시작 (테스트 모드):', { orderId, amount, orderName });
      
      // 테스트 모드: 2초 후 성공으로 처리
      await new Promise(resolve => setTimeout(resolve, 2000));

      const paymentResult = {
        paymentKey: `test_payment_${Date.now()}`,
        orderId: orderId,
        amount: amount?.value || amount,
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      };

      logger.log('토스페이먼츠 결제 요청 성공 (테스트 모드):', paymentResult);
      
      // 성공 콜백 호출
      if (onPaymentSuccess) {
        onPaymentSuccess(paymentResult);
      }
      
    } catch (error) {
      logger.error('토스페이먼츠 결제 요청 실패 (테스트 모드):', error);
      
      // 에러 정보 저장
      setLastError({
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || '결제 처리 중 오류가 발생했습니다.',
        timestamp: Date.now()
      });
      
      // 사용자 친화적인 에러 메시지
      const userMessage = getPaymentErrorMessage(error);
      setError(userMessage);
      
      // 에러 콜백 호출
      if (onPaymentError) {
        onPaymentError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [orderId, amount, orderName, isProcessing, ready, onPaymentSuccess, onPaymentError]);

  // 결제 에러 메시지 변환
  const getPaymentErrorMessage = (error) => {
    const code = error.code || '';
    const message = error.message || '';
    
    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return '결제가 취소되었습니다.';
      case 'PAY_PROCESS_ABORTED':
        return '결제가 중단되었습니다.';
      case 'INVALID_CARD':
        return '유효하지 않은 카드입니다.';
      case 'INSUFFICIENT_BALANCE':
        return '잔액이 부족합니다.';
      case 'CARD_EXPIRED':
        return '만료된 카드입니다.';
      case 'DUPLICATE_ORDER_ID':
        return '중복된 주문번호입니다.';
      case 'INVALID_AMOUNT':
        return '잘못된 결제 금액입니다.';
      case 'PAYMENT_NOT_FOUND':
        return '결제 정보를 찾을 수 없습니다.';
      case 'ALREADY_PROCESSED_PAYMENT':
        return '이미 처리된 결제입니다.';
      case 'NETWORK_ERROR':
        return '네트워크 연결을 확인해주세요.';
      case 'TIMEOUT_ERROR':
        return '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
      default:
        if (message.includes('500') || message.includes('502') || message.includes('503')) {
          return '서버 일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
        return '결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
  };

  // 재시도 함수
  const handleRetry = useCallback(() => {
    setError(null);
    setLastError(null);
    setRetryCount(0);
    
    // 위젯 재초기화
    setReady(false);
    setIsLoading(true);
  }, []);

  const wrapperStyle = {
    width: '100%'
  };

  const sectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  };

  const loadingStyle = {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666',
    fontSize: '14px'
  };

  const errorStyle = {
    textAlign: 'center',
    padding: '20px',
    color: '#d32f2f',
    fontSize: '14px',
    backgroundColor: '#ffebee',
    border: '1px solid #ffcdd2',
    borderRadius: '8px',
    marginBottom: '16px'
  };

  const retryButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    marginTop: '8px'
  };

  const debugInfoStyle = {
    fontSize: '10px',
    color: '#999',
    marginTop: '8px',
    padding: '4px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px'
  };

  if (isLoading) {
    return (
      <div style={wrapperStyle}>
        <div style={sectionStyle}>
          <div style={loadingStyle}>
            {retryCount > 0 ? (
              <>
                <div>결제 위젯을 불러오는 중... ({retryCount}/3)</div>
                <button style={retryButtonStyle} onClick={handleRetry}>
                  다시 시도
                </button>
              </>
            ) : (
              '결제 위젯을 불러오는 중...'
            )}
            
            {/* 디버그 정보 (테스트 환경에서만 표시) */}
            {paymentTestUtils.isTestEnvironment() && performanceMetrics && (
              <div style={debugInfoStyle}>
                초기화 시간: {performanceMetrics.initDuration}ms
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error && !ready) {
    return (
      <div style={wrapperStyle}>
        <div style={sectionStyle}>
          <div style={errorStyle}>
            <div>{error}</div>
            <button style={retryButtonStyle} onClick={handleRetry}>
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <div style={sectionStyle}>
        {/* 테스트 모드 표시 */}
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          textAlign: 'center',
          color: '#856404',
          fontSize: '14px'
        }}>
          🧪 테스트 모드 - 실제 결제가 진행되지 않습니다
        </div>
        
        {/* 결제 수단 선택 */}
        <div id="payment-method" style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          minHeight: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666'
        }}>
          결제 수단 선택 (테스트 모드)
        </div>
        
        {/* 이용약관 */}
        <div id="agreement" style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          minHeight: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666'
        }}>
          이용약관 동의 (테스트 모드)
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <div style={errorStyle}>
            <div>{error}</div>
            {lastError && (
              <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                오류 코드: {lastError.code}
              </div>
            )}
          </div>
        )}
        
        {/* 디버그 정보 (테스트 환경에서만 표시) */}
        {paymentTestUtils.isTestEnvironment() && (
          <div style={debugInfoStyle}>
            <div>테스트 모드 활성화</div>
            {performanceMetrics && (
              <div>초기화: {performanceMetrics.initDuration}ms</div>
            )}
            <div>주문번호: {orderId}</div>
            <div>금액: {amount?.value || amount}원</div>
            <div>위젯 상태: {JSON.stringify(tossWidgetManager.getStatus())}</div>
          </div>
        )}
      </div>
    </div>
  );
}); 
