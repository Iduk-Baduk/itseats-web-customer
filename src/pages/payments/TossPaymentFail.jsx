import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch, useEffect } from "react-redux";
import { setPaymentError } from "../../store/paymentSlice";
import { logger } from "../../utils/logger";

export function TossPaymentFail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const errorCode = searchParams.get("code");
  const errorMessage = searchParams.get("message");
  const orderId = searchParams.get("orderId");

  // 결제 실패 상태를 Redux에 저장
  useEffect(() => {
    dispatch(setPaymentError({
      code: errorCode,
      message: errorMessage,
      orderId: orderId,
      timestamp: new Date().toISOString()
    }));
    
    logger.error('결제 실패:', { errorCode, errorMessage, orderId });
  }, [dispatch, errorCode, errorMessage, orderId]);

  const handleRetry = () => {
    // 장바구니로 돌아가기
    navigate('/cart');
  };

  const handleGoHome = () => {
    // 홈으로 돌아가기
    navigate('/');
  };

  return (
    <div className="result wrapper">
      <div className="box_section">
        <h2>결제 실패</h2>
        <p>{`에러 코드: ${errorCode}`}</p>
        <p>{`실패 사유: ${errorMessage}`}</p>
        {orderId && <p>{`주문번호: ${orderId}`}</p>}
        
        <div style={{ marginTop: '20px' }}>
          <button onClick={handleRetry} style={{ marginRight: '10px' }}>
            다시 시도
          </button>
          <button onClick={handleGoHome}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
} 
