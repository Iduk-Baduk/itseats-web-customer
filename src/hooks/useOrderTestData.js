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
