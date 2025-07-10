/**
 * 토스페이먼츠 위젯 전역 관리자
 * 중복 렌더링 방지 및 위젯 생명주기 관리
 */

import { logger } from './logger';

class TossWidgetManager {
  constructor() {
    this.widgets = null;
    this.isInitializing = false;
    this.isRendered = false;
    this.currentOrderId = null;
    this.cleanupPromise = null;
    logger.log('토스페이먼츠 위젯 관리자 초기화');
  }

  /**
   * 위젯 초기화
   */
  async initialize(clientKey, customerKey) {
    logger.log('위젯 초기화 요청:', { 
      hasWidgets: !!this.widgets, 
      isInitializing: this.isInitializing,
      clientKey: clientKey ? '설정됨' : '미설정',
      customerKey: customerKey ? '설정됨' : '미설정'
    });

    if (this.widgets && !this.isInitializing) {
      logger.log('이미 초기화된 위젯 사용');
      return this.widgets;
    }

    if (this.isInitializing) {
      logger.log('위젯 초기화 중... 대기');
      // 초기화 완료까지 대기
      let waitCount = 0;
      while (this.isInitializing && waitCount < 50) { // 최대 5초 대기
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
        logger.log(`위젯 초기화 대기 중... (${waitCount}/50)`);
      }
      
      if (waitCount >= 50) {
        logger.error('위젯 초기화 대기 시간 초과');
        this.isInitializing = false;
        throw new Error('위젯 초기화 시간 초과');
      }
      
      return this.widgets;
    }

    try {
      this.isInitializing = true;
      logger.log('토스페이먼츠 위젯 초기화 시작');

      // 동적 import 시도
      logger.log('토스페이먼츠 SDK 로드 시작');
      const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
      logger.log('토스페이먼츠 SDK 로드 완료');
      
      logger.log('토스페이먼츠 인스턴스 생성 시작');
      const tossPayments = await loadTossPayments(clientKey);
      logger.log('토스페이먼츠 인스턴스 생성 완료');
      
      logger.log('위젯 인스턴스 생성 시작');
      this.widgets = tossPayments.widgets({
        customerKey,
      });
      logger.log('위젯 인스턴스 생성 완료');

      logger.log('토스페이먼츠 위젯 초기화 완료');
      return this.widgets;
    } catch (error) {
      logger.error('토스페이먼츠 위젯 초기화 실패:', error);
      this.isInitializing = false;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * 위젯 렌더링
   */
  async renderWidgets(amount, orderId) {
    logger.log('위젯 렌더링 요청:', { 
      hasWidgets: !!this.widgets, 
      isRendered: this.isRendered,
      amount,
      orderId 
    });

    if (!this.widgets) {
      logger.error('위젯이 초기화되지 않았습니다.');
      throw new Error('위젯이 초기화되지 않았습니다.');
    }

    // 이미 렌더링된 위젯이 있으면 정리
    if (this.isRendered) {
      logger.log('기존 위젯 정리 후 재렌더링');
      await this.cleanup();
    }

    try {
      logger.log('토스페이먼츠 위젯 렌더링 시작:', { orderId });
      
      // 결제 금액 설정
      logger.log('결제 금액 설정:', amount);
      await this.widgets.setAmount(amount);
      logger.log('결제 금액 설정 완료');

      // DOM 요소 확인
      const paymentMethodElement = document.getElementById('payment-method');
      const agreementElement = document.getElementById('agreement');
      
      logger.log('DOM 요소 확인:', {
        paymentMethodExists: !!paymentMethodElement,
        agreementExists: !!agreementElement
      });

      if (!paymentMethodElement || !agreementElement) {
        throw new Error('필요한 DOM 요소를 찾을 수 없습니다.');
      }

      // 위젯 렌더링
      logger.log('결제 수단 위젯 렌더링 시작');
      await this.widgets.renderPaymentMethods({
        selector: "#payment-method",
        variantKey: "DEFAULT",
      });
      logger.log('결제 수단 위젯 렌더링 완료');

      logger.log('이용약관 위젯 렌더링 시작');
      await this.widgets.renderAgreement({
        selector: "#agreement",
        variantKey: "AGREEMENT",
      });
      logger.log('이용약관 위젯 렌더링 완료');

      this.isRendered = true;
      this.currentOrderId = orderId;
      
      logger.log('토스페이먼츠 위젯 렌더링 완료');
    } catch (error) {
      logger.error('토스페이먼츠 위젯 렌더링 실패:', error);
      this.isRendered = false;
      this.currentOrderId = null;
      throw error;
    }
  }

  /**
   * 위젯 정리
   */
  async cleanup() {
    logger.log('위젯 정리 요청:', { 
      hasWidgets: !!this.widgets, 
      isRendered: this.isRendered 
    });

    if (!this.widgets || !this.isRendered) {
      logger.log('정리할 위젯이 없습니다.');
      return;
    }

    // 이미 정리 중이면 대기
    if (this.cleanupPromise) {
      logger.log('이미 정리 중입니다. 대기...');
      await this.cleanupPromise;
      return;
    }

    this.cleanupPromise = (async () => {
      try {
        logger.log('토스페이먼츠 위젯 정리 시작');
        
        // DOM 요소 정리
        const paymentMethodElement = document.getElementById('payment-method');
        const agreementElement = document.getElementById('agreement');
        
        if (paymentMethodElement) {
          paymentMethodElement.innerHTML = '';
          logger.log('결제 수단 DOM 요소 정리 완료');
        }
        if (agreementElement) {
          agreementElement.innerHTML = '';
          logger.log('이용약관 DOM 요소 정리 완료');
        }

        // 위젯 정리
        logger.log('위젯 cleanup 호출');
        await this.widgets.cleanup();
        logger.log('위젯 cleanup 완료');
        
        this.isRendered = false;
        this.currentOrderId = null;
        
        logger.log('토스페이먼츠 위젯 정리 완료');
      } catch (error) {
        logger.error('토스페이먼츠 위젯 정리 실패:', error);
      } finally {
        this.cleanupPromise = null;
      }
    })();

    await this.cleanupPromise;
  }

  /**
   * 위젯 상태 확인
   */
  getStatus() {
    const status = {
      isInitialized: !!this.widgets,
      isRendered: this.isRendered,
      isInitializing: this.isInitializing,
      currentOrderId: this.currentOrderId,
      isCleaningUp: !!this.cleanupPromise
    };
    
    logger.log('위젯 상태:', status);
    return status;
  }

  /**
   * 위젯 인스턴스 반환
   */
  getWidgets() {
    logger.log('위젯 인스턴스 요청:', { hasWidgets: !!this.widgets });
    return this.widgets;
  }

  /**
   * 완전 초기화 (테스트용)
   */
  reset() {
    logger.log('위젯 관리자 완전 초기화');
    this.widgets = null;
    this.isInitializing = false;
    this.isRendered = false;
    this.currentOrderId = null;
    this.cleanupPromise = null;
    logger.log('토스페이먼츠 위젯 관리자 초기화 완료');
  }
}

// 싱글톤 인스턴스
export const tossWidgetManager = new TossWidgetManager();
export default tossWidgetManager; 
