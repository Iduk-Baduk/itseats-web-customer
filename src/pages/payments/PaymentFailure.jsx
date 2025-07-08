import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { extractPaymentParams, getPaymentErrorMessage } from '../../utils/paymentUtils';
import { logger } from '../../utils/logger';
import styles from "./PaymentFailure.module.css";
import commonStyles from "../../styles/CommonResult.module.css";

export default function PaymentFailure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // 결제 실패 로그 기록
    const { paymentKey, orderId, amount, status } = extractPaymentParams(searchParams);
    logger.error('결제 실패:', { paymentKey, orderId, amount, status });
  }, [searchParams]);

  const handleRetryPayment = () => {
    // 장바구니로 돌아가서 재시도
    navigate('/cart');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoOrders = () => {
    navigate('/orders');
  };

  // URL 파라미터에서 에러 정보 추출
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');
  const { orderId, amount } = extractPaymentParams(searchParams);

  // 사용자 친화적인 에러 메시지 생성
  const getErrorMessage = () => {
    if (errorMessage) {
      return errorMessage;
    }
    if (errorCode) {
      return getPaymentErrorMessage(errorCode);
    }
    return '결제 중 오류가 발생했습니다.';
  };

  return (
    <div className={commonStyles.result}>
      <div className={commonStyles.wrapper}>
        <div className={`${commonStyles.boxSection} ${styles.failureSection}`}>
          <div className={styles.failureIcon}>
            <span className={styles.icon}>❌</span>
          </div>
          
          <h2 className={styles.failureTitle}>결제 실패</h2>
          
          <div className={styles.errorMessage}>
            <p>{getErrorMessage()}</p>
          </div>

          {orderId && (
            <div className={styles.orderInfo}>
              <p><strong>주문번호:</strong> {orderId}</p>
              {amount && <p><strong>결제 금액:</strong> {amount.toLocaleString()}원</p>}
            </div>
          )}

          <div className={styles.helpText}>
            <p>결제에 실패했습니다. 다음 중 하나를 시도해보세요:</p>
            <ul>
              <li>다른 결제 수단을 사용해보세요</li>
              <li>카드 잔액을 확인해보세요</li>
              <li>인터넷 연결을 확인해보세요</li>
              <li>잠시 후 다시 시도해보세요</li>
            </ul>
          </div>

          <div className="btn-group">
            <button 
              className="btn btn-primary"
              onClick={handleRetryPayment}
            >
              다시 시도하기
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleGoOrders}
            >
              주문 내역 보기
            </button>
            <button 
              className="btn btn-outline"
              onClick={handleGoHome}
            >
              홈으로 돌아가기
            </button>
          </div>

          <div className={styles.contactInfo}>
            <p>문제가 지속되면 고객센터로 문의해주세요</p>
            <p className={styles.phoneNumber}>📞 1588-1234</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
