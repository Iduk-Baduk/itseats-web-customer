import { logger } from './logger';
import { securityUtils } from './securityUtils';

// 결제 테스트용 유틸리티
export class PaymentTestUtils {
  constructor() {
    this.isTestMode = import.meta.env.VITE_PAYMENT_TEST_MODE === 'true';
    this.testCards = {
      success: {
        number: '4111-1111-1111-1111',
        expiry: '12/25',
        cvc: '123'
      },
      insufficient: {
        number: '4111-1111-1111-1111',
        expiry: '12/25',
        cvc: '123'
      },
      expired: {
        number: '4111-1111-1111-1111',
        expiry: '12/20',
        cvc: '123'
      },
      invalid: {
        number: '4000-0000-0000-0002',
        expiry: '12/25',
        cvc: '123'
      }
    };
  }

  // 테스트 모드 확인
  isTestEnvironment() {
    return this.isTestMode || import.meta.env.NODE_ENV === 'development';
  }

  // 테스트 카드 정보 반환
  getTestCard(type = 'success') {
    if (!this.isTestEnvironment()) {
      logger.warn('테스트 환경이 아닙니다. 테스트 카드 정보를 반환하지 않습니다.');
      return null;
    }
    return this.testCards[type] || this.testCards.success;
  }

  // 결제 시뮬레이션
  async simulatePayment(type = 'success', delay = 2000) {
    if (!this.isTestEnvironment()) {
      throw new Error('테스트 환경에서만 사용 가능합니다.');
    }

    logger.log(`결제 시뮬레이션 시작: ${type}`);

    // 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, delay));

    switch (type) {
      case 'success':
        return {
          success: true,
          paymentKey: `test_payment_${Date.now()}`,
          orderId: `test_order_${Date.now()}`,
          amount: 10000,
          status: 'DONE',
          method: 'CARD'
        };
      
      case 'insufficient':
        throw new Error('INSUFFICIENT_BALANCE');
      
      case 'expired':
        throw new Error('CARD_EXPIRED');
      
      case 'invalid':
        throw new Error('INVALID_CARD');
      
      case 'timeout':
        throw new Error('TIMEOUT_ERROR');
      
      case 'network':
        throw new Error('NETWORK_ERROR');
      
      default:
        throw new Error('UNKNOWN_ERROR');
    }
  }

  // 결제 상태 시뮬레이션
  async simulatePaymentStatus(paymentKey, status = 'DONE') {
    if (!this.isTestEnvironment()) {
      throw new Error('테스트 환경에서만 사용 가능합니다.');
    }

    logger.log(`결제 상태 시뮬레이션: ${paymentKey} -> ${status}`);

    // 상태별 지연 시간
    const delays = {
      'READY': 1000,
      'IN_PROGRESS': 2000,
      'DONE': 3000,
      'CANCELED': 1000,
      'FAILED': 1000
    };

    await new Promise(resolve => setTimeout(resolve, delays[status] || 1000));

    return {
      paymentKey,
      status,
      method: 'CARD',
      amount: 10000,
      approvedAt: new Date().toISOString()
    };
  }

  // 에러 시뮬레이션
  simulateError(type = 'network') {
    const errors = {
      network: new Error('네트워크 연결을 확인해주세요.'),
      timeout: new Error('요청 시간이 초과되었습니다.'),
      server: new Error('서버 일시적 오류가 발생했습니다.'),
      validation: new Error('입력 정보를 확인해주세요.'),
      payment: new Error('결제 처리 중 오류가 발생했습니다.')
    };

    return errors[type] || errors.payment;
  }

  // 성능 측정
  measurePerformance(operation, fn) {
    const start = performance.now();
    
    return fn().finally(() => {
      const end = performance.now();
      const duration = end - start;
      
      logger.log(`성능 측정 - ${operation}: ${duration.toFixed(2)}ms`);
      
      // 성능 임계값 체크
      if (duration > 5000) {
        logger.warn(`성능 경고 - ${operation}이 5초를 초과했습니다: ${duration.toFixed(2)}ms`);
      }
    });
  }

  // 메모리 사용량 측정
  measureMemoryUsage(operation) {
    if (performance.memory) {
      const memory = performance.memory;
      logger.log(`메모리 사용량 - ${operation}:`, {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      });
    }
  }

  // 네트워크 상태 체크
  async checkNetworkStatus() {
    try {
      const start = performance.now();
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const end = performance.now();
      
      return {
        online: response.ok,
        latency: end - start,
        status: response.status
      };
    } catch (error) {
      return {
        online: false,
        latency: null,
        error: error.message
      };
    }
  }

