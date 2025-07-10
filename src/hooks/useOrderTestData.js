import { useDispatch } from "react-redux";
import { addOrder, updateOrder, updateOrderStatus } from "../store/orderSlice";
import { ORDER_STATUS, ORDER_STATUS_CONFIG } from "../constants/orderStatus";
import { getCurrentUser } from "../services/authAPI";
import { STORAGE_KEYS, logger } from "../utils/logger";
import { orderAPI } from "../services/orderAPI";

// 기본 테스트 주문 데이터 템플릿
const BASE_TEST_ORDER_DATA = {
  storeName: "도미노피자 구름톤점",
  storeId: "1",
  orderNumber: "14NKFA",
  orderPrice: 15900,
  orderMenuCount: 2,
  deliveryAddress: "경기 성남시 판교로 242 PDC A동 902호",
  destinationLocation: { lat: 37.501887, lng: 127.039252 },
  storeLocation: { lat: 37.4979, lng: 127.0276 },
  riderRequest: "문 앞에 놔주세요 (초인종 O)",
  deliveryEta: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  menuSummary: "페퍼로니 피자 외 1개",
  storeImage: "/samples/food1.jpg",
  paymentMethod: "card",
  deliveryFee: 2500,
  totalPrice: 18400,
  // 상세 메뉴 정보 추가
  orderMenus: [
    {
      menuId: 1,
      menuName: "페퍼로니 피자",
      quantity: 1,
      price: 12900,
      options: ["사이즈: 라지 (+2000원)", "도우: 오리지널"],
      menuImage: "/samples/food1.jpg"
    },
    {
      menuId: 3,
      menuName: "콜라 1.25L",
      quantity: 1,
      price: 3000,
      options: [],
      menuImage: "/samples/food2.jpg"
    }
  ],
  // OrderCard 호환성을 위한 추가 필드들
  price: 15900,
  date: new Date().toLocaleString('ko-KR'),
  isCompleted: false,
  showReviewButton: false,
  rating: 5,
};

/**
 * 테스트용 주문 데이터를 Redux에 추가하는 훅
 * 현재 로그인된 사용자 정보를 반영
 */
