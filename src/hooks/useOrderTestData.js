import { useDispatch } from "react-redux";
import { addOrder, updateOrderStatus } from "../store/orderSlice";
import { ORDER_STATUS } from "../constants/orderStatus";

/**
 * 테스트용 주문 데이터를 Redux에 추가하는 훅
 * 개발/테스트 목적으로만 사용
 */
export const useOrderTestData = () => {
  const dispatch = useDispatch();

  // 테스트용 주문 데이터 추가
  const addTestOrder = () => {
    const testOrder = {
      storeName: "도미노피자 구름톤점",
      orderNumber: "14NKFA",
      orderPrice: 15900,
      orderMenuCount: 1,
      deliveryAddress: "경기 성남시 판교로 242 PDC A동 902호",
      destinationLocation: { lat: 37.501887, lng: 127.039252 },
      storeLocation: { lat: 37.4979, lng: 127.0276 },
      riderRequest: "문 앞에 놔주세요 (초인종 O)",
      deliveryEta: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30분 후
      menuSummary: "페퍼로니 피자 + 콜라",
      storeImage: "/samples/food1.jpg",
      // OrderCard 호환성을 위한 추가 필드들
      price: 15900, // orderPrice와 동일한 값
      date: new Date().toLocaleString('ko-KR'),
      isCompleted: false,
      showReviewButton: false,
      rating: 5,
    };

    dispatch(addOrder(testOrder));
    return testOrder;
  };

  // 주문 상태 시뮬레이션
  const simulateOrderStatus = (orderId, status) => {
    const statusMessages = {
      [ORDER_STATUS.WAITING]: "주문이 접수되었습니다.",
      [ORDER_STATUS.COOKING]: "음식을 조리하고 있습니다.",
      [ORDER_STATUS.COOKED]: "조리가 완료되었습니다.",
      [ORDER_STATUS.RIDER_READY]: "라이더가 매장으로 이동 중입니다.",
      [ORDER_STATUS.DELIVERING]: "배달 중입니다.",
      [ORDER_STATUS.DELIVERED]: "배달이 완료되었습니다.",
      [ORDER_STATUS.COMPLETED]: "주문이 완료되었습니다.",
    };

    dispatch(updateOrderStatus({
      orderId,
      status,
      message: statusMessages[status] || "상태가 업데이트되었습니다."
    }));
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

    const interval = setInterval(() => {
      if (currentIndex < statuses.length) {
        simulateOrderStatus(orderId, statuses[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, intervalMs);

    return () => clearInterval(interval); // 정리 함수 반환
  };

  return {
    addTestOrder,
    simulateOrderStatus,
    simulateOrderProgress,
  };
};

// 브라우저 콘솔에서 접근할 수 있도록 window 객체에 추가
if (typeof window !== 'undefined') {
  // Redux store에 접근하기 위한 함수들
  window.orderTest = {
    // 테스트 주문 추가
    addTestOrder: () => {
      const store = window.__REDUX_STORE__;
      if (store) {
        const testOrder = {
          storeName: "도미노피자 구름톤점",
          orderNumber: "14NKFA",
          orderPrice: 15900,
          orderMenuCount: 1,
          deliveryAddress: "경기 성남시 판교로 242 PDC A동 902호",
          destinationLocation: { lat: 37.501887, lng: 127.039252 },
          storeLocation: { lat: 37.4979, lng: 127.0276 },
          riderRequest: "문 앞에 놔주세요 (초인종 O)",
          deliveryEta: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          menuSummary: "페퍼로니 피자 + 콜라",
          storeImage: "/samples/food1.jpg",
          // OrderCard 호환성을 위한 추가 필드들
          price: 15900, // orderPrice와 동일한 값
          date: new Date().toLocaleString('ko-KR'),
          isCompleted: false,
          showReviewButton: false,
          rating: 5,
        };

        store.dispatch({
          type: 'order/addOrder',
          payload: testOrder
        });
        
        console.log('✅ 테스트 주문이 추가되었습니다:', testOrder);
        return testOrder;
      } else {
        console.error('❌ Redux store에 접근할 수 없습니다.');
      }
    },

    // 주문 상태 변경
    updateStatus: (orderId, status) => {
      const store = window.__REDUX_STORE__;
      if (store) {
        const statusMessages = {
          [ORDER_STATUS.WAITING]: "주문이 접수되었습니다.",
          [ORDER_STATUS.COOKING]: "음식을 조리하고 있습니다.",
          [ORDER_STATUS.COOKED]: "조리가 완료되었습니다.",
          [ORDER_STATUS.RIDER_READY]: "라이더가 매장으로 이동 중입니다.",
          [ORDER_STATUS.DELIVERING]: "배달 중입니다.",
          [ORDER_STATUS.DELIVERED]: "배달이 완료되었습니다.",
          [ORDER_STATUS.COMPLETED]: "주문이 완료되었습니다.",
        };

        store.dispatch({
          type: 'order/updateOrderStatus',
          payload: {
            orderId,
            status,
            message: statusMessages[status] || "상태가 업데이트되었습니다."
          }
        });
        
        console.log(`✅ 주문 ${orderId}의 상태가 ${status}로 변경되었습니다.`);
      } else {
        console.error('❌ Redux store에 접근할 수 없습니다.');
      }
    },

    // 현재 주문 상태 확인
    getCurrentState: () => {
      const store = window.__REDUX_STORE__;
      if (store) {
        const state = store.getState();
        console.log('📊 현재 Redux 상태:', state.order);
        return state.order;
      } else {
        console.error('❌ Redux store에 접근할 수 없습니다.');
      }
    },

    // 모든 주문 확인
    getAllOrders: () => {
      const store = window.__REDUX_STORE__;
      if (store) {
        const state = store.getState();
        console.log('📋 모든 주문:', state.order.orders);
        return state.order.orders;
      } else {
        console.error('❌ Redux store에 접근할 수 없습니다.');
      }
    },

    // 주문 상태 자동 시뮬레이션
    simulateProgress: (orderId, intervalMs = 3000) => {
      const store = window.__REDUX_STORE__;
      if (!store) {
        console.error('❌ Redux store에 접근할 수 없습니다.');
        return;
      }

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
      console.log(`🚀 주문 ${orderId}의 상태 시뮬레이션을 시작합니다...`);

      const interval = setInterval(() => {
        if (currentIndex < statuses.length) {
          const status = statuses[currentIndex];
          window.orderTest.updateStatus(orderId, status);
          currentIndex++;
        } else {
          clearInterval(interval);
          console.log('✅ 주문 상태 시뮬레이션이 완료되었습니다.');
        }
      }, intervalMs);

      // 정리 함수 반환
      return () => {
        clearInterval(interval);
        console.log('⏹️ 시뮬레이션이 중단되었습니다.');
      };
    },

    // 도움말
    help: () => {
      console.log(`
🎯 주문 테스트 도구 사용법:

1. 테스트 주문 추가:
   orderTest.addTestOrder()

2. 주문 상태 변경:
   orderTest.updateStatus('주문ID', '상태')
   예: orderTest.updateStatus('123', 'COOKING')

3. 현재 상태 확인:
   orderTest.getCurrentState()

4. 모든 주문 확인:
   orderTest.getAllOrders()

5. 자동 상태 시뮬레이션:
   const stop = orderTest.simulateProgress('주문ID', 3000)
   // 중단하려면: stop()

사용 가능한 상태:
- WAITING: 주문 접수
- COOKING: 조리 중
- COOKED: 조리 완료
- RIDER_READY: 라이더 배차
- DELIVERING: 배달 중
- DELIVERED: 배달 완료
- COMPLETED: 주문 완료
      `);
    }
  };

  console.log(`
🎉 주문 테스트 도구가 로드되었습니다!
사용법을 보려면: orderTest.help()
  `);
} 
