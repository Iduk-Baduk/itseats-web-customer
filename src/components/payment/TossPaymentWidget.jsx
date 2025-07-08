import React, { useEffect, useState } from 'react';
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { tossPaymentAPI } from '../../services/tossPaymentAPI';
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
        logger.error('토스페이먼츠 위젯 초기화 실패:', err);
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
        failUrl: window.location.origin + "/payments/failure?redirect=/cart",
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
