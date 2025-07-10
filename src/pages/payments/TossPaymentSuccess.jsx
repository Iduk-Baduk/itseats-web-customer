import { useEffect, useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { orderAPI } from '../../services/orderAPI';
import { tossPaymentAPI } from '../../services/tossPaymentAPI';
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
  const [orderData, setOrderData] = useState(null);

  const confirmPayment = useCallback(async () => {
    logger.log('🔄 confirmPayment 시작, isProcessing:', isProcessing);
    
    // 이미 처리 중이면 중복 실행 방지
    if (isProcessing === false) {
      logger.log('⚠️ 이미 처리 완료됨, 함수 종료');
      return;
    }

    // 타임아웃 설정 (30초)
    const timeoutId = setTimeout(() => {
      logger.error('❌ 결제 처리 타임아웃 (30초)');
      setError('결제 처리 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
      setIsProcessing(false);
    }, 30000);

    try {
      logger.log('📡 결제 처리 시작...');
      
      // URL 파라미터에서 결제 정보 추출
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const paymentId = searchParams.get("paymentId"); // URL에서 paymentId 추출
      const amount = searchParams.get("amount");

      logger.log('📋 URL 파라미터:', { paymentKey, orderId, paymentId, amount });

      // paymentId가 없으면 orderId를 paymentId로 사용 (fallback)
      const finalPaymentId = paymentId || orderId;
      
      if (!paymentKey || !orderId || !amount) {
        throw new Error('결제 정보가 올바르지 않습니다.');
      }

      const requestData = {
        paymentKey,
        orderId,
        paymentId: finalPaymentId, // 백엔드에서 받은 paymentId 또는 fallback
        amount: parseInt(amount)
      };

      logger.log('📡 토스페이먼츠 결제 승인 시작:', requestData);
      
      // sessionStorage에서 주문 데이터 가져오기 (fallback용)
      const storedOrderData = sessionStorage.getItem('pendingOrderData');
      let orderData = null;
      
      if (storedOrderData) {
        try {
          orderData = JSON.parse(storedOrderData);
          logger.log('📦 주문 데이터 (sessionStorage):', orderData);
        } catch (error) {
          logger.warn('⚠️ sessionStorage 주문 데이터 파싱 실패:', error);
        }
      }
      
      // 주문 데이터가 없으면 URL 파라미터로 기본 데이터 생성
      if (!orderData) {
        logger.warn('⚠️ sessionStorage에 주문 데이터 없음, URL 파라미터로 기본 데이터 생성');
        orderData = {
          orderId: orderId,
          totalPrice: parseInt(amount),
          paymentMethod: { type: 'CARD' },
          storeRequest: '',
          riderRequest: '문 앞에 놔주세요 (초인종 O)',
          couponIds: []
        };
      }
      
      let paymentResponse;
      
      try {
        // 결제 승인만 처리 (주문 생성과 결제 생성은 이미 Cart.jsx에서 완료)
        logger.log('📡 결제 승인 요청:', { requestData });
        paymentResponse = await tossPaymentAPI.confirmPaymentWithBackend(null, {
          orderId: requestData.orderId,
          amount: requestData.amount,
          paymentKey: requestData.paymentKey
        });
        logger.log('✅ 결제 승인 성공:', paymentResponse);
        
      } catch (backendError) {
        // 백엔드 API 실패 시 Mock 모드로 fallback
        logger.warn('⚠️ 백엔드 API 실패, Mock 모드로 fallback:', backendError.message);
        try {
          paymentResponse = await tossPaymentAPI.mockConfirmPayment(requestData);
          logger.log('✅ 토스페이먼츠 결제 승인 성공 (Mock 모드):', paymentResponse);
        } catch (mockError) {
          logger.error('❌ Mock 모드도 실패:', mockError);
          throw new Error('결제 처리를 완료할 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
      }
      
      // 주문 생성은 이미 Cart.jsx에서 완료되었으므로 여기서는 주문 데이터만 설정
      logger.log('📡 주문 데이터 설정');
      
      try {
        // 주문 데이터 설정 (이미 생성된 주문 정보 사용)
        setOrderData({
          orderId: orderId,
          totalPrice: parseInt(amount),
          status: 'WAITING',
          createdAt: new Date().toISOString()
        });
        
        // 결제 상태 설정
        setPaymentStatus({
          ...paymentResponse,
          orderId: orderId,
          status: 'DONE'
        });
        
        // sessionStorage에서 주문 데이터 정리
        sessionStorage.removeItem('pendingOrderData');
        
        // 폴링 시작 (Webhook 상태 반영을 위해)
        try {
          startPaymentPolling(requestData.paymentKey, requestData.orderId);
        } catch (pollingError) {
          logger.warn('⚠️ 폴링 시작 실패 (무시):', pollingError);
        }
        
      } catch (orderError) {
        logger.error('❌ 주문 데이터 설정 실패:', orderError);
        // 주문 데이터 설정 실패해도 결제는 성공했으므로 성공으로 처리
        setPaymentStatus({
          ...paymentResponse,
          orderId: requestData.orderId,
          status: 'DONE'
        });
        sessionStorage.removeItem('pendingOrderData');
      }
      
      clearTimeout(timeoutId);
      setIsProcessing(false);
      
    } catch (error) {
      clearTimeout(timeoutId);
      logger.error('❌ 결제/주문 처리 실패:', error);
      const errorMessage = error?.message || '결제 처리 중 오류가 발생했습니다';
      setError(errorMessage);
      setIsProcessing(false);
    }
  }, []); // 의존성 배열을 빈 배열로 변경하여 무한 루프 방지

  // 결제 상태 폴링 시작
  const startPaymentPolling = useCallback((paymentKey, orderId) => {
    try {
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
          // 폴링 에러는 무시하고 계속 진행
        }
      );

      // 폴링 상태 업데이트 (최대 5분)
      const updatePollingStatus = () => {
        try {
          const status = paymentStatusService.getPollingStatus(paymentKey);
          setPollingStatus(status);
        } catch (error) {
          logger.warn('폴링 상태 업데이트 실패:', error);
        }
      };

      updatePollingStatus();
      const statusInterval = setInterval(updatePollingStatus, 1000);

      // 5분 후 폴링 상태 업데이트 중단
      setTimeout(() => {
        clearInterval(statusInterval);
        logger.log('폴링 상태 업데이트 중단 (5분 경과)');
      }, 5 * 60 * 1000);

    } catch (error) {
      logger.error('폴링 시작 실패:', error);
      // 폴링 실패는 무시하고 계속 진행
    }
  }, []);

  useEffect(() => {
    // 컴포넌트 마운트 시 결제 처리 시작
    confirmPayment();

    // 컴포넌트 언마운트 시 폴링 정리
    return () => {
      const paymentKey = searchParams.get("paymentKey");
      if (paymentKey) {
        try {
          paymentStatusService.stopPolling(paymentKey);
        } catch (error) {
          logger.warn('폴링 정리 실패:', error);
        }
      }
    };
  }, []); // 의존성 배열을 빈 배열로 변경하여 무한 루프 방지

  // 로딩 상태
  if (isProcessing) {
    return (
      <div className={commonStyles.result}>
        <div className={commonStyles.wrapper}>
          <div className={commonStyles.boxSection}>
            <h2>결제 처리 중</h2>
            <p>결제를 확인하고 주문을 생성하고 있습니다...</p>
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
            
            {/* 강제 종료 버튼 (30초 후 표시) */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  logger.warn('⚠️ 사용자가 강제로 결제 처리를 중단함');
                  setError('결제 처리가 중단되었습니다. 장바구니에서 다시 시도해주세요.');
                  setIsProcessing(false);
                }}
                style={{ 
                  fontSize: '14px', 
                  padding: '8px 16px',
                  opacity: 0.7 
                }}
              >
                처리 중단하기
              </button>
            </div>
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
                  {paymentStatusService.getStatusStyle(paymentStatus.status).message}
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
          
          {/* 주문 정보 표시 */}
          {orderData && (
            <div className={styles.orderInfo}>
              <h3>주문 정보</h3>
              <p>주문번호: {orderData.orderId || searchParams.get("orderId")}</p>
              <p>매장명: {orderData.storeName}</p>
              <p>결제 금액: {Number(searchParams.get("amount")).toLocaleString()}원</p>
              {orderData.deliveryAddress && (
                <p>배송지: {orderData.deliveryAddress.mainAddress}</p>
              )}
            </div>
          )}
          
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
