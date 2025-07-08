import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { tossPaymentAPI } from '../../services/tossPaymentAPI';
import { logger } from '../../utils/logger';

const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
const customerKey = "2TERsuSTRNCJMuXpIi-Rt";

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

  useEffect(() => {
    async function fetchPaymentWidgets() {
      try {
        setIsLoading(true);
        setError(null);
        
        // ------  결제위젯 초기화 ------
        const tossPayments = await loadTossPayments(clientKey);
        // 회원 결제
        const widgets = tossPayments.widgets({
          customerKey,
        });
        // 비회원 결제
        // const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });

        setWidgets(widgets);
      } catch (err) {
        console.error('토스페이먼츠 위젯 초기화 실패:', err);
        setError('결제 위젯을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPaymentWidgets();
  }, [clientKey, customerKey]);

  useEffect(() => {
    async function renderPaymentWidgets() {
      if (widgets == null) {
        return;
      }
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

      setReady(true);
    }

    renderPaymentWidgets();
  }, [widgets]);

  useEffect(() => {
    if (widgets == null) {
      return;
    }

    // 결제 금액 업데이트
    widgets.setAmount(amount);
  }, [widgets, amount]);

  // 결제 금액이 변경될 때마다 위젯 업데이트
  useEffect(() => {
    if (widgets && ready) {
      widgets.setAmount(amount);
    }
  }, [amount, widgets, ready]);

  const handlePayment = async () => {
    try {
      // ------ '결제하기' 버튼 누르면 결제창 띄우기 ------
      // 결제를 요청하기 전에 orderId, amount를 서버에 저장하세요.
      // 결제 과정에서 악의적으로 결제 금액이 바뀌는 것을 확인하는 용도입니다.
      await widgets.requestPayment({
        orderId: orderId,
        orderName: orderName,
        successUrl: window.location.origin + "/payments/toss-success",
        failUrl: window.location.origin + "/payments/failure",
        customerEmail: customerEmail,
        customerName: customerName,
        customerMobilePhone: customerMobilePhone,
      });
    } catch (error) {
      // 에러 처리하기
      logger.error('토스페이먼츠 결제 요청 실패:', error);
      if (onPaymentError) {
        onPaymentError(error);
      }
    }
  };

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
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: ready ? 'pointer' : 'not-allowed',
    transition: 'background-color 0.2s ease',
    opacity: ready ? 1 : 0.6
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
    borderRadius: '8px'
  };

  if (isLoading) {
    return (
      <div style={wrapperStyle}>
        <div style={sectionStyle}>
          <div style={loadingStyle}>
            결제 위젯을 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={wrapperStyle}>
        <div style={sectionStyle}>
          <div style={errorStyle}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <div style={sectionStyle}>
        {/* 결제 UI */}
        <div id="payment-method" />
        {/* 이용약관 UI */}
        <div id="agreement" />
        
        {/* 결제하기 버튼 */}
        <button
          style={buttonStyle}
          disabled={!ready}
          onClick={handlePayment}
        >
          {ready ? '결제하기' : '위젯 로딩 중...'}
        </button>
      </div>
    </div>
  );
}

const TossPaymentWidgetOld = ({ orderData, onPaymentComplete, onPaymentError }) => {
  const widgetRef = useRef(null);
  const [widgetInstance, setWidgetInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const initializeWidget = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 토스페이먼츠 스크립트 로드
        if (!window.TossPayments) {
          const script = document.createElement('script');
          script.src = 'https://js.tosspayments.com/v1/payment-widget';
          script.async = true;
          script.onload = () => {
            if (mounted) {
              createWidget();
            }
          };
          script.onerror = () => {
            if (mounted) {
              setError('토스페이먼츠 스크립트 로드에 실패했습니다.');
              setIsLoading(false);
            }
          };
          document.head.appendChild(script);
        } else {
          createWidget();
        }
      } catch (error) {
        if (mounted) {
          setError('위젯 초기화에 실패했습니다.');
          setIsLoading(false);
        }
      }
    };

    const createWidget = async () => {
      try {
        // 임시로 하드코딩된 설정 사용 (실제로는 API에서 가져와야 함)
        const config = {
          clientKey: 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq' // 토스페이먼츠 테스트 클라이언트 키
        };
        
        // 기존 위젯 인스턴스 정리
        if (widgetInstance) {
          widgetInstance.destroy();
        }

        // 새 위젯 인스턴스 생성
        const newWidgetInstance = window.TossPayments(config.clientKey);
        
        // 위젯 렌더링
        newWidgetInstance.renderPaymentMethods('#payment-widget', {
          value: orderData.totalAmount,
          orderId: orderData.orderId,
          orderName: orderData.orderName,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          successUrl: `${window.location.origin}/payments/success`,
          failUrl: `${window.location.origin}/payments/fail`,
        });

        setWidgetInstance(newWidgetInstance);
        setIsLoading(false);

        // 결제 완료 이벤트 리스너
        newWidgetInstance.on('payment', async (paymentData) => {
          try {
            // 임시로 성공 처리 (실제로는 API 호출해야 함)
            const result = {
              paymentKey: paymentData.paymentKey,
              orderId: paymentData.orderId,
              amount: paymentData.amount,
              status: 'SUCCESS',
              method: paymentData.method,
              timestamp: new Date().toISOString()
            };

            if (onPaymentComplete) {
              onPaymentComplete(result);
            }

            // 성공 페이지로 이동
            navigate('/payments/success', { 
              state: { 
                paymentData: result,
                orderData 
              } 
            });
          } catch (error) {
            console.error('결제 승인 실패:', error);
            
            if (onPaymentError) {
              onPaymentError(error);
            }

            // 실패 페이지로 이동
            navigate('/payments/fail', { 
              state: { 
                error: error.message,
                orderData 
              } 
            });
          }
        });

        // 결제 실패 이벤트 리스너
        newWidgetInstance.on('paymentError', (errorData) => {
          console.error('결제 실패:', errorData);
          
          if (onPaymentError) {
            onPaymentError(errorData);
          }

          // 실패 페이지로 이동
          navigate('/payments/fail', { 
            state: { 
              error: errorData.message,
              orderData 
            } 
          });
        });

      } catch (error) {
        if (mounted) {
          setError('위젯 생성에 실패했습니다.');
          setIsLoading(false);
        }
      }
    };

    if (orderData) {
      initializeWidget();
    }

    return () => {
      mounted = false;
      // 컴포넌트 언마운트 시 위젯 정리
      if (widgetInstance) {
        try {
          widgetInstance.destroy();
        } catch (error) {
          console.warn('위젯 정리 중 오류:', error);
        }
      }
    };
  }, [orderData, navigate, onPaymentComplete, onPaymentError]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>결제 위젯을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className={styles.widgetContainer}>
      <div id="payment-widget" className={styles.paymentWidget}></div>
    </div>
  );
};

export default TossPaymentWidgetOld; 
