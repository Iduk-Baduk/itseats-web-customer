import { tossPaymentAPI } from './tossPaymentAPI';
import { logger } from '../utils/logger';

class PaymentStatusService {
  constructor() {
    this.pollingIntervals = new Map();
    this.statusCallbacks = new Map();
    this.maxPollingDuration = 5 * 60 * 1000; // 5분
    this.pollingInterval = 3000; // 3초
  }

  // 결제 상태 폴링 시작
  startPolling(paymentKey, orderId, onStatusChange, onComplete, onError) {
    // 이미 폴링 중이면 중복 시작 방지
    if (this.pollingIntervals.has(paymentKey)) {
      logger.warn(`이미 폴링 중인 결제: ${paymentKey}`);
      return;
    }

    logger.log(`결제 상태 폴링 시작: ${paymentKey}`);

    const startTime = Date.now();
    let lastStatus = null;

    const poll = async () => {
      try {
        // 최대 폴링 시간 초과 체크
        if (Date.now() - startTime > this.maxPollingDuration) {
          logger.warn(`결제 상태 폴링 시간 초과: ${paymentKey}`);
          this.stopPolling(paymentKey);
          if (onError) {
            onError(new Error('결제 상태 확인 시간이 초과되었습니다.'));
          }
          return;
        }

        // 결제 상태 조회
        const paymentStatus = await tossPaymentAPI.getPaymentStatus(paymentKey);
        
        logger.log(`결제 상태 업데이트: ${paymentKey}`, paymentStatus.status);

        // 상태 변경 감지
        if (lastStatus !== paymentStatus.status) {
          lastStatus = paymentStatus.status;
          
          if (onStatusChange) {
            onStatusChange(paymentStatus);
          }
        }

        // 최종 상태 도달 시 폴링 중단
        if (this.isFinalStatus(paymentStatus.status)) {
          logger.log(`결제 최종 상태 도달: ${paymentKey} - ${paymentStatus.status}`);
          this.stopPolling(paymentKey);
          
          if (onComplete) {
            onComplete(paymentStatus);
          }
        }

      } catch (error) {
        logger.error(`결제 상태 폴링 오류: ${paymentKey}`, error);
        
        // 네트워크 오류 등은 계속 재시도, 다른 오류는 중단
        if (this.shouldStopPollingOnError(error)) {
          this.stopPolling(paymentKey);
          if (onError) {
            onError(error);
          }
        }
      }
    };

    // 즉시 첫 번째 폴링 실행
    poll();

    // 주기적 폴링 설정
    const intervalId = setInterval(poll, this.pollingInterval);
    this.pollingIntervals.set(paymentKey, {
      intervalId,
      startTime,
      orderId
    });

    // 콜백 저장
    this.statusCallbacks.set(paymentKey, {
      onStatusChange,
      onComplete,
      onError
    });
  }

  // 폴링 중단
  stopPolling(paymentKey) {
    const pollingData = this.pollingIntervals.get(paymentKey);
    if (pollingData) {
      clearInterval(pollingData.intervalId);
      this.pollingIntervals.delete(paymentKey);
      this.statusCallbacks.delete(paymentKey);
      logger.log(`결제 상태 폴링 중단: ${paymentKey}`);
    }
  }

  // 모든 폴링 중단
  stopAllPolling() {
    for (const [paymentKey] of this.pollingIntervals) {
      this.stopPolling(paymentKey);
    }
  }

  // 최종 상태인지 확인
  isFinalStatus(status) {
    const finalStatuses = ['DONE', 'CANCELED', 'ABORTED', 'FAILED'];
    return finalStatuses.includes(status);
  }

  // 오류 시 폴링 중단 여부 판단
  shouldStopPollingOnError(error) {
    const message = error.message || '';
    
    // 결제를 찾을 수 없거나, 이미 처리된 결제 등은 중단
    if (message.includes('PAYMENT_NOT_FOUND') || 
        message.includes('ALREADY_PROCESSED_PAYMENT') ||
        message.includes('INVALID_PAYMENT_KEY')) {
      return true;
    }
    
    // 네트워크 오류 등은 계속 재시도
    return false;
  }

  // 폴링 상태 조회
  getPollingStatus(paymentKey) {
    const pollingData = this.pollingIntervals.get(paymentKey);
    if (!pollingData) {
      return null;
    }

    return {
      isPolling: true,
      startTime: pollingData.startTime,
      duration: Date.now() - pollingData.startTime,
      orderId: pollingData.orderId
    };
  }

  // 모든 폴링 상태 조회
  getAllPollingStatus() {
    const statuses = {};
    for (const [paymentKey, pollingData] of this.pollingIntervals) {
      statuses[paymentKey] = {
        isPolling: true,
        startTime: pollingData.startTime,
        duration: Date.now() - pollingData.startTime,
        orderId: pollingData.orderId
      };
    }
    return statuses;
  }

  // 결제 상태별 사용자 메시지
  getStatusMessage(status) {
    switch (status) {
      case 'READY':
        return '결제 대기 중';
      case 'IN_PROGRESS':
        return '결제 처리 중';
      case 'DONE':
        return '결제 완료';
      case 'CANCELED':
        return '결제 취소됨';
      case 'ABORTED':
        return '결제 중단됨';
      case 'FAILED':
        return '결제 실패';
      default:
        return '결제 상태 확인 중';
    }
  }

  // 결제 상태별 아이콘/색상
  getStatusStyle(status) {
    switch (status) {
      case 'READY':
        return { color: '#2196f3', icon: '⏳' };
      case 'IN_PROGRESS':
        return { color: '#ff9800', icon: '🔄' };
      case 'DONE':
        return { color: '#4caf50', icon: '✅' };
      case 'CANCELED':
        return { color: '#9e9e9e', icon: '❌' };
      case 'ABORTED':
        return { color: '#f44336', icon: '⏹️' };
      case 'FAILED':
        return { color: '#f44336', icon: '❌' };
      default:
        return { color: '#666', icon: '❓' };
    }
  }
}

// 싱글톤 인스턴스 생성
export const paymentStatusService = new PaymentStatusService();
export default paymentStatusService; 
