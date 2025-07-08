import React, { useState, useCallback } from 'react';
import { usePayment } from '../../hooks/usePayment';
import { validatePaymentData, formatAmount } from '../../utils/paymentUtils';
import { logger } from '../../utils/logger';
import styles from './TossPaymentWidget.module.css';

export default function TossPaymentWidget({ 
  orderData, 
  onSuccess, 
  onError, 
  onCancel,
  disabled = false 
}) {
  const { loading, error, paymentStatus, processPayment, clearError } = usePayment();
  const [validationError, setValidationError] = useState(null);

  const handlePayment = useCallback(async () => {
    try {
      // 입력 데이터 검증
      setValidationError(null);
      validatePaymentData(orderData);

      logger.log('결제 시작:', orderData);

      // 결제 프로세스 실행
      await processPayment(orderData);

      // 성공 콜백 호출
      if (onSuccess) {
        onSuccess(orderData);
      }

    } catch (err) {
      logger.error('결제 위젯 오류:', err);
      
      // 검증 오류인지 확인
      if (err.message.includes('필수 결제 정보') || err.message.includes('결제 금액')) {
        setValidationError(err.message);
      } else {
        // 일반 오류는 onError 콜백으로 전달
        if (onError) {
          onError(err);
        }
      }
    }
  }, [orderData, processPayment, onSuccess, onError]);

  const handleCancel = useCallback(() => {
    clearError();
    setValidationError(null);
    if (onCancel) {
      onCancel();
    }
  }, [clearError, onCancel]);

  // 로딩 상태 표시
  const getLoadingText = () => {
    switch (paymentStatus) {
      case 'PREPARING':
        return '결제 정보를 준비하고 있습니다...';
      case 'REQUESTING':
        return '결제창을 실행하고 있습니다...';
      case 'REDIRECTING':
        return '결제창으로 이동합니다...';
      default:
        return '결제를 처리하고 있습니다...';
    }
  };

  // 버튼 비활성화 조건
  const isButtonDisabled = disabled || loading || !orderData;

  return (
    <div className={styles.paymentWidget}>
      {/* 결제 정보 요약 */}
      <div className={styles.paymentSummary}>
        <h3>결제 정보</h3>
        <div className={styles.summaryItem}>
          <span>주문번호:</span>
          <span>{orderData?.orderId || '-'}</span>
        </div>
        <div className={styles.summaryItem}>
          <span>주문명:</span>
          <span>{orderData?.orderName || '-'}</span>
        </div>
        <div className={styles.summaryItem}>
          <span>결제 금액:</span>
          <span className={styles.amount}>
            {orderData?.amount ? formatAmount(orderData.amount) + '원' : '-'}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span>고객명:</span>
          <span>{orderData?.customerName || '-'}</span>
        </div>
      </div>

      {/* 검증 오류 표시 */}
      {validationError && (
        <div className={styles.validationError}>
          <p>⚠️ {validationError}</p>
        </div>
      )}

      {/* 결제 오류 표시 */}
      {error && (
        <div className={styles.paymentError}>
          <p>❌ {error}</p>
          <button 
            className={styles.retryButton}
            onClick={clearError}
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 로딩 상태 표시 */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>{getLoadingText()}</p>
        </div>
      )}

      {/* 결제 버튼 */}
      <div className={styles.paymentActions}>
        <button
          className={`${styles.paymentButton} ${isButtonDisabled ? styles.disabled : ''}`}
          onClick={handlePayment}
          disabled={isButtonDisabled}
        >
          {loading ? '처리 중...' : '결제하기'}
        </button>
        
        <button
          className={styles.cancelButton}
          onClick={handleCancel}
          disabled={loading}
        >
          취소
        </button>
      </div>

      {/* 결제 안내 */}
      <div className={styles.paymentInfo}>
        <p>💳 안전한 결제를 위해 토스페이먼츠가 제공하는 결제창을 사용합니다.</p>
        <p>🔒 카드 정보는 안전하게 암호화되어 전송됩니다.</p>
      </div>
    </div>
  );
} 
