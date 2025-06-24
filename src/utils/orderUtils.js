// 주문 관련 유틸리티 함수들

/**
 * 도착 예정시간을 계산하고 포맷팅된 객체를 반환
 * @param {string} deliveryEta - ISO 8601 형식의 도착 예정시간
 * @returns {Object|null} { minutes: number, timeString: string } 또는 null
 */
export const calculateETA = (deliveryEta) => {
  if (!deliveryEta) return null;
  
  try {
    const now = new Date();
    const eta = new Date(deliveryEta);
    const diffMs = eta - now;
    const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    
    return {
      minutes: diffMinutes,
      timeString: eta.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  } catch (error) {
    console.warn('Invalid delivery ETA format:', deliveryEta);
    return null;
  }
};

/**
 * 주문 상태에 따른 진행률 단계를 반환
 * @param {string} orderStatus - 주문 상태
 * @returns {number} 진행률 단계 (0-4, -1은 취소)
 */
export const getOrderStep = (orderStatus) => {
  // null이나 undefined 체크
  if (!orderStatus) {
    console.warn('Order status is null or undefined');
    return 0;
  }
  
  const stepMapping = {
    'WAITING': 0,
    'COOKING': 1,
    'COOKED': 2,
    'RIDER_READY': 2,
    'DELIVERING': 3,
    'DELIVERED': 4,
    'COMPLETED': 4,
    'CANCELED': -1
  };
  
  const step = stepMapping[orderStatus];
  if (step === undefined) {
    console.warn(`Unknown order status: ${orderStatus}`);
    return 0;
  }
  
  return step;
};

/**
 * 주문 상태가 유효한지 확인
 * @param {string} orderStatus - 주문 상태
 * @returns {boolean} 유효한 상태인지 여부
 */
export const isValidOrderStatus = (orderStatus) => {
  if (!orderStatus) return false;
  
  const validStatuses = [
    'CANCELED', 'WAITING', 'COOKING', 'COOKED', 
    'RIDER_READY', 'DELIVERING', 'DELIVERED', 'COMPLETED'
  ];
  return validStatuses.includes(orderStatus);
}; 
