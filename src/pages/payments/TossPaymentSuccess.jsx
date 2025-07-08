import { useEffect, useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { tossPaymentAPI } from '../../services/tossPaymentAPI';
import { logger } from '../../utils/logger';
import styles from "./PaymentSuccess.module.css";
import commonStyles from "../../styles/CommonResult.module.css";

export default function TossPaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);

  const confirmPayment = useCallback(async () => {
    const requestData = {
      orderId: searchParams.get("orderId"),
      amount: searchParams.get("amount"),
      paymentKey: searchParams.get("paymentKey"),
    };

    // 필수 파라미터 검증
    if (!requestData.orderId || !requestData.amount || !requestData.paymentKey) {
      logger.error('결제 파라미터 누락:', requestData);
      setError('결제 정보가 올바르지 않습니다');
      setIsProcessing(false);
      return;
    }

    // 금액 유효성 검증
    const amount = Number(requestData.amount);
    if (isNaN(amount) || amount <= 0) {
      logger.error('잘못된 결제 금액:', requestData.amount);
      setError('잘못된 결제 금액입니다');
      setIsProcessing(false);
      return;
    }

    try {
      // 토스페이먼츠 API를 사용한 결제 승인
      const json = await tossPaymentAPI.confirmPayment(requestData);

      // 결제 성공 비즈니스 로직을 구현하세요.
      logger.log('토스페이먼츠 결제 성공:', json);
      
      // TODO: 서버에서 결제 검증 및 주문 상태 업데이트 필요
      // 클라이언트에서만 결제 승인하는 것은 보안상 위험할 수 있습니다.
      // 서버에서 추가 검증 후 주문 상태를 업데이트해야 합니다.
      
      setIsProcessing(false);
      
    } catch (error) {
      // 결제 실패 비즈니스 로직을 구현하세요.
      logger.error('토스페이먼츠 결제 실패:', error);
      const errorMessage = error?.message || '결제 처리 중 오류가 발생했습니다';
      setError(errorMessage);
      setIsProcessing(false);
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    confirmPayment();
  }, [confirmPayment]);

  // 로딩 상태
  if (isProcessing) {
    return (
      <div className={commonStyles.result}>
        <div className={commonStyles.wrapper}>
          <div className={commonStyles.boxSection}>
            <h2>결제 처리 중</h2>
            <p>결제를 확인하고 있습니다...</p>
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
                onClick={() => navigate('/cart')}
              >
                장바구니로 돌아가기
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

  // 성공 상태
  return (
    <div className={commonStyles.result}>
      <div className={commonStyles.wrapper}>
        <div className={`${commonStyles.boxSection} ${styles.successTitle}`}>
          <h2 className={styles.successTitle}>결제 완료</h2>
          <p>{`주문번호: ${searchParams.get("orderId")}`}</p>
          <p>{`결제 금액: ${Number(
            searchParams.get("amount")
          ).toLocaleString()}원`}</p>
          <p className={styles.successMessage}>결제가 정상적으로 완료되었습니다.</p>
          <p>주문 내역은 마이페이지에서 확인하실 수 있습니다.</p>
          
          <div className="btn-group">
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/mypage')}
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
