import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPaymentProcessing, setPaymentError } from '../../store/paymentSlice';
import { orderAPI } from '../../services';
import { logger } from '../../utils/logger';
import { ENV_CONFIG } from '../../config/api';

import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './TossPayment.module.css';

export default function TossPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tossWidget, setTossWidget] = useState(null);
  
  // URL 파라미터에서 결제 정보 추출
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const orderName = searchParams.get('orderName');
  const customerName = searchParams.get('customerName');
  const customerEmail = searchParams.get('customerEmail');

  useEffect(() => {
    const initializeTossPayment = async () => {
      try {
        setIsLoading(true);
        
        // 필수 파라미터 검증
        if (!orderId || !amount) {
          throw new Error('주문 정보가 올바르지 않습니다.');
        }

        logger.log('🔄 토스페이먼츠 결제 초기화:', {
          orderId,
          amount,
          orderName,
          customerName,
          customerEmail
        });

        // 토스페이먼츠 SDK 로드 확인
        if (typeof window.TossPayments === 'undefined') {
          throw new Error('토스페이먼츠 SDK를 로드할 수 없습니다.');
        }

        // 토스페이먼츠 위젯 초기화
        const tossPayments = window.TossPayments(ENV_CONFIG.TOSS_CLIENT_KEY);
        
        // 결제 위젯 렌더링
        const widget = tossPayments.requestPayment('카드', {
          amount: parseInt(amount),
          orderId: orderId,
          orderName: orderName || '주문',
          customerName: customerName || '고객',
          customerEmail: customerEmail || 'customer@example.com',
          successUrl: `${window.location.origin}/payments/toss/success`,
          failUrl: `${window.location.origin}/payments/failure`,
        });

        setTossWidget(widget);
        setIsLoading(false);

      } catch (error) {
        logger.error('❌ 토스페이먼츠 초기화 실패:', error);
        setError(error.message);
        setIsLoading(false);
        
        // 에러 발생 시 결제 실패 페이지로 이동
        setTimeout(() => {
          navigate('/payments/failure?error=initialization_failed&message=' + encodeURIComponent(error.message));
        }, 2000);
      }
    };

    initializeTossPayment();
  }, [orderId, amount, orderName, customerName, customerEmail, navigate]);

  const handleCancel = () => {
    if (tossWidget) {
      tossWidget.close();
    }
    navigate('/cart');
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Header
          title="결제 진행 중"
          leftIcon="close"
          leftButtonAction={handleCancel}
        />
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
          <p>토스페이먼츠 결제를 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Header
          title="결제 오류"
          leftIcon="close"
          leftButtonAction={() => navigate('/cart')}
        />
        <div className={styles.errorContainer}>
          <h2>결제 초기화 실패</h2>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header
        title="결제"
        leftIcon="close"
        leftButtonAction={handleCancel}
      />
      <div className={styles.paymentContainer}>
        <div className={styles.orderInfo}>
          <h2>주문 정보</h2>
          <div className={styles.orderDetails}>
            <p><strong>주문번호:</strong> {orderId}</p>
            <p><strong>주문명:</strong> {orderName}</p>
            <p><strong>결제금액:</strong> {parseInt(amount).toLocaleString()}원</p>
          </div>
        </div>
        <div className={styles.paymentWidget}>
          <p>토스페이먼츠 결제 위젯이 로드되었습니다.</p>
          <p>결제 창이 자동으로 열립니다...</p>
        </div>
      </div>
    </div>
  );
} 
