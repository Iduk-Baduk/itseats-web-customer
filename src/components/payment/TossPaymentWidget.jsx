import React, { useEffect, useState, useCallback, useRef } from 'react';
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { tossPaymentAPI } from '../../services/tossPaymentAPI';
import { paymentTestUtils } from '../../utils/paymentTestUtils';
import { logger } from '../../utils/logger';

const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY || "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
const customerKey = import.meta.env.VITE_TOSS_CUSTOMER_KEY || "2TERsuSTRNCJMuXpIi-Rt";

export function TossPaymentWidget({ 
  amount, 
  orderId, 
  orderName, 
  customerEmail, 
  customerName, 
  customerMobilePhone,
  onPaymentSuccess,
  onPaymentError 
}) {
  const [ready, setReady] = useState(false);
  const [widgets, setWidgets] = useState(null);
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

  // 위젯 초기화
  useEffect(() => {
    async function fetchPaymentWidgets() {
      initStartTimeRef.current = performance.now();
      
      try {
        setIsLoading(true);
        setError(null);
        setRetryCount(0);
        
        logger.log('토스페이먼츠 위젯 초기화 시작');
        
        // 성능 측정 시작
        const initResult = await paymentTestUtils.measurePerformance('위젯 초기화', async () => {
          // ------  결제위젯 초기화 ------
          const tossPayments = await loadTossPayments(clientKey);
          
          // 회원 결제
          const widgets = tossPayments.widgets({
            customerKey,
          });
          // 비회원 결제
          // const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });

          return widgets;
        });

        setWidgets(initResult);
        logger.log('토스페이먼츠 위젯 초기화 성공');
        
        // 성능 메트릭 저장
        const initDuration = performance.now() - initStartTimeRef.current;
        setPerformanceMetrics(prev => ({
          ...prev,
          initDuration: initDuration.toFixed(2)
        }));
        
        // 메모리 사용량 측정
        paymentTestUtils.measureMemoryUsage('위젯 초기화');
        
      } catch (err) {
        logger.error('토스페이먼츠 위젯 초기화 실패:', err);
        setError('결제 위젯을 불러오는데 실패했습니다.');
        
        // 재시도 로직
        if (retryCount < 3) {
          const retryDelay = Math.pow(2, retryCount) * 1000; // 지수 백오프
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchPaymentWidgets();
          }, retryDelay);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchPaymentWidgets();

    // 클린업
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [clientKey, customerKey, retryCount]);

  // 위젯 렌더링
  useEffect(() => {
    async function renderPaymentWidgets() {
      if (widgets == null) {
        return;
      }
      
      try {
        logger.log('토스페이먼츠 위젯 렌더링 시작');
        
        // 렌더링 성능 측정
        await paymentTestUtils.measurePerformance('위젯 렌더링', async () => {
          // ------ 주문의 결제 금액 설정 ------
          await widgets.setAmount(amount);

          await Promise.all([
            // ------  결제 UI 렌더링 ------
            widgets.renderPaymentMethods({
              selector: "#payment-method",
              variantKey: "DEFAULT",
            }),
            // ------  이용약관 UI 렌더링 ------
            widgets.renderAgreement({
              selector: "#agreement",
              variantKey: "AGREEMENT",
            }),
          ]);
        });

        setReady(true);
        logger.log('토스페이먼츠 위젯 렌더링 완료');
        
        // 렌더링 완료 로그
        paymentTestUtils.createPaymentLog('위젯 렌더링 완료', { amount, orderId }, { success: true });
        
      } catch (err) {
        logger.error('토스페이먼츠 위젯 렌더링 실패:', err);
        setError('결제 위젯 렌더링에 실패했습니다.');
        
        // 렌더링 실패 로그
        paymentTestUtils.createPaymentLog('위젯 렌더링 실패', { amount, orderId }, { error: err.message });
      }
    }

    renderPaymentWidgets();
  }, [widgets, amount, orderId]);

  // 결제 금액이 변경될 때마다 위젯 업데이트
  useEffect(() => {
    if (widgets && ready) {
      widgets.setAmount(amount);
    }
  }, [amount, widgets, ready]);

  // 결제 처리 함수
  const handlePayment = useCallback(async () => {
    // 이미 처리 중이면 중복 실행 방지
    if (isProcessing) {
      logger.warn('결제가 이미 진행 중입니다.');
      return;
    }

    // 결제 시도 중복 방지 체크
    if (tossPaymentAPI.isPaymentInProgress(orderId)) {
      setError('이미 진행 중인 결제가 있습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setLastError(null);

    try {
      logger.log('토스페이먼츠 결제 요청 시작:', { orderId, amount, orderName });
      
      // 네트워크 상태 체크 (테스트 환경에서만)
      if (paymentTestUtils.isTestEnvironment()) {
        const networkStatus = await paymentTestUtils.checkNetworkStatus();
        if (!networkStatus.online) {
          throw new Error('네트워크 연결을 확인해주세요.');
        }
      }
      
      // 결제 성능 측정
      const paymentResult = await paymentTestUtils.measurePerformance('결제 요청', async () => {
        // ------ '결제하기' 버튼 누르면 결제창 띄우기 ------
        // 결제를 요청하기 전에 orderId, amount를 서버에 저장하세요.
        // 결제 과정에서 악의적으로 결제 금액이 바뀌는 것을 확인하는 용도입니다.
        return await widgets.requestPayment({
          orderId: orderId,
          orderName: orderName,
          successUrl: window.location.origin + "/payments/toss-success",
          failUrl: window.location.origin + "/payments/failure?redirect=/cart",
          customerEmail: customerEmail,
          customerName: customerName,
          customerMobilePhone: customerMobilePhone,
        });
      });

      logger.log('토스페이먼츠 결제 요청 성공:', paymentResult);
      
      // 결제 성공 로그
      paymentTestUtils.createPaymentLog('결제 요청 성공', { orderId, amount, orderName }, paymentResult);
      
      // 성공 콜백 호출
      if (onPaymentSuccess) {
        onPaymentSuccess(paymentResult);
      }
      
    } catch (error) {
      logger.error('토스페이먼츠 결제 요청 실패:', error);
      
      // 에러 정보 저장
      setLastError({
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || '결제 처리 중 오류가 발생했습니다.',
        timestamp: Date.now()
      });
      
      // 사용자 친화적인 에러 메시지
      const userMessage = getPaymentErrorMessage(error);
      setError(userMessage);
      
      // 결제 실패 로그
      paymentTestUtils.createPaymentLog('결제 요청 실패', { orderId, amount, orderName }, { error: error.message });
      
      // 에러 콜백 호출
      if (onPaymentError) {
        onPaymentError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [widgets, orderId, amount, orderName, customerEmail, customerName, customerMobilePhone, isProcessing, onPaymentSuccess, onPaymentError]);

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
    setWidgets(null);
    setReady(false);
    setIsLoading(true);
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const wrapperStyle = {
    width: '100%'
  };

  const sectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  };

  const buttonStyle = {
    width: '100%',
    padding: '16px',
    backgroundColor: isProcessing ? '#ccc' : '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: (ready && !isProcessing) ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s ease',
    opacity: (ready && !isProcessing) ? 1 : 0.6,
    position: 'relative'
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

  const processingOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    zIndex: 10
  };

  const spinnerStyle = {
    width: '20px',
    height: '20px',
    border: '2px solid #f3f3f3',
    borderTop: '2px solid #2196f3',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
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
        {/* 결제 수단 선택 */}
        <div id="payment-method"></div>
        
        {/* 이용약관 */}
        <div id="agreement"></div>
        
        {/* 결제하기 버튼 */}
        <button 
          style={buttonStyle}
          onClick={handlePayment}
          disabled={!ready || isProcessing}
        >
          {isProcessing ? (
            <>
              <div style={processingOverlayStyle}>
                <div style={spinnerStyle}></div>
              </div>
              결제 처리 중...
            </>
          ) : (
            '결제하기'
          )}
        </button>
        
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
          </div>
        )}
      </div>
      
      {/* 스피너 애니메이션 CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 
