import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { tossPaymentAPI } from '../../services/tossPaymentAPI';
import { paymentTestUtils } from '../../utils/paymentTestUtils';
import { logger } from '../../utils/logger';

const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY || "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
const customerKey = import.meta.env.VITE_TOSS_CUSTOMER_KEY || "2TERsuSTRNCJMuXpIi-Rt";

// 전역 위젯 인스턴스 관리
let globalWidgets = null;
let globalWidgetsPromise = null;
let currentWidgetId = null;
let isGloballyInitializing = false;

// 토스페이먼츠 SDK 완전 재로드 함수
const reloadTossPaymentsSDK = async () => {
  try {
    logger.log('🔄 토스페이먼츠 SDK 완전 재로드 시작');
    
    // 기존 스크립트 태그 제거
    const existingScripts = document.querySelectorAll('script[src*="tosspayments"]');
    existingScripts.forEach(script => script.remove());
    
    // 토스페이먼츠 관련 전역 객체 완전 제거
    const tossGlobalKeys = Object.keys(window).filter(key => 
      key.toLowerCase().includes('toss') || key.includes('TossPayments')
    );
    tossGlobalKeys.forEach(key => {
      try {
        window[key] = undefined;
      } catch (e) {
        logger.warn(`전역 객체 ${key} 제거 실패:`, e.message);
      }
    });
    
    // 캐시된 모듈 정리
    if (window.__TOSS_PAYMENT_WIDGETS__) window.__TOSS_PAYMENT_WIDGETS__ = undefined;
    if (window.__tossPayments) window.__tossPayments = undefined;
    if (window.TossPayments) window.TossPayments = undefined;
    
    // 잠시 대기 (완전한 정리 보장)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    logger.log('✅ 토스페이먼츠 SDK 완전 재로드 완료');
    return true;
  } catch (error) {
    logger.error('❌ 토스페이먼츠 SDK 재로드 실패:', error);
    return false;
  }
};

// 강력한 전역 인스턴스 정리 함수
const clearGlobalWidgets = async () => {
  try {
    logger.log('🧹 전역 위젯 인스턴스 완전 정리 시작');
    
    // 기존 위젯 완전 제거
    if (globalWidgets) {
      try {
        if (typeof globalWidgets.destroy === 'function') {
          await globalWidgets.destroy();
        }
      } catch (e) {
        logger.warn('위젯 destroy 실패 (정상):', e.message);
      }
    }
    
    globalWidgets = null;
    globalWidgetsPromise = null;
    currentWidgetId = null;
    isGloballyInitializing = false;
    
    // 모든 토스 위젯 DOM 요소 강제 정리
    const allWidgetSelectors = [
      '[id*="toss-widget"]',
      '[id*="payment-method"]', 
      '[id*="agreement"]',
      '[class*="tosspayments"]',
      '[data-testid*="payment"]',
      '.tosspayments-widget',
      '.payment-widget',
      '[data-widget-name*="payment"]',
      '[data-widget-name*="agreement"]'
    ];
    
    allWidgetSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.innerHTML = '';
        element.removeAttribute('data-testid');
        element.removeAttribute('data-widget-id');
        element.removeAttribute('data-toss-id');
        element.removeAttribute('data-widget-name');
      });
    });
    
    // 개발 환경에서는 SDK 완전 재로드
    if (import.meta.env.DEV) {
      await reloadTossPaymentsSDK();
    }
    
    logger.log('✅ 전역 위젯 인스턴스 완전 정리 완료');
  } catch (error) {
    logger.error('❌ 위젯 정리 중 오류:', error);
  }
};

// 페이지 전환 시 강제 정리
const handlePageChange = () => {
  logger.log('📄 페이지 전환 감지 - 위젯 강제 정리');
  clearGlobalWidgets();
};

// 페이지 언로드 및 전환 감지
if (typeof window !== 'undefined') {
  const handleBeforeUnload = () => {
    clearGlobalWidgets();
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('pagehide', handleBeforeUnload);
  window.addEventListener('popstate', handlePageChange);
  
  // 개발 환경에서 HMR 감지
  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      logger.log('🔥 HMR 업데이트 감지 - 위젯 강제 정리');
      clearGlobalWidgets();
    });
    
    import.meta.hot.dispose(() => {
      logger.log('🗑️ HMR 폐기 감지 - 위젯 강제 정리');
      clearGlobalWidgets();
    });
  }
}

