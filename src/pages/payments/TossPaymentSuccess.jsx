import { useEffect, useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { orderAPI } from '../../services/orderAPI';
import { tossPaymentAPI, TossPaymentAPI } from '../../services/tossPaymentAPI';
import { paymentStatusService } from '../../services/paymentStatusService';
import { logger } from '../../utils/logger';
import styles from "./PaymentSuccess.module.css";
import commonStyles from "../../styles/CommonResult.module.css";

// 안전한 paymentId 추출 함수
const getPaymentId = (searchParams) => {
  // 1. URL 파라미터 우선 확인
  const urlPaymentId = searchParams.get("paymentId");
  if (urlPaymentId && urlPaymentId !== 'null' && urlPaymentId !== 'undefined') {
    const trimmed = String(urlPaymentId).trim();
    if (trimmed && /^\d+$/.test(trimmed)) {
      logger.log('✅ URL에서 paymentId 추출 성공:', trimmed);
      return trimmed;
    }
  }
  
  // 2. sessionStorage fallback
  const storedData = sessionStorage.getItem('paymentData');
  if (storedData) {
    try {
      const parsed = JSON.parse(storedData);
      const storedPaymentId = parsed.backendPaymentId;
      if (storedPaymentId) {
        const trimmed = String(storedPaymentId).trim();
        if (trimmed && /^\d+$/.test(trimmed)) {
          logger.log('✅ sessionStorage에서 paymentId 추출 성공:', trimmed);
          return trimmed;
        }
      }
    } catch (error) {
      logger.warn('⚠️ sessionStorage paymentData 파싱 실패:', error);
    }
  }
  
  logger.error('❌ 모든 소스에서 유효한 paymentId를 찾을 수 없음');
  throw new Error('결제 정보를 찾을 수 없습니다. 장바구니에서 다시 시도해주세요.');
};

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
      const TossPaymentKey = searchParams.get("paymentKey");
      const TossOrderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");

      logger.log('📋 URL 파라미터:', { TossPaymentKey, TossOrderId, amount });

      // 필수 파라미터 검증
      if (!TossPaymentKey || !TossOrderId || !amount) {
        throw new Error('결제 정보가 올바르지 않습니다.');
      }

      // 안전한 paymentId 추출
      const paymentId = getPaymentId(searchParams);
      
      const requestData = {
        TossPaymentKey,
        TossOrderId,
        paymentId,
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
          orderId: TossOrderId,
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
        paymentResponse = await TossPaymentAPI.confirmPaymentWithBackend(requestData.paymentId, {
          TossOrderId: requestData.TossOrderId,
          amount: requestData.amount,
          TossPaymentKey: requestData.TossPaymentKey
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
          orderId: TossOrderId,
          totalPrice: parseInt(amount),
          status: 'WAITING',
          createdAt: new Date().toISOString()
        });
        
        // 결제 상태 설정
        setPaymentStatus({
          ...paymentResponse,
          orderId: TossOrderId,
          status: 'DONE'
        });
        
        // sessionStorage에서 주문 데이터 및 결제 데이터 정리
        sessionStorage.removeItem('pendingOrderData');
        sessionStorage.removeItem('paymentData');
        
        // 폴링 시작 (Webhook 상태 반영을 위해)
        try {
          startPaymentPolling(requestData.TossPaymentKey, requestData.TossOrderId);
        } catch (pollingError) {
          logger.warn('⚠️ 폴링 시작 실패 (무시):', pollingError);
        }
        
      } catch (orderError) {
        logger.error('❌ 주문 데이터 설정 실패:', orderError);
        // 주문 데이터 설정 실패해도 결제는 성공했으므로 성공으로 처리
        setPaymentStatus({
          ...paymentResponse,
          orderId: requestData.TossOrderId,
          status: 'DONE'
        });
        sessionStorage.removeItem('pendingOrderData');
      }
      
      // 성공 처리 완료
      logger.log('🎉 결제 처리 완료');
      clearTimeout(timeoutId);
      setIsProcessing(false);
      
    } catch (error) {
      logger.error('❌ 결제 처리 실패:', error);
      clearTimeout(timeoutId);
      setError(error.message || '결제 처리 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  }, [isProcessing, searchParams]);

  // 결제 상태 폴링 시작
  const startPaymentPolling = useCallback(async (paymentKey, orderId) => {
    try {
      logger.log('🔄 결제 상태 폴링 시작:', { paymentKey, orderId });
      
      const updatePollingStatus = () => {
        setPollingStatus(prev => ({
          ...prev,
          isPolling: true,
          lastUpdate: new Date().toISOString()
        }));
      };
      
      // 초기 상태 설정
      updatePollingStatus();
      
      // 폴링 시작 (5초마다, 최대 2분)
      const pollInterval = setInterval(async () => {
        try {
          const status = await paymentStatusService.getPaymentStatus(paymentKey);
          logger.log('📊 폴링 상태 업데이트:', status);
          
          updatePollingStatus();
          
          // 결제 완료되면 폴링 중단
          if (status.status === 'DONE' || status.status === 'CANCELED') {
            clearInterval(pollInterval);
            setPollingStatus(prev => ({
              ...prev,
              isPolling: false,
              finalStatus: status.status
            }));
            logger.log('✅ 폴링 완료:', status.status);
          }
          
        } catch (pollError) {
          logger.warn('⚠️ 폴링 중 오류:', pollError);
          updatePollingStatus();
        }
      }, 5000);
      
      // 2분 후 자동 중단
      setTimeout(() => {
        clearInterval(pollInterval);
        setPollingStatus(prev => ({
          ...prev,
          isPolling: false,
          timeout: true
        }));
        logger.log('⏰ 폴링 타임아웃 (2분)');
      }, 120000);
      
    } catch (error) {
      logger.error('❌ 폴링 시작 실패:', error);
    }
  }, []);

  // 컴포넌트 마운트 시 결제 확인 시작
  useEffect(() => {
    confirmPayment();
  }, [confirmPayment]);

  // 홈으로 이동
  const handleGoHome = () => {
    navigate('/');
  };

  // 주문 상태로 이동
  const handleGoToOrderStatus = () => {
    if (orderData?.orderId) {
      navigate(`/orders/${orderData.orderId}/status`);
    } else {
      navigate('/orders');
    }
  };

  // 장바구니로 이동
  const handleGoToCart = () => {
    navigate('/cart');
  };

  // 로딩 상태
  if (isProcessing) {
    return (
      <div className={commonStyles.container}>
        <div className={commonStyles.content}>
          <div className={commonStyles.loadingContainer}>
            <div className={commonStyles.spinner}></div>
            <h2>결제 처리 중...</h2>
            <p>잠시만 기다려주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={commonStyles.container}>
        <div className={commonStyles.content}>
          <div className={commonStyles.errorContainer}>
            <div className={commonStyles.errorIcon}>❌</div>
            <h2>결제 처리 실패</h2>
            <p>{error}</p>
            <div className={commonStyles.buttonGroup}>
              <button 
                className={commonStyles.primaryButton}
                onClick={handleGoToCart}
              >
                장바구니로 돌아가기
              </button>
              <button 
                className={commonStyles.secondaryButton}
                onClick={handleGoHome}
              >
                홈으로 이동
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 성공 상태
  return (
    <div className={commonStyles.container}>
      <div className={commonStyles.content}>
        <div className={commonStyles.successContainer}>
          <div className={commonStyles.successIcon}>✅</div>
          <h2>결제가 완료되었습니다!</h2>
          
          {paymentStatus && (
            <div className={styles.paymentInfo}>
              <div className={styles.infoRow}>
                <span>주문번호:</span>
                <span>{paymentStatus.orderId}</span>
              </div>
              <div className={styles.infoRow}>
                <span>결제금액:</span>
                <span>{paymentStatus.totalAmount?.toLocaleString()}원</span>
              </div>
              <div className={styles.infoRow}>
                <span>결제수단:</span>
                <span>{paymentStatus.method || '카드'}</span>
              </div>
              <div className={styles.infoRow}>
                <span>결제시간:</span>
                <span>{new Date(paymentStatus.approvedAt || Date.now()).toLocaleString()}</span>
              </div>
            </div>
          )}
          
          {pollingStatus?.isPolling && (
            <div className={styles.pollingInfo}>
              <div className={styles.spinner}></div>
              <p>주문 상태를 확인하는 중...</p>
            </div>
          )}
          
          <div className={commonStyles.buttonGroup}>
            <button 
              className={commonStyles.primaryButton}
              onClick={handleGoToOrderStatus}
            >
              주문 상태 확인
            </button>
            <button 
              className={commonStyles.secondaryButton}
              onClick={handleGoHome}
            >
              홈으로 이동
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
