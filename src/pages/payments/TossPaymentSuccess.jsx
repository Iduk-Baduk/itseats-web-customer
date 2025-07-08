import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { tossPaymentAPI } from '../../services/tossPaymentAPI';
import { logger } from '../../utils/logger';
import styles from "./PaymentSuccess.module.css";

export function TossPaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
        // 토스페이먼츠 API를 사용한 결제 승인
        const json = await tossPaymentAPI.confirmPayment(requestData);

        // 결제 성공 비즈니스 로직을 구현하세요.
        logger.log('토스페이먼츠 결제 성공:', json);
        
        // 성공 시 추가 처리 (예: 주문 상태 업데이트, 이메일 발송 등)
        
      } catch (error) {
        // 결제 실패 비즈니스 로직을 구현하세요.
        logger.error('토스페이먼츠 결제 실패:', error);
        navigate(`/payments/failure?message=${error.message}&code=PAYMENT_FAILED`);
        return;
      }
    }
    
    confirm();
  }, [navigate, searchParams]);

  return (
    <div className={styles.result}>
      <div className={styles.wrapper}>
        <div className={styles.boxSection}>
          <h2>결제 완료</h2>
          <p>{`주문번호: ${searchParams.get("orderId")}`}</p>
          <p>{`결제 금액: ${Number(
            searchParams.get("amount")
          ).toLocaleString()}원`}</p>
          <p>결제가 정상적으로 완료되었습니다.</p>
          <p>주문 내역은 마이페이지에서 확인하실 수 있습니다.</p>
          
          <div className="btn-group">
            <button 
              className={`btn btn-primary ${styles.homeButton}`}
              onClick={() => navigate('/mypage')}
            >
              주문 내역 보기
            </button>
            <button 
              className={`btn btn-secondary ${styles.homeButton}`}
              onClick={() => navigate('/')}
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