export function TossPaymentWidget({ 
  amount, 
  orderId, 
  orderName, 
  customerEmail, 
  customerName, 
  customerMobilePhone,
  onPaymentSuccess,
  onPaymentError 
}) {
  // 고유한 DOM ID 생성 (더 강력한 고유성 보장)
  const widgetId = useMemo(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `toss-widget-${orderId}-${timestamp}-${random}`;
  }, [orderId]);
  
  const paymentMethodId = `${widgetId}-payment-method`;
  const agreementId = `${widgetId}-agreement`;
  
  const [ready, setReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  
  // 컴포넌트별 상태 관리
  const isRenderingRef = useRef(false);
  const isComponentMountedRef = useRef(true);
  const initializationStartedRef = useRef(false);
  const isWidgetRenderedRef = useRef(false); // 위젯 렌더링 완료 추적
  
  // 결제 시도 추적
  const paymentAttemptRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const initStartTimeRef = useRef(null);
  const widgetsRef = useRef(null);

  // 컴포넌트 마운트 상태 관리
  useEffect(() => {
    isComponentMountedRef.current = true;
    return () => {
      isComponentMountedRef.current = false;
    };
  }, []);

  // 위젯 초기화 (더 엄격한 싱글톤 패턴)
  useEffect(() => {
    async function fetchPaymentWidgets() {
      // 전역 초기화 진행 중이면 대기
      while (isGloballyInitializing) {
        logger.log('⏳ 전역 초기화 대기 중...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 컴포넌트별 중복 초기화 방지
      if (initializationStartedRef.current) {
        logger.log('⚠️ 이미 초기화 진행 중 - 건너뛰기');
        return;
      }
      
      // 컴포넌트가 언마운트된 경우 초기화 중단
      if (!isComponentMountedRef.current) {
        return;
      }
      
      initializationStartedRef.current = true;
      isGloballyInitializing = true;
      initStartTimeRef.current = performance.now();
      
      // 초기화 시작 시 렌더링 플래그 리셋
      isWidgetRenderedRef.current = false;
      setReady(false);
      
      try {
        setIsLoading(true);
        setError(null);
        setRetryCount(0);
        
        logger.log('🚀 토스페이먼츠 위젯 초기화 시작 (강화된 고유 ID):', widgetId);
        
        // 기존 위젯 완전 정리 (항상 실행)
        await clearGlobalWidgets();
        
        // 컴포넌트가 언마운트된 경우 중단
        if (!isComponentMountedRef.current) {
          return;
        }

        // 새로운 전역 인스턴스 생성 (재시도 로직 포함)
        let widgets;
        let retryAttempts = 0;
        const maxRetries = 3;
        
        while (retryAttempts < maxRetries) {
          try {
            globalWidgetsPromise = paymentTestUtils.measurePerformance('위젯 초기화', async () => {
              // 토스페이먼츠 SDK 로드
              const tossPayments = await loadTossPayments(clientKey);
              
              // 위젯 생성
              const widgets = tossPayments.widgets({
                customerKey,
              });

              return widgets;
            });

            widgets = await globalWidgetsPromise;
            break; // 성공시 루프 탈출
            
          } catch (sdkError) {
            retryAttempts++;
            logger.warn(`🔄 SDK 로드 실패 (${retryAttempts}/${maxRetries}):`, sdkError.message);
            
            if (retryAttempts < maxRetries) {
              // SDK 재로드 후 재시도
              await reloadTossPaymentsSDK();
              await new Promise(resolve => setTimeout(resolve, 1000 * retryAttempts));
            } else {
              throw sdkError;
            }
          }
        }
        
        // 컴포넌트가 언마운트된 경우 중단
        if (!isComponentMountedRef.current) {
          return;
        }
        
        globalWidgets = widgets;
        globalWidgetsPromise = null;
        widgetsRef.current = widgets;
        currentWidgetId = widgetId;
        
        logger.log('✅ 토스페이먼츠 위젯 초기화 성공 (강화된 고유 ID):', widgetId);
        
        // 성능 메트릭 저장
        const initDuration = performance.now() - initStartTimeRef.current;
        if (isComponentMountedRef.current) {
          setPerformanceMetrics(prev => ({
            ...prev,
            initDuration: initDuration.toFixed(2)
          }));
        }
        
        // 메모리 사용량 측정
        paymentTestUtils.measureMemoryUsage('위젯 초기화');
        
      } catch (err) {
        logger.error('❌ 토스페이먼츠 위젯 초기화 실패:', err);
        
        if (isComponentMountedRef.current) {
          setError('결제 위젯을 불러오는데 실패했습니다. 페이지를 새로고침해주세요.');
        }
        
        // 전역 인스턴스 초기화 실패 시 정리
        await clearGlobalWidgets();
        
        // 재시도 로직
        if (retryCount < 2 && isComponentMountedRef.current) {
          const retryDelay = Math.pow(2, retryCount) * 2000; // 더 긴 지연
          retryTimeoutRef.current = setTimeout(() => {
            if (isComponentMountedRef.current) {
              initializationStartedRef.current = false;
              setRetryCount(prev => prev + 1);
              fetchPaymentWidgets();
            }
          }, retryDelay);
        }
      } finally {
        initializationStartedRef.current = false;
        isGloballyInitializing = false;
        if (isComponentMountedRef.current) {
          setIsLoading(false);
        }
      }
    }

    fetchPaymentWidgets();

    // 클린업
    return () => {
      initializationStartedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [retryCount, widgetId]);

  // 위젯 렌더링 (초기화 완료 후 자동 실행)
  useEffect(() => {
    async function renderPaymentWidgets() {
      // 컴포넌트가 언마운트되었거나 위젯이 준비되지 않은 경우 중단
      if (!isComponentMountedRef.current || !widgetsRef.current || currentWidgetId !== widgetId) {
        return;
      }
      
      // 중복 렌더링 방지
      if (isRenderingRef.current) {
        logger.log('⚠️ 이미 렌더링 중입니다. 건너뜁니다.');
        return;
      }
      
      // 위젯이 이미 렌더링된 경우 중복 렌더링 방지
      if (isWidgetRenderedRef.current) {
        logger.log('✅ 위젯이 이미 렌더링되어 있습니다. 건너뜁니다.');
        
        // DOM 요소가 실제로 콘텐츠를 가지고 있는지 확인
        const paymentMethodElement = document.getElementById(paymentMethodId);
        const agreementElement = document.getElementById(agreementId);
        
        if (paymentMethodElement && agreementElement && 
            paymentMethodElement.children.length > 0 && 
            agreementElement.children.length > 0) {
          // 위젯이 정상적으로 렌더링되어 있으면 ready 상태로 설정
          if (!ready) {
            setReady(true);
            logger.log('🎉 기존 렌더링된 위젯 확인 완료:', widgetId);
          }
          return;
        } else {
          // DOM이 비어있으면 렌더링 플래그 리셋하고 다시 렌더링
          logger.log('⚠️ 위젯 플래그는 설정되어 있지만 DOM이 비어있음. 재렌더링 시도');
          isWidgetRenderedRef.current = false;
        }
      }
      
      try {
        isRenderingRef.current = true;
        logger.log('🎨 토스페이먼츠 위젯 렌더링 시작 (강화된 고유 ID):', widgetId);
        
        // DOM 요소 확인 (더 견고한 방식)
        let paymentMethodElement = document.getElementById(paymentMethodId);
        let agreementElement = document.getElementById(agreementId);
        
        // DOM 요소가 없으면 최대 5회까지 재시도
        let domRetries = 0;
        while ((!paymentMethodElement || !agreementElement) && domRetries < 5) {
          logger.log(`🔍 DOM 요소 검색 재시도 (${domRetries + 1}/5)`);
          await new Promise(resolve => setTimeout(resolve, 200));
          paymentMethodElement = document.getElementById(paymentMethodId);
          agreementElement = document.getElementById(agreementId);
          domRetries++;
        }
        
        if (!paymentMethodElement || !agreementElement) {
          logger.error('❌ DOM 요소를 찾을 수 없습니다:', { paymentMethodId, agreementId });
          throw new Error('결제 위젯 DOM 요소를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
        }
        
        // 컴포넌트가 언마운트된 경우 렌더링 중단
        if (!isComponentMountedRef.current) {
          return;
        }
        
        // DOM 요소가 이미 렌더링된 콘텐츠를 가지고 있는지 확인
        const hasPaymentContent = paymentMethodElement.children.length > 0;
        const hasAgreementContent = agreementElement.children.length > 0;
        
        if (hasPaymentContent && hasAgreementContent) {
          logger.log('📋 DOM 요소가 이미 렌더링된 콘텐츠를 가지고 있습니다. 스킵');
          isWidgetRenderedRef.current = true;
          if (!ready) {
            setReady(true);
            logger.log('🎉 기존 DOM 콘텐츠 확인 완료:', widgetId);
          }
          return;
        }
        
        // 기존 내용 정리 (필요한 경우에만)
        if (hasPaymentContent) {
          logger.log('🧹 결제 방법 DOM 정리');
          paymentMethodElement.innerHTML = '';
        }
        if (hasAgreementContent) {
          logger.log('🧹 이용약관 DOM 정리');
          agreementElement.innerHTML = '';
        }
        
        // DOM 정리 완료 대기
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 컴포넌트가 언마운트된 경우 렌더링 중단
        if (!isComponentMountedRef.current) {
          return;
        }
        
        // 렌더링 성능 측정
        await paymentTestUtils.measurePerformance('위젯 렌더링', async () => {
          // 주문의 결제 금액 설정
          try {
            await widgetsRef.current.setAmount(amount);
          } catch (setAmountError) {
            logger.error('결제 금액 설정 실패:', setAmountError);
            throw new Error('결제 금액 설정에 실패했습니다.');
          }

          // 순차 렌더링 (병렬 렌더링 대신 안전한 순차 렌더링)
          logger.log('🔄 결제 방법 렌더링 시작');
          await widgetsRef.current.renderPaymentMethods({
            selector: `#${paymentMethodId}`,
            variantKey: "DEFAULT",
          });
          
          logger.log('🔄 이용약관 렌더링 시작');
          await widgetsRef.current.renderAgreement({
            selector: `#${agreementId}`,
            variantKey: "AGREEMENT",
          });
        });

        // 컴포넌트가 언마운트된 경우 상태 업데이트 중단
        if (isComponentMountedRef.current) {
          isWidgetRenderedRef.current = true; // 렌더링 완료 플래그 설정
          setReady(true);
          logger.log('🎉 토스페이먼츠 위젯 렌더링 완료 (강화된 고유 ID):', widgetId);
          
          // 렌더링 완료 로그
          paymentTestUtils.createPaymentLog('위젯 렌더링 완료', { amount, orderId, widgetId }, { success: true });
        }
        
      } catch (err) {
        logger.error('❌ 토스페이먼츠 위젯 렌더링 실패:', err);
        
        // 렌더링 실패 시 플래그 리셋
        isWidgetRenderedRef.current = false;
        
        if (isComponentMountedRef.current) {
          setError('결제 위젯 렌더링에 실패했습니다. 페이지를 새로고침해주세요.');
        }
        
        // 렌더링 실패 시 전체 정리
        await clearGlobalWidgets();
        
        // 렌더링 실패 로그
        paymentTestUtils.createPaymentLog('위젯 렌더링 실패', { amount, orderId, widgetId }, { error: err.message });
      } finally {
        isRenderingRef.current = false;
      }
    }

    // 위젯이 초기화되었을 때만 렌더링 시작
    if (widgetsRef.current && !isLoading) {
      renderPaymentWidgets();
    }
    
    // 컴포넌트 언마운트 시 렌더링 상태 정리
    return () => {
      isRenderingRef.current = false;
    };
  }, [amount, orderId, widgetId, paymentMethodId, agreementId, isLoading, ready]);

  // 결제 금액이 변경될 때마다 위젯 업데이트
  useEffect(() => {
    if (widgetsRef.current && ready) {
      try {
        widgetsRef.current.setAmount(amount);
        logger.log('💰 결제 금액 업데이트 성공:', amount);
      } catch (error) {
        logger.error('결제 금액 업데이트 실패:', error);
        setError('결제 금액 업데이트에 실패했습니다.');
      }
    }
  }, [amount, ready]);

  // 결제 처리 함수
  const handlePayment = useCallback(async () => {
    // 이미 처리 중이면 중복 실행 방지
    if (isProcessing) {
      logger.warn('결제가 이미 진행 중입니다.');
      return;
    }

    // 결제 시도 중복 방지 체크
    if (tossPaymentAPI.isPaymentInProgress(orderId)) {
      setError('이미 진행 중인 결제가 있습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setLastError(null);

    try {
      logger.log('토스페이먼츠 결제 요청 시작:', { orderId, amount, orderName });
      
      // 네트워크 상태 체크 (테스트 환경에서만)
      if (paymentTestUtils.isTestEnvironment()) {
        const networkStatus = await paymentTestUtils.checkNetworkStatus();
        if (!networkStatus.online) {
          throw new Error('네트워크 연결을 확인해주세요.');
        }
      }
      
      // 결제 성능 측정
      const paymentResult = await paymentTestUtils.measurePerformance('결제 요청', async () => {
        // ------ '결제하기' 버튼 누르면 결제창 띄우기 ------
        // 결제를 요청하기 전에 orderId, amount를 서버에 저장하세요.
        // 결제 과정에서 악의적으로 결제 금액이 바뀌는 것을 확인하는 용도입니다.
        return await widgetsRef.current.requestPayment({
          orderId: orderId,
          orderName: orderName,
          successUrl: window.location.origin + "/payments/toss-success",
          failUrl: window.location.origin + "/payments/failure?redirect=/cart",
          customerEmail: customerEmail,
          customerName: customerName,
          customerMobilePhone: customerMobilePhone,
        });
      });

      logger.log('토스페이먼츠 결제 요청 성공:', paymentResult);
      
      // 결제 성공 로그
      paymentTestUtils.createPaymentLog('결제 요청 성공', { orderId, amount, orderName }, paymentResult);
      
      // 성공 콜백 호출
      if (onPaymentSuccess) {
        onPaymentSuccess(paymentResult);
      }
      
    } catch (error) {
      logger.error('토스페이먼츠 결제 요청 실패:', error);
      
      // 에러 정보 저장
      setLastError({
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || '결제 처리 중 오류가 발생했습니다.',
        timestamp: Date.now()
      });
      
      // 사용자 친화적인 에러 메시지
      const userMessage = getPaymentErrorMessage(error);
      setError(userMessage);
      
      // 결제 실패 로그
      paymentTestUtils.createPaymentLog('결제 요청 실패', { orderId, amount, orderName }, { error: error.message });
      
      // 에러 콜백 호출
      if (onPaymentError) {
        onPaymentError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [orderId, amount, orderName, customerEmail, customerName, customerMobilePhone, isProcessing, onPaymentSuccess, onPaymentError]);

  // 결제 에러 메시지 변환
  const getPaymentErrorMessage = (error) => {
    const code = error.code || '';
    const message = error.message || '';
    
    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return '결제가 취소되었습니다.';
      case 'PAY_PROCESS_ABORTED':
        return '결제가 중단되었습니다.';
      case 'INVALID_CARD':
        return '유효하지 않은 카드입니다.';
      case 'INSUFFICIENT_BALANCE':
        return '잔액이 부족합니다.';
      case 'CARD_EXPIRED':
        return '만료된 카드입니다.';
      case 'DUPLICATE_ORDER_ID':
        return '중복된 주문번호입니다.';
      case 'INVALID_AMOUNT':
        return '잘못된 결제 금액입니다.';
      case 'PAYMENT_NOT_FOUND':
        return '결제 정보를 찾을 수 없습니다.';
      case 'ALREADY_PROCESSED_PAYMENT':
        return '이미 처리된 결제입니다.';
      case 'NETWORK_ERROR':
        return '네트워크 연결을 확인해주세요.';
      case 'TIMEOUT_ERROR':
        return '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
      default:
        if (message.includes('500') || message.includes('502') || message.includes('503')) {
          return '서버 일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
        return '결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
  };

  // 재시도 함수
  const handleRetry = useCallback(() => {
    setError(null);
    setLastError(null);
    setRetryCount(0);
    
    // 위젯 재초기화
    widgetsRef.current = null;
    isWidgetRenderedRef.current = false; // 렌더링 완료 플래그 리셋
    setReady(false);
    setIsLoading(true);
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      // 렌더링 상태 정리
      isRenderingRef.current = false;
      isWidgetRenderedRef.current = false; // 렌더링 완료 플래그도 리셋
      
      // 이 위젯이 현재 활성 위젯이면 정리 예약
      if (currentWidgetId === widgetId) {
        // 즉시 정리하지 않고 잠시 후 정리 (빠른 재마운트 대응)
        setTimeout(() => {
          // 다시 한번 확인 후 정리
          if (currentWidgetId === widgetId) {
            const remainingElements = document.querySelectorAll(`#${paymentMethodId}, #${agreementId}`);
            if (remainingElements.length === 0 || 
                Array.from(remainingElements).every(el => el.innerHTML === '')) {
              logger.log('위젯 언마운트로 인한 완전 정리:', widgetId);
              clearGlobalWidgets();
            }
          }
        }, 500);
      }
    };
  }, [widgetId, paymentMethodId, agreementId]);

  const wrapperStyle = {
    width: '100%'
  };

  const sectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  };

  const buttonStyle = {
    width: '100%',
    padding: '16px',
    backgroundColor: isProcessing ? '#ccc' : '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: (ready && !isProcessing) ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s ease',
    opacity: (ready && !isProcessing) ? 1 : 0.6,
    position: 'relative'
  };

  const loadingStyle = {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666',
    fontSize: '14px'
  };

  const errorStyle = {
    textAlign: 'center',
    padding: '20px',
    color: '#d32f2f',
    fontSize: '14px',
    backgroundColor: '#ffebee',
    border: '1px solid #ffcdd2',
    borderRadius: '8px',
    marginBottom: '16px'
  };

  const retryButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    marginTop: '8px'
  };

  const processingOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    zIndex: 10
  };

  const spinnerStyle = {
    width: '20px',
    height: '20px',
    border: '2px solid #f3f3f3',
    borderTop: '2px solid #2196f3',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const debugInfoStyle = {
    fontSize: '10px',
    color: '#999',
    marginTop: '8px',
    padding: '4px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px'
  };

  if (isLoading) {
    return (
      <div style={wrapperStyle}>
        <div style={sectionStyle}>
          <div style={loadingStyle}>
            {retryCount > 0 ? (
              <>
                <div>결제 위젯을 불러오는 중... ({retryCount}/3)</div>
                <button style={retryButtonStyle} onClick={handleRetry}>
                  다시 시도
                </button>
              </>
            ) : (
              '결제 위젯을 불러오는 중...'
            )}
            
            {/* 디버그 정보 (테스트 환경에서만 표시) */}
            {paymentTestUtils.isTestEnvironment() && performanceMetrics && (
              <div style={debugInfoStyle}>
                초기화 시간: {performanceMetrics.initDuration}ms
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error && !ready) {
    return (
      <div style={wrapperStyle}>
        <div style={sectionStyle}>
          <div style={errorStyle}>
            <div>{error}</div>
            <button style={retryButtonStyle} onClick={handleRetry}>
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <div style={sectionStyle}>
        {/* 결제 수단 선택 */}
        <div id={paymentMethodId}></div>
        
        {/* 이용약관 */}
        <div id={agreementId}></div>
        
        {/* 결제하기 버튼 */}
        <button 
          style={buttonStyle}
          onClick={handlePayment}
          disabled={!ready || isProcessing}
        >
          {isProcessing ? (
            <>
              <div style={processingOverlayStyle}>
                <div style={spinnerStyle}></div>
              </div>
              결제 처리 중...
            </>
          ) : (
            '결제하기'
          )}
        </button>
        
        {/* 에러 메시지 */}
        {error && (
          <div style={errorStyle}>
            <div>{error}</div>
            {lastError && (
              <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                오류 코드: {lastError.code}
              </div>
            )}
          </div>
        )}
        
        {/* 디버그 정보 (테스트 환경에서만 표시) */}
        {paymentTestUtils.isTestEnvironment() && (
          <div style={debugInfoStyle}>
            <div>테스트 모드 활성화</div>
            {performanceMetrics && (
              <div>초기화: {performanceMetrics.initDuration}ms</div>
            )}
            <div>주문번호: {orderId}</div>
            <div>금액: {amount?.value || amount}원</div>
          </div>
        )}
      </div>
      
      {/* 스피너 애니메이션 CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 
