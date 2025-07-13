import React, { useEffect, useState, useCallback, useRef } from 'react';
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { tossPaymentAPI } from '../../services/tossPaymentAPI';
import { logger } from '../../utils/logger';

const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY || "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
const customerKey = import.meta.env.VITE_TOSS_CUSTOMER_KEY || "2TERsuSTRNCJMuXpIi-Rt";

// 토스페이먼츠 결제위젯 로드 함수 (공식 문서 권장 방식)
const loadPaymentWidget = async (clientKey, customerKey) => {
  try {
    logger.log('🚀 토스페이먼츠 결제위젯 로드 시작');
    const tossPayments = await loadTossPayments(clientKey);
    const widgets = tossPayments.widgets({ customerKey });
    logger.log('✅ 토스페이먼츠 결제위젯 로드 완료');
    return widgets;
  } catch (error) {
    logger.error('❌ 토스페이먼츠 결제위젯 로드 실패:', error);
    throw error;
  }
};

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
  const [widgets, setWidgets] = useState(null);
  const [ready, setReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const paymentMethodId = `payment-method-${orderId}`;
  const agreementId = `agreement-${orderId}`;
  
  const widgetsRef = useRef(null);
  const isMountedRef = useRef(true);

  // 컴포넌트 마운트 상태 관리
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 결제위젯 초기화 (단순화된 방식)
  useEffect(() => {
    const initWidget = async () => {
      if (!isMountedRef.current) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        logger.log('🎯 결제위젯 초기화 시작:', { orderId, amount });
        
        const widgetInstance = await loadPaymentWidget(clientKey, customerKey);
        
        if (!isMountedRef.current) return;
        
        widgetsRef.current = widgetInstance;
        setWidgets(widgetInstance);
        
        logger.log('✅ 결제위젯 초기화 완료');
        
      } catch (error) {
        logger.error('❌ 결제위젯 초기화 실패:', error);
        
        if (isMountedRef.current) {
          setError('결제 위젯을 불러오는데 실패했습니다. 페이지를 새로고침해주세요.');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initWidget();
  }, [orderId]);

  // 결제 금액 설정 (공식 문서 권장 방식)
  useEffect(() => {
    if (widgets && amount) {
      const setAmount = async () => {
        try {
          logger.log('💰 결제 금액 설정:', { amount, type: typeof amount });
          
          await widgets.setAmount({
            value: Number(amount),
            currency: 'KRW'
          });
          
          logger.log('✅ 결제 금액 설정 완료');
        } catch (error) {
          logger.error('❌ 결제 금액 설정 실패:', error);
          if (isMountedRef.current) {
            setError('결제 금액 설정에 실패했습니다.');
          }
        }
      };
      
      setAmount();
    }
  }, [widgets, amount]);

  // 결제위젯 렌더링
  useEffect(() => {
    const renderWidget = async () => {
      if (!widgets || !isMountedRef.current) return;
      
      try {
        logger.log('🎨 결제위젯 렌더링 시작');
        
        // DOM 요소 확인
        const paymentMethodElement = document.getElementById(paymentMethodId);
        const agreementElement = document.getElementById(agreementId);
        
        if (!paymentMethodElement || !agreementElement) {
          throw new Error('결제 위젯 DOM 요소를 찾을 수 없습니다.');
        }
        
        // 기존 내용 정리
        paymentMethodElement.innerHTML = '';
        agreementElement.innerHTML = '';
        
        // 결제 방법 렌더링
        await widgets.renderPaymentMethods({
          selector: `#${paymentMethodId}`,
          variantKey: "DEFAULT",
        });
        
        // 이용약관 렌더링
        await widgets.renderAgreement({
          selector: `#${agreementId}`,
          variantKey: "AGREEMENT",
        });
        
        if (isMountedRef.current) {
          setReady(true);
          logger.log('🎉 결제위젯 렌더링 완료');
        }
        
      } catch (error) {
        logger.error('❌ 결제위젯 렌더링 실패:', error);
        
        if (isMountedRef.current) {
          setError('결제 위젯 렌더링에 실패했습니다.');
        }
      }
    };

    if (widgets && !isLoading) {
      renderWidget();
    }
  }, [widgets, isLoading, paymentMethodId, agreementId]);

  // 결제 처리
  const handlePayment = useCallback(async () => {
    if (isProcessing || !widgets || !ready) {
      logger.warn('결제 조건 불충족:', { isProcessing, hasWidgets: !!widgets, ready });
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      logger.log('💳 토스페이먼츠 결제 요청 시작:', { orderId, amount, orderName });
      
      // 결제 요청 (공식 문서 권장 방식)
      const paymentResult = await widgets.requestPayment({
        orderId: orderId,
        orderName: orderName,
        successUrl: window.location.origin + "/payments/toss-success",
        failUrl: window.location.origin + "/payments/failure?redirect=/cart",
        customerEmail: customerEmail,
        customerName: customerName,
        customerMobilePhone: customerMobilePhone,
      });

      logger.log('✅ 토스페이먼츠 결제 요청 성공:', paymentResult);
      
      // 성공 콜백 호출
      if (onPaymentSuccess) {
        onPaymentSuccess(paymentResult);
      }
      
    } catch (error) {
      logger.error('❌ 토스페이먼츠 결제 요청 실패:', error);
      
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
  }, [widgets, ready, orderId, amount, orderName, customerEmail, customerName, customerMobilePhone, isProcessing, onPaymentSuccess, onPaymentError]);

  // 결제 에러 메시지 변환
  const getPaymentErrorMessage = (error) => {
    const errorMessages = {
      'INVALID_CARD_NUMBER': '유효하지 않은 카드 번호입니다.',
      'INVALID_CARD_EXPIRY': '유효하지 않은 카드 만료일입니다.',
      'INVALID_CARD_CVC': '유효하지 않은 CVC입니다.',
      'CARD_DECLINED': '카드 결제가 거부되었습니다.',
      'INSUFFICIENT_FUNDS': '카드 잔액이 부족합니다.',
      'NETWORK_ERROR': '네트워크 연결을 확인해주세요.',
      'TIMEOUT': '결제 시간이 초과되었습니다. 다시 시도해주세요.',
      'USER_CANCELED': '결제가 취소되었습니다.',
      'UNKNOWN_ERROR': '결제 처리 중 오류가 발생했습니다.'
    };

    return errorMessages[error.code] || error.message || '결제 처리 중 오류가 발생했습니다.';
  };

  // 재시도 처리
  const handleRetry = () => {
    setError(null);
    setReady(false);
    setIsLoading(true);
    setWidgets(null);
    widgetsRef.current = null;
  };

  // 스타일 정의
  const wrapperStyle = {
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  const sectionStyle = {
    marginBottom: '20px'
  };

  const buttonStyle = {
    width: '100%',
    padding: '16px',
    backgroundColor: '#0064FF',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 0.2s',
    ...(isProcessing && { backgroundColor: '#ccc', cursor: 'not-allowed' })
  };

  const errorStyle = {
    padding: '12px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    color: '#c33',
    marginTop: '12px',
    textAlign: 'center'
  };

  const retryButtonStyle = {
    marginTop: '8px',
    padding: '8px 16px',
    backgroundColor: '#0064FF',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  const processingOverlayStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px'
  };

  const spinnerStyle = {
    width: '20px',
    height: '20px',
    border: '2px solid #f3f3f3',
    borderTop: '2px solid #0064FF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div style={wrapperStyle}>
        <div style={sectionStyle}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={spinnerStyle}></div>
            <div style={{ marginTop: '16px', color: '#666' }}>결제 위젯을 불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
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
        <div 
          id={paymentMethodId} 
          style={{
            minHeight: '200px',
            width: '100%',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fafafa',
            marginBottom: '16px'
          }}
        ></div>
        
        {/* 이용약관 */}
        <div 
          id={agreementId}
          style={{
            minHeight: '100px',
            width: '100%',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fafafa',
            marginBottom: '20px'
          }}
        ></div>
        
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
