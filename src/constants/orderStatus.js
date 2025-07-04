// 주문 상태 상수 정의
export const ORDER_STATUS = {
  CANCELED: 'CANCELED',
  WAITING: 'WAITING',
  COOKING: 'COOKING',
  COOKED: 'COOKED',
  RIDER_READY: 'RIDER_READY',
  DELIVERING: 'DELIVERING',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED'
};

// 주문 상태별 단계 매핑
export const ORDER_STEPS = {
  [ORDER_STATUS.WAITING]: 0,
  [ORDER_STATUS.COOKING]: 1,
  [ORDER_STATUS.COOKED]: 2,
  [ORDER_STATUS.RIDER_READY]: 2,
  [ORDER_STATUS.DELIVERING]: 2,
  [ORDER_STATUS.DELIVERED]: 3,
  [ORDER_STATUS.COMPLETED]: 4,
  [ORDER_STATUS.CANCELED]: -1
};

// 주문 상태별 UI 설정
export const ORDER_STATUS_CONFIG = {
  [ORDER_STATUS.WAITING]: {
    step: 0,
    person: "사장님",
    message: "주문을 접수하고 있어요",
    image: "/icons/order/owner.jpg",
    showMap: true,
    showETA: false
  },
  [ORDER_STATUS.COOKING]: {
    step: 1,
    person: "사장님",
    message: "음식을 맛있게 조리하고 있어요",
    image: "/icons/order/owner.jpg",
    showMap: false,
    showETA: true
  },
  [ORDER_STATUS.COOKED]: {
    step: 2,
    person: "사장님",
    message: "음식 조리를 완료했어요",
    image: "/icons/order/owner.jpg",
    showMap: true,
    showETA: true
  },
  [ORDER_STATUS.RIDER_READY]: {
    step: 2,
    person: "배달파트너",
    message: "음식을 가지러 가고 있어요",
    image: "/icons/order/rider.jpg",
    showMap: true,
    showETA: true
  },
  [ORDER_STATUS.DELIVERING]: {
    step: 2,
    person: "배달파트너",
    message: "배달 중이에요",
    image: "/icons/order/rider.jpg",
    showMap: true,
    showETA: true
  },
  [ORDER_STATUS.DELIVERED]: {
    step: 3,
    person: "배달파트너",
    message: "목적지로 배달을 완료했어요",
    image: "/icons/order/rider.jpg",
    showMap: true,
    showETA: false
  },
  [ORDER_STATUS.COMPLETED]: {
    step: 4,
    person: "잇츠잇츠",
    message: "주문이 완료되었어요",
    image: null,
    showMap: false,
    showETA: false
  },
  [ORDER_STATUS.CANCELED]: {
    step: -1,
    person: "잇츠잇츠",
    message: "주문이 취소되었어요",
    image: null,
    showMap: false,
    showETA: false
  }
}; 
