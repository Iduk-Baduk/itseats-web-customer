import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TossPaymentAPI } from '../../services/tossPaymentAPI';
import { paymentStatusService } from '../../services/paymentStatusService';
import { logger } from '../../utils/logger';
import { ENV_CONFIG } from '../../config/api';
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
      
      // URL 파라미터에서 결제 정보 추출 (토스페이먼츠 공식 문서에 따라)
      const paymentKey = searchParams.get("paymentKey");
      const tossOrderId = searchParams.get("orderId"); // String 타입(토스용)
      const amount = searchParams.get("amount");
      const paymentType = searchParams.get("paymentType");

      // URL 파라미터 로깅
      logger.log('🔍 결제 성공 페이지 URL 파라미터 (토스페이먼츠):', {
        paymentKey,
        tossOrderId,
        amount,
        paymentType,
        fullUrl: window.location.href,
        search: window.location.search
      });
      
      if (!paymentKey || !tossOrderId || !amount) {
        throw new Error('결제 정보가 올바르지 않습니다.');
      }

      const requestData = {
        paymentKey,
        orderId: tossOrderId,
        amount: parseInt(amount)
      };

      logger.log('📡 토스페이먼츠 결제 승인 시작:', requestData);
      
      // 주문 데이터 설정 (URL 파라미터 기반)
      const orderData = {
        orderId: tossOrderId,
        totalPrice: parseInt(amount),
        paymentMethod: { type: 'CARD' },
        storeRequest: '',
        riderRequest: '문 앞에 놔주세요 (초인종 O)',
        couponIds: []
      };
      
      let paymentResponse;
      
      try {
        // 새로운 단순한 결제 확인 API 사용
        logger.log('📡 새로운 단순한 결제 확인 요청:', { 
          paymentKey: requestData.paymentKey,
          orderId: requestData.orderId,
          amount: requestData.amount
        });
        
        const tossPaymentAPI = new TossPaymentAPI();
        paymentResponse = await tossPaymentAPI.confirmPayment({
          paymentKey: requestData.paymentKey,
          orderId: requestData.orderId,
          amount: requestData.amount
        });
        
        logger.log('✅ 새로운 결제 확인 성공:', paymentResponse);
        
      } catch (backendError) {
        logger.error('❌ 새로운 결제 확인 실패:', backendError);
        
        // 개발 환경에서 백엔드 API 실패 시 mock 데이터 사용 (401 에러 포함)
        if (ENV_CONFIG.isDevelopment && (backendError.statusCode === 500 || backendError.statusCode === 401)) {
          logger.warn('🔧 개발 환경: 백엔드 API 실패로 mock 데이터 사용');
          paymentResponse = {
            data: {
              paymentKey: requestData.paymentKey,
              orderId: requestData.orderId,
              amount: requestData.amount,
              status: 'DONE',
              method: 'CARD',
              approvedAt: new Date().toISOString(),
              totalAmount: requestData.amount,
              balanceAmount: 0,
              suppliedAmount: requestData.amount,
              vat: Math.floor(requestData.amount * 0.1),
              useEscrow: false,
              currency: 'KRW',
              receiptUrl: 'https://test-receipt.toss.im',
              card: {
                company: '신한카드',
                number: '1234-****-****-1234',
                installmentPlanMonths: 0,
                isInterestFree: false,
                approveNo: '12345678',
                useCardPoint: false,
                cardType: '신용',
                ownerType: '개인',
                acquireStatus: 'APPROVED',
                amount: requestData.amount
              }
            }
          };
        } else {
          // 401 에러인 경우 인증 실패로 처리
          if (backendError.statusCode === 401) {
            logger.warn('🔐 인증 실패 - 로그인 페이지로 리다이렉트');
            const errorMessage = backendError.originalError?.response?.data?.message || '인증 정보가 없습니다. 다시 로그인해주세요.';
            setError(errorMessage);
            setIsProcessing(false);
            
            // 3초 후 로그인 페이지로 리다이렉트
            setTimeout(() => {
              navigate('/login');
            }, 3000);
            return;
          }
          
          throw new Error('결제 처리를 완료할 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
      }
      
      // 주문 생성은 이미 Cart.jsx에서 완료되었으므로 여기서는 주문 데이터만 설정
      logger.log('📡 주문 데이터 설정');
      
      try {
        // 주문 데이터 설정 (이미 생성된 주문 정보 사용)
        setOrderData({
          orderId: tossOrderId,
          totalPrice: parseInt(amount),
          status: 'WAITING',
          createdAt: new Date().toISOString()
        });
        
        // 결제 상태 설정
        setPaymentStatus({
          ...paymentResponse,
          orderId: tossOrderId,
          status: 'DONE'
        });
        
        // sessionStorage 정리
        sessionStorage.removeItem('pendingOrderData');
        sessionStorage.removeItem('paymentData');
        
        // 폴링 시작 (Webhook 상태 반영을 위해)
        try {
          paymentStatusService.startPolling(
            requestData.paymentKey,
            requestData.orderId,
            (status) => {
              logger.log('결제 상태 업데이트:', status);
              setPaymentStatus(status);
            },
            (finalStatus) => {
              logger.log('결제 최종 상태:', finalStatus);
              setPaymentStatus(finalStatus);
            },
            (error) => {
              logger.error('결제 상태 폴링 오류:', error);
            }
          );
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
        sessionStorage.removeItem('paymentData');
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
      PaymentStatusService.startPolling(
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
