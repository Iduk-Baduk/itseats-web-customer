import React, { useState } from 'react';
import { orderAPI } from '../services/orderAPI';
import { logger } from '../utils/logger';
import styles from './TestBackendIntegration.module.css';

export default function TestBackendIntegration() {
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const testPaymentConfirmation = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      // 테스트용 결제 데이터
      const testPaymentData = {
        orderId: `test_order_${Date.now()}`,
        amount: 15000,
        paymentKey: `test_payment_${Date.now()}`
      };

      logger.log('백엔드 결제 승인 테스트 시작:', testPaymentData);

      const response = await orderAPI.confirmPayment(testPaymentData);
      
      setTestResult({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

      logger.log('백엔드 결제 승인 테스트 성공:', response.data);

    } catch (error) {
      setError({
        message: error.message,
        timestamp: new Date().toISOString()
      });
      logger.error('백엔드 결제 승인 테스트 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>백엔드 API 연동 테스트</h1>
      
      <div className={styles.testSection}>
        <h2>결제 승인 API 테스트</h2>
        <p>백엔드의 /api/orders/confirm 엔드포인트를 테스트합니다.</p>
        
        <button 
          className={styles.testButton}
          onClick={testPaymentConfirmation}
          disabled={isLoading}
        >
          {isLoading ? '테스트 중...' : '결제 승인 테스트'}
        </button>

        {isLoading && (
          <div className={styles.loading}>
            <p>백엔드 API 호출 중...</p>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <h3>❌ 테스트 실패</h3>
            <p><strong>에러:</strong> {error.message}</p>
            <p><strong>시간:</strong> {error.timestamp}</p>
          </div>
        )}

        {testResult && (
          <div className={styles.success}>
            <h3>✅ 테스트 성공</h3>
            <p><strong>시간:</strong> {testResult.timestamp}</p>
            <div className={styles.resultData}>
              <h4>응답 데이터:</h4>
              <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      <div className={styles.infoSection}>
        <h2>테스트 정보</h2>
        <ul>
          <li><strong>API 엔드포인트:</strong> /api/orders/confirm</li>
          <li><strong>요청 방식:</strong> POST</li>
          <li><strong>필수 파라미터:</strong> orderId, amount, paymentKey</li>
          <li><strong>환경:</strong> {import.meta.env.VITE_APP_ENV || 'development'}</li>
          <li><strong>백엔드 URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}</li>
        </ul>
      </div>
    </div>
  );
} 
