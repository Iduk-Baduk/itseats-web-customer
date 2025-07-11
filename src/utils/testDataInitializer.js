// 테스트용 데이터 초기화 유틸리티
import { addOrder } from '../store/orderSlice';
import { ORDER_STATUS } from '../constants/orderStatus';
import { STORAGE_KEYS, logger } from './logger';

// 테스트용 주문 데이터
const sampleOrders = [
  {
    storeId: "2", // 존재하는 매장 ID로 변경
    storeName: "BHC 구름점",
    storeImage: "/samples/food1.jpg",
    status: "delivered",
    orderDate: "2024-01-15T18:30:00.000Z",
    deliveryTime: "2024-01-15T19:15:00.000Z",
    totalPrice: 28900,
    deliveryFee: 2500,
    orderMenus: [
      {
        menuId: 1,
        menuName: "허니콤보",
        price: 24900,
        quantity: 1,
        options: ["엑스트라 치즈", "콜라"]
      }
    ],
    deliveryAddress: "경기 성남시 판교로 242 PDC A동 902호",
    paymentMethod: "card",
    rating: 5,
    review: "맛있게 잘 먹었습니다!"
  },
  {
    storeId: "2",
    storeName: "맘스터치 판교점",
    storeImage: "/samples/food2.jpg",
    status: "delivered",
    orderDate: "2024-01-10T18:00:00.000Z",
    deliveryTime: "2024-01-10T18:45:00.000Z",
    totalPrice: 17800,
    deliveryFee: 2000,
    orderMenus: [
      {
        menuId: 5,
        menuName: "싸이버거 세트",
        price: 8900,
        quantity: 2,
        options: ["콜라", "감자튀김"]
      }
    ],
    deliveryAddress: "경기 성남시 판교로 242 PDC A동 902호",
    paymentMethod: "card",
    rating: 4,
    review: "버거가 맛있어요. 배달도 빨랐습니다."
  },
  {
    storeId: "4",
    storeName: "교촌치킨 구름점",
    storeImage: "/samples/food1.jpg",
    status: "delivered",
    orderDate: "2024-01-08T19:30:00.000Z",
    deliveryTime: "2024-01-08T20:15:00.000Z",
    totalPrice: 22400,
    deliveryFee: 2500,
    orderMenus: [
      {
        menuId: 8,
        menuName: "허니콤보",
        price: 19900,
        quantity: 1,
        options: []
      }
    ],
    deliveryAddress: "경기 성남시 판교로 242 PDC A동 902호",
    paymentMethod: "card",
    rating: 5,
    review: "허니콤보 정말 맛있네요! 또 주문할게요."
  },
  {
    storeId: "2", // 존재하는 매장 ID로 변경
    storeName: "BHC 구름점",
    storeImage: "/samples/food1.jpg",
    status: "delivered",
    orderDate: "2024-01-05T20:00:00.000Z",
    deliveryTime: "2024-01-05T20:45:00.000Z",
    totalPrice: 31400,
    deliveryFee: 2500,
    orderMenus: [
      {
        menuId: 1,
        menuName: "허니콤보",
        price: 24900,
        quantity: 1,
        options: ["엑스트라 치즈"]
      },
      {
        menuId: 3,
        menuName: "콜라 1.25L",
        price: 2500,
        quantity: 2,
        options: []
      }
    ],
    deliveryAddress: "경기 성남시 판교로 242 PDC A동 902호",
    paymentMethod: "coupay"
  },
  {
    storeId: "5",
    storeName: "미스터피자 판교점",
    storeImage: "/samples/food3.jpg",
    status: "delivered",
    orderDate: "2024-01-03T19:00:00.000Z",
    deliveryTime: "2024-01-03T19:50:00.000Z",
    totalPrice: 26900,
    deliveryFee: 3000,
    orderMenus: [
      {
        menuId: 10,
        menuName: "고구마 피자 M",
        price: 23900,
        quantity: 1,
        options: []
      }
    ],
    deliveryAddress: "경기 성남시 판교로 242 PDC A동 902호",
    paymentMethod: "card"
  }
];

// 테스트 데이터 초기화 함수
export const initializeTestData = (dispatch) => {
  // 기존 주문이 없는 경우에만 테스트 데이터 추가
  const existingOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
  
  if (existingOrders.length === 0) {
    logger.log('🧪 테스트 주문 데이터를 초기화합니다...');
    
    const timeoutIds = [];
    sampleOrders.forEach((order, index) => {
      // 시간차를 두고 추가하여 자연스럽게 보이도록
      const timeoutId = setTimeout(() => {
        try {
          dispatch(addOrder(order));
        } catch (error) {
          logger.error('주문 추가 실패:', error);
        }
      }, index * 100);
      timeoutIds.push(timeoutId);
    });
    
    logger.log('✅ 테스트 주문 데이터 초기화 완료');
    
    // cleanup 함수 반환
    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }

  // 즐겨찾기 테스트 데이터
  const existingFavorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');
  
  if (existingFavorites.length === 0) {
    const sampleFavorites = [1, 2, 3, 4, 5]; // 매장 ID들
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(sampleFavorites));
    logger.log('✅ 테스트 즐겨찾기 데이터 초기화 완료');
  }
  
  return () => {}; // no-op cleanup
}; 