export const useOrderTestData = () => {
  const dispatch = useDispatch();

  // 현재 사용자 정보 기반 테스트 주문 데이터 생성
  const generateTestOrderData = async () => {
    try {
      // 현재 로그인된 사용자 정보 가져오기
      const currentUser = await getCurrentUser();
      
      // 사용자 정보를 반영한 테스트 주문 데이터 생성
      const testOrder = {
        ...BASE_TEST_ORDER_DATA,
        // 사용자별 고유 주문 번호 생성
        orderNumber: `TEST${Date.now().toString().slice(-6)}`,
        // 사용자 정보 추가
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: currentUser.phone,
        // 주문 날짜
        orderDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      return testOrder;
    } catch (error) {
      logger.error('사용자 정보 조회 실패:', error);
      
      const cachedUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || '{}');
      
      // 캐시된 사용자 정보도 없는 경우 에러 throw
      if (!cachedUser.id) {
        throw new Error('로그인이 필요합니다. 테스트 주문을 생성할 수 없습니다.');
      }
      
      return {
        ...BASE_TEST_ORDER_DATA,
        orderNumber: `TEST${Date.now().toString().slice(-6)}`,
        userId: cachedUser.id,
        userName: cachedUser.name || '테스트 사용자',
        userPhone: cachedUser.phone || '010-0000-0000',
        orderDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    }
  };

  // 테스트용 주문 데이터 추가
  const addTestOrder = async () => {
    try {
      const testOrder = await generateTestOrderData();
      
      // orderAPI를 통해 주문 생성
      const response = await orderAPI.createOrder(testOrder);
      
      // 주문 생성 응답 검증
      if (!response?.data?.id) {
        throw new Error('주문 생성 응답에 주문 ID가 없습니다');
      }
      
      const { data: createdOrder } = response;
      
      // Redux store 업데이트
      dispatch(addOrder(createdOrder));
      
      logger.log('✅ 테스트 주문이 추가되었습니다:', createdOrder);
      return createdOrder;
    } catch (error) {
      logger.error('❌ 테스트 주문 추가 실패:', error);
      throw error;
    }
  };

  // 주문 상태 시뮬레이션
  const simulateOrderStatus = async (orderId, status) => {
    try {
      const message = ORDER_STATUS_CONFIG[status]?.message || "상태가 업데이트되었습니다.";
      // orderAPI를 통해 상태 업데이트 (Redux store는 orderAPI 내부에서 업데이트됨)
      await orderAPI.updateOrderStatus(orderId, status, message);
      logger.log(`🔄 주문 ${orderId} 상태 시뮬레이션: ${status}`);
    } catch (error) {
      logger.error('주문 상태 시뮬레이션 실패:', error);
      throw error;
    }
  };

  // 전체 주문 상태 시뮬레이션 (자동 진행)
  const simulateOrderProgress = (orderId, intervalMs = 5000) => {
    const statuses = [
      ORDER_STATUS.WAITING,
      ORDER_STATUS.COOKING,
      ORDER_STATUS.COOKED,
      ORDER_STATUS.RIDER_READY,
      ORDER_STATUS.DELIVERING,
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.COMPLETED
    ];

    let currentIndex = 0;

    const interval = setInterval(async () => {
      if (currentIndex < statuses.length) {
        try {
          await simulateOrderStatus(orderId, statuses[currentIndex]);
          currentIndex++;
        } catch (error) {
          logger.error('주문 상태 시뮬레이션 실패:', error);
          clearInterval(interval);
        }
      } else {
        clearInterval(interval);
      }
    }, intervalMs);

    return () => clearInterval(interval); // 정리 함수 반환
  };

  // 현재 로그인된 사용자 정보 가져오기
  const getCurrentUserInfo = () => {
    try {
      const cachedUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || '{}');
      return {
        id: cachedUser.id || 'unknown',
        name: cachedUser.name || '테스트 사용자',
        phone: cachedUser.phone || '010-0000-0000',
      };
    } catch (error) {
      logger.warn('사용자 정보 조회 실패:', error);
      return {
        id: 'unknown',
        name: '테스트 사용자',
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

// 브라우저 콘솔에서 접근할 수 있도록 window 객체에 추가
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Redux store에 접근하기 위한 함수들
  window.orderTest = {
    // 테스트 주문 추가 (사용자 정보 반영)
    addTestOrder: async () => {
      const store = window.__REDUX_STORE__;
      if (store) {
        try {
          // 현재 사용자 정보 가져오기
          const cachedUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || '{}');
          
          const testOrder = {
            ...BASE_TEST_ORDER_DATA,
            orderNumber: `TEST${Date.now().toString().slice(-6)}`,
            userId: cachedUser.id || 'unknown',
            userName: cachedUser.name || '테스트 사용자',
            userPhone: cachedUser.phone || '010-0000-0000',
            orderDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };
          
          store.dispatch(addOrder(testOrder));
          logger.log('✅ 테스트 주문이 추가되었습니다:', testOrder);
          return testOrder;
        } catch (error) {
          logger.error('❌ 테스트 주문 추가 실패:', error);
        }
      } else {
        logger.error('❌ Redux store에 접근할 수 없습니다.');
      }
    },

    // 주문 상태 변경
    updateStatus: (orderId, status) => {
      const store = window.__REDUX_STORE__;
      if (store) {
        try {
          const message = ORDER_STATUS_CONFIG[status]?.message || "상태가 업데이트되었습니다.";
          store.dispatch(updateOrderStatus({ orderId, status, message }));
          logger.log(`✅ 주문 ${orderId}의 상태가 ${status}로 변경되었습니다.`);
        } catch (error) {
          logger.error('❌ 주문 상태 변경 실패:', error);
        }
      } else {
        logger.error('❌ Redux store에 접근할 수 없습니다.');
      }
    },

    // 현재 주문 상태 확인
    getCurrentState: () => {
      const store = window.__REDUX_STORE__;
      if (store) {
        try {
          const state = store.getState();
          logger.log('📊 현재 Redux 상태:', state.order);
          return state.order;
        } catch (error) {
          logger.error('❌ 상태 확인 실패:', error);
        }
      } else {
        logger.error('❌ Redux store에 접근할 수 없습니다.');
      }
    },

    // 모든 주문 확인
    getAllOrders: () => {
      const store = window.__REDUX_STORE__;
      if (store) {
        try {
          const state = store.getState();
          logger.log('📋 모든 주문:', state.order.orders);
          return state.order.orders;
        } catch (error) {
          logger.error('❌ 주문 목록 조회 실패:', error);
        }
      } else {
        logger.error('❌ Redux store에 접근할 수 없습니다.');
      }
    },

    // 현재 사용자 정보 확인
    getCurrentUser: () => {
      try {
        const cachedUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || '{}');
        logger.log('👤 현재 로그인된 사용자:', cachedUser);
        return cachedUser;
      } catch (error) {
        logger.error('❌ 사용자 정보 확인 실패:', error);
      }
    },

    // 주문 상태 자동 시뮬레이션
    simulateProgress: (orderId, intervalMs = 3000) => {
      const store = window.__REDUX_STORE__;
      if (!store) {
        logger.error('❌ Redux store에 접근할 수 없습니다.');
        return;
      }

      try {
        const statuses = [
          ORDER_STATUS.WAITING,
          ORDER_STATUS.COOKING,
          ORDER_STATUS.COOKED,
          ORDER_STATUS.RIDER_READY,
          ORDER_STATUS.DELIVERING,
          ORDER_STATUS.DELIVERED,
          ORDER_STATUS.COMPLETED
        ];

        let currentIndex = 0;
        logger.log(`🚀 주문 ${orderId}의 상태 시뮬레이션을 시작합니다...`);

        const interval = setInterval(() => {
          if (currentIndex < statuses.length) {
            try {
              const status = statuses[currentIndex];
              window.orderTest.updateStatus(orderId, status);
              currentIndex++;
            } catch (error) {
              logger.error('❌ 상태 업데이트 실패:', error);
              clearInterval(interval);
            }
          } else {
            logger.log('✅ 주문 시뮬레이션이 완료되었습니다.');
            clearInterval(interval);
          }
        }, intervalMs);

        return () => {
          clearInterval(interval);
          logger.log('⏹️ 시뮬레이션이 중단되었습니다.');
        };
      } catch (error) {
        logger.error('❌ 시뮬레이션 시작 실패:', error);
      }
    },

    // 도움말 표시
    help: () => {
      logger.log(`
🎯 주문 테스트 도구 사용법:

// 현재 사용자 정보 확인
orderTest.getCurrentUser()

// 테스트 주문 추가 (현재 사용자 정보 반영)
orderTest.addTestOrder()

// 모든 주문 확인
orderTest.getAllOrders()

// 주문 상태 변경
orderTest.updateStatus('주문ID', 'delivered')

// 자동 시뮬레이션
orderTest.simulateProgress('주문ID', 3000)

// 현재 Redux 상태 확인
orderTest.getCurrentState()
      `);
    }
  };

  // 개발 환경에서 콘솔에 도움말 표시
  logger.log('🎯 주문 테스트 도구가 준비되었습니다! orderTest.help()를 입력하여 사용법을 확인하세요.');
} 
