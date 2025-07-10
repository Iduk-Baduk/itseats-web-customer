import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPaymentProcessing, setPaymentError } from '../../store/paymentSlice';
import { orderAPI } from '../../services';
import { logger } from '../../utils/logger';
import { ENV_CONFIG } from '../../config/api';
import { TossPaymentWidget } from '../../components/payment/TossPaymentWidget';

import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './TossPayment.module.css';

export default function TossPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // URL 파라미터에서 결제 정보 추출
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const orderName = searchParams.get('orderName');
  const customerName = searchParams.get('customerName');
  const customerEmail = searchParams.get('customerEmail');

  useEffect(() => {
    // 필수 파라미터 검증
    if (!orderId || !amount) {
      setError('주문 정보가 올바르지 않습니다.');
      setIsLoading(false);
      return;
    }
    
    // amount 숫자 검증
    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('결제 금액이 올바르지 않습니다.');
      setIsLoading(false);
      return;
    }

    // 잠시 후 로딩 상태 해제
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [orderId, amount]);

  const handlePaymentSuccess = async (paymentKey) => {
    try {
      // 결제 성공 처리
      const response = await orderAPI.confirmPayment(orderId, paymentKey);
      navigate('/payments/success', { 
        state: { 
          orderId,
          paymentKey,
          amount 
        }
      });
    } catch (error) {
      logger.error('결제 승인 실패:', error);
      navigate('/payments/failure', {
        state: {
          error: 'payment_confirmation_failed',
          message: error.message
        }
      });
    }
  };

  const handlePaymentError = (error) => {
    logger.error('결제 실패:', error);
    navigate('/payments/failure', {
      state: {
        error: error.code || 'payment_failed',
        message: error.message
      }
    });
  };

  const handleCancel = () => {
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
          <div id="payment-widget"></div>
          <TossPaymentWidget
            orderId={orderId}
            amount={parseInt(amount)}
            orderName={orderName}
            customerName={customerName}
            customerEmail={customerEmail}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </div>
      </div>
    </div>
  );
} 
