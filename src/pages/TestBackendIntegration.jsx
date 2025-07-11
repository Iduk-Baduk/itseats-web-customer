import React, { useState } from 'react';
import { orderAPI } from '../services/orderAPI';
import { logger } from '../utils/logger';
import apiClient from '../services/apiClient';
import AuthService from '../services/authService';
import styles from './TestBackendIntegration.module.css';

export default function TestBackendIntegration() {
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState({
    isAuthenticated: AuthService.isAuthenticated(),
    hasToken: !!AuthService.getToken(),
    userInfo: AuthService.getUserInfo()
  });

  const testPaymentConfirmation = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      // 인증 상태 확인
      if (!AuthService.isAuthenticated()) {
        throw new Error('로그인이 필요합니다. 먼저 로그인해주세요.');
      }

      logger.log('백엔드 결제 플로우 테스트 시작');

      // 1. 주소 목록 조회
      logger.log('1단계: 주소 목록 조회 시작');
      const addressesResponse = await apiClient.get('/addresses');
      const addresses = addressesResponse.data;
      logger.log('주소 목록 조회 성공:', addresses);

      // 첫 번째 주소 사용 (실제 존재하는 주소 ID)
      const selectedAddress = addresses.length > 0 ? addresses[0] : null;
      if (!selectedAddress) {
        throw new Error('등록된 주소가 없습니다. 먼저 주소를 등록해주세요.');
      }

      // 2. 매장 목록 조회
      logger.log('2단계: 매장 목록 조회 시작');
      const storesResponse = await apiClient.get('/stores/list');
      const stores = storesResponse.data;
      logger.log('매장 목록 조회 성공:', stores);

      // 매장이 없으면 테스트용 매장 ID 사용
      let selectedStore;
      if (stores.length > 0) {
        selectedStore = stores[0];
        logger.log('실제 매장 사용:', selectedStore);
      } else {
        // 테스트용 매장 ID 사용 (백엔드에서 제공하는 테스트 매장 ID)
        selectedStore = { id: 2, storeId: 2, name: '테스트 매장' };
        logger.log('테스트용 매장 ID 사용:', selectedStore);
      }

      // 3. 주문 생성
      const testOrderData = {
        addrId: selectedAddress.addressId || selectedAddress.id, // 실제 주소 ID 사용
        storeId: selectedStore.id || selectedStore.storeId, // 실제 매장 ID 사용
        orderMenus: [
          {
            menuId: 1,
            quantity: 2,
            price: 7500
          }
        ],
        deliveryType: "DEFAULT"
      };

      logger.log('3단계: 주문 생성 시작');
      logger.log('주문 데이터:', testOrderData);
      const orderResponse = await apiClient.post('/orders/new', testOrderData);
      const orderId = orderResponse.data.orderId;
      logger.log('주문 생성 성공:', { orderId, orderData: orderResponse.data });

      // 4. 결제 생성
      const testPaymentData = {
        orderId: orderId,
        totalCost: orderResponse.data.totalCost,
        paymentMethod: 'CARD'
      };

      logger.log('4단계: 결제 생성 시작');
      const paymentResponse = await apiClient.post('/payments', testPaymentData);
      const paymentId = paymentResponse.data.paymentId;
      logger.log('결제 생성 성공:', { paymentId, paymentData: paymentResponse.data });

      // 5. 결제 승인 (실제 생성된 paymentId 사용)
      const confirmData = {
        paymentKey: `test_payment_key_${Date.now()}`,
        orderId: orderId,
        amount: orderResponse.data.totalCost
      };

      logger.log('5단계: 결제 승인 시작');
      logger.log('결제 승인 요청:', { paymentId, confirmData });

      const confirmResponse = await apiClient.post(`/payments/${paymentId}/confirm`, confirmData);
      
      setTestResult({
        success: true,
        data: {
          order: orderResponse.data,
          payment: paymentResponse.data,
          confirmation: confirmResponse.data
        },
        timestamp: new Date().toISOString()
      });

      logger.log('백엔드 결제 플로우 테스트 성공:', confirmResponse.data);

    } catch (error) {
      // 에러 상세 정보 로깅
      logger.error('백엔드 결제 플로우 테스트 실패:', {
        message: error.message,
        statusCode: error.statusCode,
        type: error.type,
        originalError: error.originalError,
        response: error.response
      });

      setError({
        message: error.message,
        timestamp: new Date().toISOString(),
        details: {
          statusCode: error.statusCode,
          type: error.type,
          originalError: error.originalError?.message || error.message
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testSimpleAPI = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      logger.log('간단한 API 테스트 시작');

      // 간단한 GET 요청으로 백엔드 연결 상태 확인
      const responseData = await apiClient.get('/stores/list');
      
      setTestResult({
        success: true,
        data: responseData,
        timestamp: new Date().toISOString(),
        testType: 'simple_api'
      });

      logger.log('간단한 API 테스트 성공:', responseData);

    } catch (error) {
      logger.error('간단한 API 테스트 실패:', {
        message: error.message,
        statusCode: error.statusCode,
        type: error.type,
        originalError: error.originalError
      });

      setError({
        message: error.message,
        timestamp: new Date().toISOString(),
        details: {
          statusCode: error.statusCode,
          type: error.type,
          originalError: error.originalError?.message || error.message
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>백엔드 API 연동 테스트</h1>
      
      <div className={styles.authSection}>
        <h2>🔐 인증 상태</h2>
        <div className={styles.authInfo}>
          <p><strong>로그인 상태:</strong> {authStatus.isAuthenticated ? '✅ 로그인됨' : '❌ 로그아웃됨'}</p>
          <p><strong>토큰 존재:</strong> {authStatus.hasToken ? '✅ 있음' : '❌ 없음'}</p>
          {authStatus.userInfo && (
            <p><strong>사용자:</strong> {authStatus.userInfo.email || authStatus.userInfo.name || '알 수 없음'}</p>
          )}
        </div>
        {!authStatus.isAuthenticated && (
          <div className={styles.warning}>
            <p>⚠️ API 테스트를 위해서는 먼저 로그인이 필요합니다.</p>
            <button 
              className={styles.loginButton}
              onClick={() => window.location.href = '/login'}
            >
              로그인 페이지로 이동
            </button>
          </div>
        )}
      </div>
      
      <div className={styles.testSection}>
        <h2>간단한 API 연결 테스트</h2>
        <p>백엔드 연결 상태를 확인하기 위해 /api/stores/list 엔드포인트를 테스트합니다.</p>
        
        <button 
          className={styles.testButton}
          onClick={testSimpleAPI}
          disabled={isLoading}
        >
          {isLoading ? '테스트 중...' : '간단한 API 테스트'}
        </button>
      </div>

      <div className={styles.testSection}>
        <h2>결제 플로우 API 테스트</h2>
        <p>주소 조회 → 매장 조회 → 주문 생성 → 결제 생성 → 결제 승인 순서로 전체 플로우를 테스트합니다.</p>
        
        <button 
          className={styles.testButton}
          onClick={testPaymentConfirmation}
          disabled={isLoading}
        >
          {isLoading ? '테스트 중...' : '결제 플로우 테스트'}
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
            {error.details && (
              <div className={styles.errorDetails}>
                <p><strong>상태 코드:</strong> {error.details.statusCode}</p>
                <p><strong>에러 타입:</strong> {error.details.type}</p>
                <p><strong>상세 정보:</strong> {error.details.originalError}</p>
              </div>
            )}
          </div>
        )}

        {testResult && (
          <div className={styles.success}>
            <h3>✅ 테스트 성공</h3>
            <p><strong>시간:</strong> {testResult.timestamp}</p>
            {testResult.testType && (
              <p><strong>테스트 유형:</strong> {testResult.testType === 'simple_api' ? '간단한 API 연결 테스트' : '결제 플로우 테스트'}</p>
            )}
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
          <li><strong>API 엔드포인트:</strong> /api/payments/&#123;paymentId&#125;/confirm</li>
          <li><strong>요청 방식:</strong> POST</li>
          <li><strong>필수 파라미터:</strong> paymentKey, orderId, amount</li>
          <li><strong>환경:</strong> {import.meta.env.VITE_APP_ENV || 'development'}</li>
          <li><strong>백엔드 URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}</li>
        </ul>
      </div>
    </div>
  );
} 