  // 결제 로그 생성
  createPaymentLog(operation, data, result) {
    const log = {
      timestamp: new Date().toISOString(),
      operation,
      data,
      result,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId()
    };

    logger.log('결제 로그:', log);
    return log;
  }

  // 세션 ID 생성 - 보안 강화 버전
  getSessionId() {
    let sessionId = sessionStorage.getItem('payment_session_id');
    if (!sessionId) {
      sessionId = securityUtils.generateSecureSessionId('payment');
      sessionStorage.setItem('payment_session_id', sessionId);
    }
    return sessionId;
  }

  // 테스트 데이터 초기화
  initializeTestData() {
    if (!this.isTestEnvironment()) {
      return;
    }

    // 기존 테스트 데이터 정리 (중복 방지)
    this.cleanupTestData();

    // 테스트용 결제 정보를 localStorage에 저장
    const testData = {
      testCards: this.testCards,
      testAmounts: [1000, 5000, 10000, 50000],
      testOrderIds: Array.from({ length: 10 }, (_, i) => `test_order_${Date.now()}_${i}`),
      createdAt: new Date().toISOString(),
      sessionId: this.getSessionId()
    };

    localStorage.setItem('payment_test_data', JSON.stringify(testData));
    logger.log('테스트 데이터 초기화 완료');
    
    // 페이지 언로드 시 자동 정리
    this.setupAutoCleanup();
  }

  // 테스트 데이터 정리
  cleanupTestData() {
    if (!this.isTestEnvironment()) {
      return;
    }

    localStorage.removeItem('payment_test_data');
    sessionStorage.removeItem('payment_session_id');
    
    // 자동 정리 이벤트 리스너 제거
    this.removeAutoCleanup();
    
    logger.log('테스트 데이터 정리 완료');
  }

  // 자동 정리 설정
  setupAutoCleanup() {
    if (typeof window !== 'undefined') {
      // 페이지 언로드 시 자동 정리
      const handleBeforeUnload = () => {
        this.cleanupTestData();
      };
      
      // 페이지 숨김 시 정리 (탭 전환 등)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          this.cleanupTestData();
        }
      };
      
      // 이벤트 리스너 등록
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // 리스너 참조 저장 (나중에 제거하기 위해)
      this._cleanupListeners = {
        beforeunload: handleBeforeUnload,
        visibilitychange: handleVisibilityChange
      };
      
      logger.log('테스트 데이터 자동 정리 설정 완료');
    }
  }

  // 자동 정리 이벤트 리스너 제거
  removeAutoCleanup() {
    if (typeof window !== 'undefined' && this._cleanupListeners) {
      window.removeEventListener('beforeunload', this._cleanupListeners.beforeunload);
      document.removeEventListener('visibilitychange', this._cleanupListeners.visibilitychange);
      this._cleanupListeners = null;
      
      logger.log('테스트 데이터 자동 정리 리스너 제거 완료');
    }
  }

  // 테스트 데이터 검증
  validateTestData() {
    if (!this.isTestEnvironment()) {
      return { valid: false, reason: 'NOT_TEST_ENVIRONMENT' };
    }

    const testData = localStorage.getItem('payment_test_data');
    if (!testData) {
      return { valid: false, reason: 'NO_TEST_DATA' };
    }

    try {
      const parsedData = JSON.parse(testData);
      const requiredFields = ['testCards', 'testAmounts', 'testOrderIds', 'createdAt', 'sessionId'];
      
      for (const field of requiredFields) {
        if (!parsedData[field]) {
          return { valid: false, reason: `MISSING_FIELD: ${field}` };
        }
      }

      // 세션 ID 일치 확인
      if (parsedData.sessionId !== this.getSessionId()) {
        return { valid: false, reason: 'SESSION_MISMATCH' };
      }

      return { valid: true, data: parsedData };
    } catch (error) {
      return { valid: false, reason: 'INVALID_JSON', error: error.message };
    }
  }

  // 테스트 데이터 상태 확인
  getTestDataStatus() {
    const validation = this.validateTestData();
    const hasListeners = !!this._cleanupListeners;
    
    return {
      ...validation,
      hasAutoCleanup: hasListeners,
      isTestEnvironment: this.isTestEnvironment(),
      timestamp: new Date().toISOString()
    };
  }
}

// 싱글톤 인스턴스 생성
export const paymentTestUtils = new PaymentTestUtils();
export default paymentTestUtils; 
