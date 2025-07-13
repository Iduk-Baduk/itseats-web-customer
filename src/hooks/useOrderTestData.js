import { useDispatch } from "react-redux";
import { addOrder, updateOrder, updateOrderStatus } from "../store/orderSlice";
import { ORDER_STATUS, ORDER_STATUS_CONFIG } from "../constants/orderStatus";
import { getCurrentUser } from "../services/authAPI";
import { STORAGE_KEYS, logger } from "../utils/logger";
import { orderAPI } from "../services/orderAPI";

// 기본 테스트 주문 데이터 템플릿 (비활성화됨)
const BASE_TEST_ORDER_DATA = {
  // 목업 데이터 제거 - 새 사용자는 깨끗한 상태로 시작
};

/**
 * 테스트용 주문 데이터를 Redux에 추가하는 훅 (비활성화됨)
 * 새 사용자는 깨끗한 상태로 시작
 */
export const useOrderTestData = () => {
  const dispatch = useDispatch();

  // 현재 사용자 정보 기반 테스트 주문 데이터 생성 (비활성화됨)
  const generateTestOrderData = async () => {
    logger.log('🧪 테스트 주문 데이터 생성이 비활성화되었습니다.');
    throw new Error('테스트 주문 데이터 생성이 비활성화되었습니다. 새 사용자는 깨끗한 상태로 시작합니다.');
  };

  // 테스트용 주문 데이터 추가 (비활성화됨)
  const addTestOrder = async () => {
    logger.log('🧪 테스트 주문 추가가 비활성화되었습니다.');
    throw new Error('테스트 주문 추가가 비활성화되었습니다. 새 사용자는 깨끗한 상태로 시작합니다.');
  };

  // 주문 상태 시뮬레이션 (비활성화됨)
  const simulateOrderStatus = async (orderId, status) => {
    logger.log('🧪 주문 상태 시뮬레이션이 비활성화되었습니다.');
    throw new Error('주문 상태 시뮬레이션이 비활성화되었습니다.');
  };

  // 전체 주문 상태 시뮬레이션 (비활성화됨)
  const simulateOrderProgress = (orderId, intervalMs = 5000) => {
    logger.log('🧪 주문 진행 시뮬레이션이 비활성화되었습니다.');
    return () => {}; // no-op cleanup
  };

  // 현재 로그인된 사용자 정보 가져오기
  const getCurrentUserInfo = () => {
    try {
      const cachedUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || '{}');
      return {
        id: cachedUser.id || 'unknown',
        name: cachedUser.name || '사용자',
        phone: cachedUser.phone || '010-0000-0000',
      };
    } catch (error) {
      logger.warn('사용자 정보 조회 실패:', error);
      return {
        id: 'unknown',
        name: '사용자',
        phone: '010-0000-0000',
      };
    }
  };

  return {
    addTestOrder,
    simulateOrderStatus,
    simulateOrderProgress,
    getCurrentUserInfo,
  };
};

// 브라우저 콘솔에서 접근할 수 있도록 window 객체에 추가 (비활성화됨)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // Redux store에 접근하기 위한 함수들 (비활성화됨)
  window.orderTest = {
    // 테스트 주문 추가 (비활성화됨)
    addTestOrder: async () => {
      logger.log('🧪 콘솔 테스트 주문 추가가 비활성화되었습니다.');
      throw new Error('테스트 주문 추가가 비활성화되었습니다. 새 사용자는 깨끗한 상태로 시작합니다.');
    },

    // 주문 상태 변경 (비활성화됨)
    updateStatus: (orderId, status) => {
      logger.log('🧪 콘솔 주문 상태 변경이 비활성화되었습니다.');
      throw new Error('주문 상태 변경이 비활성화되었습니다.');
    },

    // 현재 주문 상태 확인
    getCurrentState: () => {
      const store = window.__REDUX_STORE__;
      if (store) {
        return store.getState().orders;
      } else {
        logger.error('❌ Redux store에 접근할 수 없습니다.');
        return null;
      }
    },

    // 모든 주문 삭제 (정리용)
    clearAllOrders: () => {
      const store = window.__REDUX_STORE__;
      if (store) {
        try {
          // localStorage에서 주문 데이터 삭제
          localStorage.removeItem(STORAGE_KEYS.ORDERS);
          // Redux store 초기화
          store.dispatch({ type: 'orders/clearAllOrders' });
          logger.log('✅ 모든 주문 데이터가 삭제되었습니다.');
        } catch (error) {
          logger.error('❌ 주문 데이터 삭제 실패:', error);
        }
      } else {
        logger.error('❌ Redux store에 접근할 수 없습니다.');
      }
    }
  };
} 
