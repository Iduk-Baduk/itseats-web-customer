import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { useEffect, useState } from "react";

const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

export function TossPaymentWidget({ 
  amount, 
  customerKey = ANONYMOUS, 
  onReady, 
  onPaymentRequest,
  orderId,
  orderName,
  customerEmail,
  customerName,
  customerMobilePhone
}) {
  const [ready, setReady] = useState(false);
  const [widgets, setWidgets] = useState(null);

  useEffect(() => {
    async function fetchPaymentWidgets() {
      try {
        // ------  결제위젯 초기화 ------
        const tossPayments = await loadTossPayments(clientKey);
        // 회원 결제 또는 비회원 결제
        const widgets = tossPayments.widgets({
          customerKey,
        });

        setWidgets(widgets);
      } catch (error) {
        console.error('토스페이먼츠 초기화 실패:', error);
      }
    }

    fetchPaymentWidgets();
  }, [customerKey]);

  useEffect(() => {
    async function renderPaymentWidgets() {
      if (widgets == null) {
        return;
      }
      
      try {
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
        if (onReady) {
          onReady(true);
        }
      } catch (error) {
        console.error('결제 위젯 렌더링 실패:', error);
      }
    }

    renderPaymentWidgets();
  }, [widgets, onReady]);

  useEffect(() => {
    if (widgets == null) {
      return;
    }

    widgets.setAmount(amount);
  }, [widgets, amount]);

  const handlePaymentRequest = async () => {
    if (!widgets || !ready) {
      return;
    }

    try {
      // ------ '결제하기' 버튼 누르면 결제창 띄우기 ------
      // 결제를 요청하기 전에 orderId, amount를 서버에 저장하세요.
      // 결제 과정에서 악의적으로 결제 금액이 바뀌는 것을 확인하는 용도입니다.
      await widgets.requestPayment({
        orderId,
        orderName,
        successUrl: window.location.origin + "/success",
        failUrl: window.location.origin + "/fail",
        customerEmail,
        customerName,
        customerMobilePhone,
      });
      
      if (onPaymentRequest) {
        onPaymentRequest();
      }
    } catch (error) {
      console.error('결제 요청 실패:', error);
      throw error;
    }
  };

  return (
    <div className="wrapper">
      <div className="box_section">
        {/* 결제 UI */}
        <div id="payment-method" />
        {/* 이용약관 UI */}
        <div id="agreement" />
        
        {/* 결제하기 버튼 */}
        <button
          className="button"
          disabled={!ready}
          onClick={handlePaymentRequest}
        >
          결제하기
        </button>
      </div>
    </div>
  );
} 
