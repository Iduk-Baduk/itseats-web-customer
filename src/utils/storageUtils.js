import { logger } from './logger';

// 로컬스토리지 최대 주문 보관 개수
const MAX_ORDERS_IN_STORAGE = 50;

// 로컬스토리지 비우기
export const clearLocalStorage = () => {
  try {
    // 주문 데이터만 선택적으로 삭제
    localStorage.removeItem('orders');
    localStorage.removeItem('cart');
    
    logger.log('✅ 로컬스토리지 정리 완료');
    return true;
  } catch (error) {
    logger.error('❌ 로컬스토리지 정리 실패:', error);
    return false;
  }
};

// 전체 로컬스토리지 비우기 (긴급시)
export const clearAllLocalStorage = () => {
  try {
    localStorage.clear();
    logger.log('✅ 전체 로컬스토리지 정리 완료');
    return true;
  } catch (error) {
    logger.error('❌ 전체 로컬스토리지 정리 실패:', error);
    return false;
  }
};

// 주문 데이터 정리 (오래된 주문 삭제)
export const cleanupOrderStorage = (orders) => {
  try {
    if (!Array.isArray(orders) || orders.length <= MAX_ORDERS_IN_STORAGE) {
      return orders;
    }

    // 최신 주문만 MAX_ORDERS_IN_STORAGE 개수만큼 유지
    const sortedOrders = orders
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, MAX_ORDERS_IN_STORAGE);

    logger.log(`🧹 주문 데이터 정리: ${orders.length} → ${sortedOrders.length}`);
    return sortedOrders;
  } catch (error) {
    logger.error('❌ 주문 데이터 정리 실패:', error);
    return orders.slice(0, MAX_ORDERS_IN_STORAGE); // 안전하게 앞에서부터 잘라서 반환
  }
};

// 로컬스토리지 용량 체크
export const checkStorageSize = () => {
  try {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length;
      }
    }
    
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
    logger.log(`📊 로컬스토리지 사용량: ${sizeInMB}MB`);
    
    // 5MB 이상이면 경고
    if (totalSize > 5 * 1024 * 1024) {
      logger.warn('⚠️ 로컬스토리지 용량 초과 (5MB+), 정리 필요');
      return { size: sizeInMB, needsCleanup: true };
    }
    
    return { size: sizeInMB, needsCleanup: false };
  } catch (error) {
    logger.error('❌ 로컬스토리지 용량 체크 실패:', error);
    return { size: '0', needsCleanup: false };
  }
};

// 주문 데이터 압축 저장 (핵심 정보만)
export const compressOrderForStorage = (order) => {
  return {
    id: order.id,
    orderId: order.orderId,
    storeId: order.storeId,
    storeName: order.storeName,
    status: order.status,
    totalPrice: order.totalPrice,
    createdAt: order.createdAt,
    menuSummary: order.menuSummary,
    // 상세 정보는 API에서 가져오기
  };
}; 
