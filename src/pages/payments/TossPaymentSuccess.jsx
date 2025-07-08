import { useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePayment } from '../../hooks/usePayment';
import { extractPaymentParams, formatAmount } from '../../utils/paymentUtils';
import { logger } from '../../utils/logger';
import styles from "./PaymentSuccess.module.css";
import commonStyles from "../../styles/CommonResult.module.css";

export default function TossPaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    loading, 
    error, 
    paymentStatus, 
    confirmPayment, 
    clearError 
  } = usePayment();

  const handlePaymentConfirmation = useCallback(async () => {
    try {
      // URL 파라미터에서 결제 정보 추출
      const { paymentKey, orderId, amount } = extractPaymentParams(searchParams);

      // 필수 파라미터 검증
      if (!orderId || !amount || !paymentKey) {
        logger.error('결제 파라미터 누락:', { orderId, amount, paymentKey });
        throw new Error('결제 정보가 올바르지 않습니다');
      }

      // 금액 유효성 검증
      if (isNaN(amount) || amount <= 0) {
        logger.error('잘못된 결제 금액:', amount);
        throw new Error('잘못된 결제 금액입니다');
      }

      logger.log('결제 승인 시작:', { paymentKey, orderId, amount });

      // 결제 승인 요청
      const result = await confirmPayment(paymentKey, orderId, amount);

      logger.log('결제 승인 성공:', result);

      // 성공 후 3초 뒤 주문 내역 페이지로 이동
      setTimeout(() => {
        navigate('/orders');
      }, 3000);

    } catch (err) {
      logger.error('결제 승인 실패:', err);
      // 에러는 usePayment 훅에서 처리됨
    }
  }, [searchParams, confirmPayment, navigate]);

  useEffect(() => {
    handlePaymentConfirmation();
  }, [handlePaymentConfirmation]);

  // 로딩 상태
  if (loading) {
    return (
      <div className={commonStyles.result}>
        <div className={commonStyles.wrapper}>
          <div className={commonStyles.boxSection}>
            <h2>결제 처리 중</h2>
            <p>
              {paymentStatus === 'CONFIRMING' && '결제를 확인하고 있습니다...'}
              {paymentStatus === 'PREPARING' && '결제 정보를 준비하고 있습니다...'}
              {!paymentStatus && '결제를 처리하고 있습니다...'}
            </p>
            <div className={styles.loadingSpinner}></div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={commonStyles.result}>
        <div className={commonStyles.wrapper}>
          <div className={commonStyles.boxSection}>
            <h2>결제 실패</h2>
            <p>{error}</p>
            <div className="btn-group">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  clearError();
                  navigate('/cart');
                }}
              >
                장바구니로 돌아가기
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  clearError();
                  navigate('/');
                }}
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 성공 상태
  const { orderId, amount } = extractPaymentParams(searchParams);
  
  return (
    <div className={commonStyles.result}>
      <div className={commonStyles.wrapper}>
        <div className={`${commonStyles.boxSection} ${styles.successTitle}`}>
          <h2 className={styles.successTitle}>결제 완료</h2>
          <p>{`주문번호: ${orderId}`}</p>
          <p>{`결제 금액: ${formatAmount(amount)}원`}</p>
          <p className={styles.successMessage}>결제가 정상적으로 완료되었습니다.</p>
          <p>주문 내역은 마이페이지에서 확인하실 수 있습니다.</p>
          <p className={styles.redirectMessage}>3초 후 주문 내역 페이지로 이동합니다...</p>
          
          <div className="btn-group">
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/orders')}
            >
              주문 내역 보기
            </button>
            <button 
              className="btn btn-secondary"
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
