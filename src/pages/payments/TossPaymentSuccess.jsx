import { useEffect, useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { orderAPI } from '../../services/orderAPI';
import { paymentStatusService } from '../../services/paymentStatusService';
import { logger } from '../../utils/logger';
import styles from "./PaymentSuccess.module.css";
import commonStyles from "../../styles/CommonResult.module.css";

export default function TossPaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [pollingStatus, setPollingStatus] = useState(null);

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
      // 백엔드 API를 통한 결제 승인
      const response = await orderAPI.confirmPayment(requestData);
      const json = response.data;

      // 결제 성공 비즈니스 로직을 구현하세요.
      logger.log('백엔드 결제 승인 성공:', json);
      
      // 결제 상태 설정
      setPaymentStatus(json);
      
      // 폴링 시작 (Webhook 상태 반영을 위해)
      startPaymentPolling(requestData.paymentKey, requestData.orderId);
      
      setIsProcessing(false);
      
    } catch (error) {
      // 결제 실패 비즈니스 로직을 구현하세요.
      logger.error('백엔드 결제 승인 실패:', error);
      const errorMessage = error?.message || '결제 처리 중 오류가 발생했습니다';
      setError(errorMessage);
      setIsProcessing(false);
    }
  }, [navigate, searchParams]);

  // 결제 상태 폴링 시작
  const startPaymentPolling = useCallback((paymentKey, orderId) => {
    paymentStatusService.startPolling(
      paymentKey,
      orderId,
      // 상태 변경 콜백
      (status) => {
        logger.log('결제 상태 변경:', status);
        setPaymentStatus(status);
      },
      // 완료 콜백
      (finalStatus) => {
        logger.log('결제 최종 상태:', finalStatus);
        setPaymentStatus(finalStatus);
        setPollingStatus({ isComplete: true, status: finalStatus.status });
      },
      // 에러 콜백
      (error) => {
        logger.error('결제 상태 폴링 에러:', error);
        setError('결제 상태 확인 중 오류가 발생했습니다');
      }
    );

    // 폴링 상태 업데이트
    const updatePollingStatus = () => {
      const status = paymentStatusService.getPollingStatus(paymentKey);
      setPollingStatus(status);
    };

    updatePollingStatus();
    const statusInterval = setInterval(updatePollingStatus, 1000);

    // 5분 후 폴링 상태 업데이트 중단
    setTimeout(() => {
      clearInterval(statusInterval);
    }, 5 * 60 * 1000);
  }, []);

  useEffect(() => {
    confirmPayment();

    // 컴포넌트 언마운트 시 폴링 정리
    return () => {
      const paymentKey = searchParams.get("paymentKey");
      if (paymentKey) {
        paymentStatusService.stopPolling(paymentKey);
      }
    };
  }, [confirmPayment, searchParams]);

  // 로딩 상태
  if (isProcessing) {
    return (
      <div className={commonStyles.result}>
        <div className={commonStyles.wrapper}>
          <div className={commonStyles.boxSection}>
            <h2>결제 처리 중</h2>
            <p>결제를 확인하고 있습니다...</p>
            <div className={styles.loadingSpinner}></div>
            
            {/* 폴링 상태 표시 */}
            {pollingStatus && !pollingStatus.isComplete && (
              <div className={styles.pollingStatus}>
                <p>결제 상태 확인 중... ({Math.floor(pollingStatus.duration / 1000)}초)</p>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${Math.min((pollingStatus.duration / (5 * 60 * 1000)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
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
          
          {/* 결제 상태 표시 */}
          {paymentStatus && (
            <div className={styles.paymentStatus}>
              <div className={styles.statusInfo}>
                <span className={styles.statusLabel}>결제 상태:</span>
                <span 
                  className={styles.statusValue}
                  style={{ color: paymentStatusService.getStatusStyle(paymentStatus.status).color }}
                >
                  {paymentStatusService.getStatusStyle(paymentStatus.status).icon} {' '}
                  {paymentStatusService.getStatusMessage(paymentStatus.status)}
                </span>
              </div>
              
              {paymentStatus.method && (
                <div className={styles.paymentMethod}>
                  <span className={styles.methodLabel}>결제 수단:</span>
                  <span className={styles.methodValue}>
                    {paymentStatus.method === 'CARD' ? '신용카드' : paymentStatus.method}
                    {paymentStatus.card && ` (${paymentStatus.card.company})`}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <p>{`주문번호: ${searchParams.get("orderId")}`}</p>
          <p>{`결제 금액: ${Number(
            searchParams.get("amount")
          ).toLocaleString()}원`}</p>
          <p className={styles.successMessage}>결제가 정상적으로 완료되었습니다.</p>
          <p>주문 내역은 마이페이지에서 확인하실 수 있습니다.</p>
          
          {/* 폴링 완료 상태 표시 */}
          {pollingStatus && pollingStatus.isComplete && (
            <div className={styles.pollingComplete}>
              <p>✅ 결제 상태 확인 완료</p>
            </div>
          )}
          
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
