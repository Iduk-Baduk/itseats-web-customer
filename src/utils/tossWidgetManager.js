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
  }

  /**
   * 위젯 초기화
   */
  async initialize(clientKey, customerKey) {
    if (this.widgets && !this.isInitializing) {
      logger.log('이미 초기화된 위젯 사용');
      return this.widgets;
    }

    if (this.isInitializing) {
      logger.log('위젯 초기화 중... 대기');
      // 초기화 완료까지 대기
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.widgets;
    }

    try {
      this.isInitializing = true;
      logger.log('토스페이먼츠 위젯 초기화 시작');

      const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
      const tossPayments = await loadTossPayments(clientKey);
      
      this.widgets = tossPayments.widgets({
        customerKey,
      });

      logger.log('토스페이먼츠 위젯 초기화 완료');
      return this.widgets;
    } catch (error) {
      logger.error('토스페이먼츠 위젯 초기화 실패:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * 위젯 렌더링
   */
  async renderWidgets(amount, orderId) {
    if (!this.widgets) {
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
      await this.widgets.setAmount(amount);

      // 위젯 렌더링
      await Promise.all([
        this.widgets.renderPaymentMethods({
          selector: "#payment-method",
          variantKey: "DEFAULT",
        }),
        this.widgets.renderAgreement({
          selector: "#agreement",
          variantKey: "AGREEMENT",
        }),
      ]);

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
    if (!this.widgets || !this.isRendered) {
      return;
    }

    // 이미 정리 중이면 대기
    if (this.cleanupPromise) {
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
        }
        if (agreementElement) {
          agreementElement.innerHTML = '';
        }

        // 위젯 정리
        await this.widgets.cleanup();
        
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
    return {
      isInitialized: !!this.widgets,
      isRendered: this.isRendered,
      isInitializing: this.isInitializing,
      currentOrderId: this.currentOrderId,
      isCleaningUp: !!this.cleanupPromise
    };
  }

  /**
   * 위젯 인스턴스 반환
   */
  getWidgets() {
    return this.widgets;
  }

  /**
   * 완전 초기화 (테스트용)
   */
  reset() {
    this.widgets = null;
    this.isInitializing = false;
    this.isRendered = false;
    this.currentOrderId = null;
    this.cleanupPromise = null;
    logger.log('토스페이먼츠 위젯 관리자 초기화');
  }
}

// 싱글톤 인스턴스
export const tossWidgetManager = new TossWidgetManager();
export default tossWidgetManager; 
