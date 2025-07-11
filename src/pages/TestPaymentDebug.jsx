import React, { useState } from 'react';
import { tossPaymentAPI } from '../services/tossPaymentAPI';
import { orderAPI } from '../services/orderAPI';
import { logger } from '../utils/logger';
import { safeParsePaymentId } from '../utils/paymentUtils';
import styles from './TestBackendIntegration.module.css';

export default function TestPaymentDebug() {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (testName, status, message) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      name: testName,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // 테스트 1: 결제 생성 API 테스트
  const testCreatePayment = async () => {
    setIsLoading(true);
    addTestResult('결제 생성 API 테스트', 'warning', '테스트 시작...');

    try {
      // 1. 테스트 주문 생성
      const testOrderData = {
        storeId: 1,
        storeName: "테스트 매장",
        totalPrice: 15000,
        deliveryFee: 0,
        orderMenus: [
          {
            menuId: 1,
            menuName: "테스트 메뉴",
            quantity: 1,
            price: 15000,
            options: []
          }
        ],
        deliveryAddress: {
          mainAddress: "서울시 강남구 테스트로 123",
          detailAddress: "101호",
          lat: 37.5665,
          lng: 126.9780
        },
        paymentMethod: {
          type: 'CARD',
          id: 'toss'
        },
        storeRequest: "테스트 주문입니다",
        riderRequest: "문 앞에 놔주세요",
        couponIds: []
      };

      const orderResponse = await orderAPI.createOrder(testOrderData);
      const orderId = orderResponse.data.orderId;
      addTestResult('주문 생성', 'success', `주문 ID: ${orderId}`);

      // 2. 결제 정보 생성
      const paymentInfo = {
        orderId: orderId,
        memberCouponId: null,
        totalCost: 15000,
        paymentMethod: 'CARD',
        storeRequest: '테스트 주문입니다',
        riderRequest: '문 앞에 놔주세요'
      };

      const paymentCreateResponse = await tossPaymentAPI.createPayment(paymentInfo);
      const paymentId = paymentCreateResponse.paymentId;
      
      addTestResult('결제 생성', 'success', `결제 ID: ${paymentId} (타입: ${typeof paymentId})`);
      
      // 3. sessionStorage에 저장
      const paymentDataForStorage = {
        paymentId: paymentId,
        orderId: orderId,
        amount: 15000
      };
      sessionStorage.setItem('paymentData', JSON.stringify(paymentDataForStorage));
      
      // 4. 저장된 데이터 검증
      const storedData = JSON.parse(sessionStorage.getItem('paymentData'));
      addTestResult('sessionStorage 저장', 'success', `저장된 paymentId: ${storedData.paymentId}`);

      // 5. 결제 승인 테스트 (실제 API 호출)
      const confirmData = {
        paymentKey: `test_payment_key_${Date.now()}`,
        orderId: orderId,
        amount: 15000
      };

      logger.log('📡 결제 승인 테스트 시작:', { paymentId, confirmData });
      
      try {
        const confirmResponse = await tossPaymentAPI.confirmPayment(paymentId, confirmData);
        addTestResult('결제 승인', 'success', '결제 승인 성공');
        logger.log('✅ 결제 승인 성공:', confirmResponse);
      } catch (confirmError) {
        addTestResult('결제 승인', 'error', `실패: ${confirmError.message}`);
        logger.error('❌ 결제 승인 실패:', confirmError);
      }

    } catch (error) {
      addTestResult('결제 생성 API 테스트', 'error', `실패: ${error.message}`);
      logger.error('❌ 결제 생성 API 테스트 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 테스트 2: sessionStorage 데이터 검증
  const testSessionStorage = () => {
    addTestResult('sessionStorage 검증', 'warning', '검증 시작...');

    try {
      const paymentData = sessionStorage.getItem('paymentData');
      if (!paymentData) {
        addTestResult('sessionStorage 검증', 'error', 'paymentData가 없습니다');
        return;
      }

      const parsedData = JSON.parse(paymentData);
      addTestResult('sessionStorage 파싱', 'success', 'JSON 파싱 성공');

      const { paymentId, orderId, amount } = parsedData;
      
      addTestResult('paymentId 검증', 
        !isNaN(paymentId) && paymentId > 0 ? 'success' : 'error',
        `paymentId: ${paymentId} (타입: ${typeof paymentId})`
      );

      addTestResult('orderId 검증', 
        orderId ? 'success' : 'error',
        `orderId: ${orderId}`
      );

      addTestResult('amount 검증', 
        !isNaN(amount) && amount > 0 ? 'success' : 'error',
        `amount: ${amount}`
      );

    } catch (error) {
      addTestResult('sessionStorage 검증', 'error', `실패: ${error.message}`);
    }
  };

  // 테스트 3: API 엔드포인트 테스트
  const testApiEndpoints = () => {
    addTestResult('API 엔드포인트 검증', 'warning', '검증 시작...');

    const { API_ENDPOINTS, API_CONFIG } = require('../config/api');
    
    const paymentId = 12345;
    const confirmEndpoint = API_ENDPOINTS.PAYMENT_CONFIRM(paymentId);
    const fullUrl = `${API_CONFIG.BASE_URL}${confirmEndpoint}`;
    
    addTestResult('결제 승인 엔드포인트', 'success', 
      `엔드포인트: ${confirmEndpoint}\n전체 URL: ${fullUrl}`
    );

    addTestResult('API 설정', 'success', 
      `BASE_URL: ${API_CONFIG.BASE_URL}\nTIMEOUT: ${API_CONFIG.TIMEOUT}ms`
    );
  };

  // 테스트 4: 숫자 paymentId 검증 테스트
  const testNumericPaymentId = () => {
    addTestResult('숫자 paymentId 검증 테스트', 'warning', '테스트 시작...');

    // 숫자 ID 테스트
    const numericId = 12345;
    const isValidNumeric = !isNaN(numericId) && numericId > 0;
    
    addTestResult('숫자 ID 검증', 
      isValidNumeric ? 'success' : 'error',
      `ID: ${numericId}\n유효성: ${isValidNumeric}`
    );

    // 문자열 숫자 테스트
    const stringNumericId = "67890";
    const numericFromString = Number(stringNumericId);
    const isValidStringNumeric = !isNaN(numericFromString) && numericFromString > 0;
    
    addTestResult('문자열 숫자 ID 검증', 
      isValidStringNumeric ? 'success' : 'error',
      `원본: ${stringNumericId}\n변환된 ID: ${numericFromString}\n유효성: ${isValidStringNumeric}`
    );

    // 잘못된 형식 테스트
    const invalidId = "invalid";
    const numericFromInvalid = Number(invalidId);
    const isValidInvalid = !isNaN(numericFromInvalid) && numericFromInvalid > 0;
    
    addTestResult('잘못된 ID 처리', 
      !isValidInvalid ? 'success' : 'error',
      `원본: ${invalidId}\n변환된 ID: ${numericFromInvalid}\n유효성: ${isValidInvalid}`
    );
  };

  // 테스트 5: 토스페이먼츠 URL 생성 테스트
  const testTossPaymentUrl = () => {
    addTestResult('토스페이먼츠 URL 생성 테스트', 'warning', '테스트 시작...');

    // sessionStorage에 테스트 데이터 설정
    const testPaymentData = {
      paymentId: 12345,
      orderId: 'test-order-123',
      amount: 15000
    };
    sessionStorage.setItem('paymentData', JSON.stringify(testPaymentData));

    // 토스페이먼츠 위젯에서 사용하는 로직과 동일하게 URL 생성
    const storedPaymentData = sessionStorage.getItem('paymentData');
    let paymentId = null;
    
    if (storedPaymentData) {
      try {
        const parsedData = JSON.parse(storedPaymentData);
        paymentId = parsedData.paymentId;
        addTestResult('sessionStorage 파싱', 'success', `paymentId: ${paymentId}`);
      } catch (error) {
        addTestResult('sessionStorage 파싱', 'error', `실패: ${error.message}`);
        return;
      }
    }

    // 동적 success URL 생성
    const successUrl = paymentId 
      ? `${window.location.origin}/payments/toss-success?paymentId=${paymentId}`
      : `${window.location.origin}/payments/toss-success`;
    
    addTestResult('success URL 생성', 'success', `URL: ${successUrl}`);
    
    // URL 파라미터 검증
    const urlParams = new URLSearchParams(successUrl.split('?')[1] || '');
    const urlPaymentId = urlParams.get('paymentId');
    
    addTestResult('URL 파라미터 검증', 
      urlPaymentId === paymentId?.toString() ? 'success' : 'error',
      `URL paymentId: ${urlPaymentId}\n원본 paymentId: ${paymentId}`
    );

    // sessionStorage 정리
    sessionStorage.removeItem('paymentData');
    addTestResult('sessionStorage 정리', 'success', '테스트 데이터 정리 완료');
  };

  // 테스트 6: sessionStorage 복구 테스트
  const testSessionStorageRecovery = () => {
    addTestResult('sessionStorage 복구 테스트', 'warning', '테스트 시작...');

    // 1. sessionStorage 초기화
    sessionStorage.removeItem('paymentData');
    addTestResult('sessionStorage 초기화', 'success', 'paymentData 제거됨');

    // 2. URL 파라미터 시뮬레이션
    const mockUrlParams = new URLSearchParams('paymentId=67890&orderId=test-order-456&amount=20000');
    const urlPaymentId = mockUrlParams.get('paymentId');
    const orderId = mockUrlParams.get('orderId');
    const amount = mockUrlParams.get('amount');

    addTestResult('URL 파라미터 확인', 'success', 
      `paymentId: ${urlPaymentId}\norderId: ${orderId}\namount: ${amount}`
    );

    // 3. 토스페이먼츠 위젯의 복구 로직 시뮬레이션
    const storedPaymentData = sessionStorage.getItem('paymentData');
    let paymentId = null;
    
    if (storedPaymentData) {
      try {
        const parsedData = JSON.parse(storedPaymentData);
        paymentId = parsedData.paymentId;
        addTestResult('기존 sessionStorage 확인', 'success', `paymentId: ${paymentId}`);
      } catch (error) {
        addTestResult('기존 sessionStorage 확인', 'error', `실패: ${error.message}`);
      }
    } else {
      addTestResult('기존 sessionStorage 확인', 'warning', 'paymentData 없음');
      
      // URL에서 paymentId를 다시 저장
      if (urlPaymentId) {
        const paymentDataForStorage = {
          paymentId: urlPaymentId,
          orderId: orderId,
          amount: amount
        };
        sessionStorage.setItem('paymentData', JSON.stringify(paymentDataForStorage));
        paymentId = urlPaymentId;
        addTestResult('URL paymentId 복구', 'success', `paymentId: ${paymentId} 저장됨`);
      }
    }

    // 4. 복구된 데이터 검증
    const recoveredData = sessionStorage.getItem('paymentData');
    if (recoveredData) {
      try {
        const parsedRecovered = JSON.parse(recoveredData);
        addTestResult('복구된 데이터 검증', 'success', 
          `paymentId: ${parsedRecovered.paymentId}\norderId: ${parsedRecovered.orderId}\namount: ${parsedRecovered.amount}`
        );
      } catch (error) {
        addTestResult('복구된 데이터 검증', 'error', `실패: ${error.message}`);
      }
    } else {
      addTestResult('복구된 데이터 검증', 'error', '복구된 데이터 없음');
    }

    // 5. sessionStorage 정리
    sessionStorage.removeItem('paymentData');
    addTestResult('sessionStorage 정리', 'success', '테스트 데이터 정리 완료');
  };

  // 테스트 7: URL 파라미터 디버깅 테스트
  const testUrlParameterDebug = () => {
    addTestResult('URL 파라미터 디버깅 테스트', 'warning', '테스트 시작...');

    // 1. 현재 URL 정보 확인
    const currentUrl = window.location.href;
    const currentSearch = window.location.search;
    
    addTestResult('현재 URL 확인', 'success', 
      `URL: ${currentUrl}\nSearch: ${currentSearch}`
    );

    // 2. URL 파라미터 파싱
    const urlParams = new URLSearchParams(currentSearch);
    const allParams = {};
    for (const [key, value] of urlParams.entries()) {
      allParams[key] = value;
    }
    
    addTestResult('URL 파라미터 파싱', 'success', 
      `파라미터: ${JSON.stringify(allParams, null, 2)}`
    );

    // 3. sessionStorage 상태 확인
    const paymentData = sessionStorage.getItem('paymentData');
    const pendingOrderData = sessionStorage.getItem('pendingOrderData');
    
    addTestResult('sessionStorage 상태', 'success', 
      `paymentData: ${paymentData || '없음'}\npendingOrderData: ${pendingOrderData || '없음'}`
    );

    // 4. 결제 성공 페이지 URL 시뮬레이션
    const mockSuccessUrl = '/payments/toss-success?paymentKey=test_key&orderId=test_order&paymentId=12345&amount=15000';
    const mockSuccessParams = new URLSearchParams(mockSuccessUrl.split('?')[1]);
    
    addTestResult('결제 성공 URL 시뮬레이션', 'success', 
      `URL: ${mockSuccessUrl}\npaymentKey: ${mockSuccessParams.get('paymentKey')}\norderId: ${mockSuccessParams.get('orderId')}\npaymentId: ${mockSuccessParams.get('paymentId')}\namount: ${mockSuccessParams.get('amount')}`
    );

    // 5. 토스페이먼츠 위젯 URL 생성 시뮬레이션
    const mockPaymentId = 67890;
    const mockSuccessUrlGenerated = mockPaymentId 
      ? `${window.location.origin}/payments/toss-success?paymentId=${mockPaymentId}`
      : `${window.location.origin}/payments/toss-success`;
    
    addTestResult('토스페이먼츠 위젯 URL 생성', 'success', 
      `생성된 URL: ${mockSuccessUrlGenerated}`
    );
  };

  // 테스트 8: 토스페이먼츠 success URL 테스트
  const testTossSuccessUrl = () => {
    addTestResult('토스페이먼츠 success URL 테스트', 'warning', '테스트 시작...');

    // 1. 토스페이먼츠 결제 페이지에서 사용하는 success URL 생성
    const mockPaymentId = 12345;
    const successUrl = `${window.location.origin}/payments/toss-success?paymentId=${mockPaymentId}`;
    
    addTestResult('토스페이먼츠 결제 페이지 success URL', 'success', 
      `생성된 URL: ${successUrl}`
    );

    // 2. 토스페이먼츠 위젯에서 사용하는 로직 시뮬레이션
    const storedPaymentData = sessionStorage.getItem('paymentData');
    let paymentId = null;
    
    if (storedPaymentData) {
      try {
        const parsedData = JSON.parse(storedPaymentData);
        paymentId = parsedData.paymentId;
        addTestResult('sessionStorage에서 paymentId 확인', 'success', `paymentId: ${paymentId}`);
      } catch (error) {
        addTestResult('sessionStorage에서 paymentId 확인', 'error', `실패: ${error.message}`);
      }
    } else {
      addTestResult('sessionStorage에서 paymentId 확인', 'warning', 'paymentData 없음');
    }

    // 3. successUrl prop과 동적 생성 비교
    const successUrlProp = `${window.location.origin}/payments/toss-success?paymentId=${mockPaymentId}`;
    const dynamicSuccessUrl = paymentId 
      ? `${window.location.origin}/payments/toss-success?paymentId=${paymentId}`
      : `${window.location.origin}/payments/toss-success`;
    
    addTestResult('successUrl prop vs 동적 생성', 'success', 
      `successUrl prop: ${successUrlProp}\n동적 생성: ${dynamicSuccessUrl}\n동일: ${successUrlProp === dynamicSuccessUrl}`
    );

    // 4. 실제 토스페이먼츠 리다이렉트 URL 시뮬레이션
    const actualTossRedirectUrl = '/payments/toss-success?paymentType=NORMAL&orderId=test_order&paymentKey=test_key&amount=15000';
    const actualParams = new URLSearchParams(actualTossRedirectUrl.split('?')[1]);
    
    addTestResult('실제 토스페이먼츠 리다이렉트 URL', 'success', 
      `URL: ${actualTossRedirectUrl}\npaymentType: ${actualParams.get('paymentType')}\norderId: ${actualParams.get('orderId')}\npaymentKey: ${actualParams.get('paymentKey')}\namount: ${actualParams.get('amount')}\npaymentId: ${actualParams.get('paymentId') || '없음'}`
    );

    // 5. paymentId가 없는 경우의 문제점 분석
    const hasPaymentId = actualParams.get('paymentId');
    addTestResult('paymentId 존재 여부 분석', 
      hasPaymentId ? 'success' : 'error',
      `paymentId 존재: ${hasPaymentId ? '예' : '아니오'}\n문제: ${hasPaymentId ? '없음' : '토스페이먼츠에서 paymentId를 포함하지 않음'}`
    );
  };

  return (
    <div className={styles.container}>
      <h1>결제 디버깅 테스트</h1>
      
      <div className={styles.buttonGroup}>
        <button 
          onClick={testCreatePayment} 
          disabled={isLoading}
          className={styles.testButton}
        >
          {isLoading ? '테스트 중...' : '결제 생성 API 테스트'}
        </button>
        
        <button 
          onClick={testSessionStorage} 
          className={styles.testButton}
        >
          sessionStorage 검증
        </button>
        
        <button 
          onClick={testApiEndpoints} 
          className={styles.testButton}
        >
          API 엔드포인트 검증
        </button>
        
        <button 
          onClick={testNumericPaymentId} 
          className={styles.testButton}
        >
          숫자 paymentId 검증 테스트
        </button>
        
        <button 
          onClick={testTossPaymentUrl} 
          className={styles.testButton}
        >
          토스페이먼츠 URL 생성 테스트
        </button>
        
        <button 
          onClick={testSessionStorageRecovery} 
          className={styles.testButton}
        >
          sessionStorage 복구 테스트
        </button>
        
        <button 
          onClick={testUrlParameterDebug} 
          className={styles.testButton}
        >
          URL 파라미터 디버깅 테스트
        </button>
        
        <button 
          onClick={testTossSuccessUrl} 
          className={styles.testButton}
        >
          토스페이먼츠 success URL 테스트
        </button>
        
        <button 
          onClick={clearResults} 
          className={styles.clearButton}
        >
          결과 초기화
        </button>
      </div>

      <div className={styles.results}>
        <h2>테스트 결과</h2>
        {testResults.length === 0 ? (
          <p>테스트를 실행해주세요.</p>
        ) : (
          testResults.map(result => (
            <div key={result.id} className={`${styles.result} ${styles[result.status]}`}>
              <div className={styles.resultHeader}>
                <span className={styles.resultName}>{result.name}</span>
                <span className={styles.resultTime}>{result.timestamp}</span>
              </div>
              <div className={styles.resultMessage}>{result.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 
