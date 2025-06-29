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
 * @returns {number} 진행률 단계 (0-5, -1은 취소)
 */
export const getOrderStep = (orderStatus) => {
  // null이나 undefined 체크
  if (!orderStatus) {
    console.warn('Order status is null or undefined');
    return 0;
  }
  
  const stepMapping = {
    'WAITING': 0,      // 주문접수
    'ACCEPTED': 1,     // 주문수락
    'COOKING': 2,      // 조리중
    'COOKED': 2,       // 조리완료 (여전히 조리중 단계)
    'RIDER_READY': 3,  // 배달중
    'DELIVERING': 3,   // 배달중
    'DELIVERED': 4,    // 배달완료
    'COMPLETED': 4,    // 주문완료
    'CANCELED': -1     // 주문취소
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
    'CANCELED',    // 주문취소
    'WAITING',     // 주문접수
    'ACCEPTED',    // 주문수락
    'COOKING',     // 조리중
    'COOKED',      // 조리완료
    'RIDER_READY', // 라이더 대기
    'DELIVERING',  // 배달중
    'DELIVERED',   // 배달완료
    'COMPLETED'    // 주문완료
  ];
  return validStatuses.includes(orderStatus);
}; 
