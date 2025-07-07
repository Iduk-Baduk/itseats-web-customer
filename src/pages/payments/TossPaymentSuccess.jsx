import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setPaymentSuccess } from "../../store/paymentSlice";
import { addOrder } from "../../store/orderSlice";
import { logger } from "../../utils/logger";

export function TossPaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  useEffect(() => {
    // 쿼리 파라미터 값이 결제 요청할 때 보낸 데이터와 동일한지 반드시 확인하세요.
    // 클라이언트에서 결제 금액을 조작하는 행위를 방지할 수 있습니다.
    const requestData = {
      orderId: searchParams.get("orderId"),
      amount: searchParams.get("amount"),
      paymentKey: searchParams.get("paymentKey"),
    };

    async function confirm() {
      try {
        // 실제 서버 API 호출 (현재는 목업)
        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        const json = await response.json();

        if (!response.ok) {
          // 결제 실패 비즈니스 로직을 구현하세요.
          logger.error('결제 확인 실패:', json);
          navigate(`/payments/fail?message=${json.message}&code=${json.code}`);
          return;
        }

        // 결제 성공 비즈니스 로직을 구현하세요.
        logger.log('결제 성공:', json);
        
        // Redux에 결제 성공 상태 저장
        dispatch(setPaymentSuccess({
          orderId: requestData.orderId,
          amount: requestData.amount,
          paymentKey: requestData.paymentKey,
          timestamp: new Date().toISOString()
        }));

        // 주문 상태 페이지로 이동
        navigate(`/orders/status/${requestData.orderId}`);
        
      } catch (error) {
        logger.error('결제 확인 중 오류 발생:', error);
        navigate(`/payments/fail?message=결제 확인 중 오류가 발생했습니다&code=CONFIRM_ERROR`);
      }
    }
    
    confirm();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="result wrapper">
      <div className="box_section">
        <h2>결제 성공</h2>
        <p>{`주문번호: ${searchParams.get("orderId")}`}</p>
        <p>{`결제 금액: ${Number(
          searchParams.get("amount")
        ).toLocaleString()}원`}</p>
        <p>{`paymentKey: ${searchParams.get("paymentKey")}`}</p>
        <p>결제가 성공적으로 완료되었습니다.</p>
      </div>
    </div>
  );
} 
