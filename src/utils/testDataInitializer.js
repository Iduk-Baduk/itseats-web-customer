// 테스트용 데이터 초기화 유틸리티
import { addOrder } from '../store/orderSlice';
import { ORDER_STATUS } from '../constants/orderStatus';
import { STORAGE_KEYS, logger } from './logger';

// 테스트용 주문 데이터 (비활성화됨)
const sampleOrders = [
  // 목업 데이터 제거 - 새 사용자는 깨끗한 상태로 시작
];

// 테스트 데이터 초기화 함수 (비활성화됨)
export const initializeTestData = (dispatch) => {
  // 목업 데이터 초기화 비활성화 - 새 사용자는 깨끗한 상태로 시작
  logger.log('🧪 테스트 데이터 초기화가 비활성화되었습니다. 새 사용자는 깨끗한 상태로 시작합니다.');
  
  return () => {}; // no-op cleanup
}; 
