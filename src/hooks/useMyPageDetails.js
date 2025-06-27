import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { userAPI } from "../services/userAPI";
import { orderAPI } from "../services/orderAPI";
import { ORDER_STATUS } from "../constants/orderStatus";

export default function useMyPageDetails() {
  const [reviewData, setReviewData] = useState([]);
  const [favoriteData, setFavoriteData] = useState([]);
  const [userStats, setUserStats] = useState({
    reviewCount: 0,
    helpCount: 0,
    favoriteCount: 0,
    orderCount: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redux에서 주문 데이터 가져오기
  const orders = useSelector(state => state.order?.orders || []);
  const stores = useSelector(state => state.store?.stores || []);

  // 주문 데이터를 마이페이지 형식으로 변환
  const orderData = useMemo(() => {
    console.log('🔍 Redux 주문 데이터:', orders);
    
    // 완료된 주문만 필터링 (배달 완료 + 주문 완료)
    const completedOrders = orders.filter(order => 
      order.status === ORDER_STATUS.DELIVERED || 
      order.status === ORDER_STATUS.COMPLETED
    );
    
    console.log('✅ 완료된 주문:', completedOrders);
    
    return completedOrders
      .sort((a, b) => {
        // 날짜 정렬 (최신순)
        const dateA = new Date(a.orderDate || a.createdAt || Date.now());
        const dateB = new Date(b.orderDate || b.createdAt || Date.now());
        return dateB - dateA;
      })
      .map(order => {
        const orderDate = order.orderDate || order.createdAt;
        const formattedDate = orderDate 
          ? new Date(orderDate).toLocaleDateString('ko-KR')
          : "날짜 없음";
          
        return {
          id: order.id,
          title: order.storeName || "매장명 없음",
          date: formattedDate,
          image: order.storeImage || getStoreImage(order.storeId) || "/samples/food1.jpg",
          totalPrice: order.totalPrice || order.orderPrice || 0,
          status: order.status,
          menuSummary: order.menuSummary || "메뉴 정보 없음",
        };
      });
  }, [orders, stores]);

  // 매장 이미지 가져오기 헬퍼 함수
  const getStoreImage = (storeId) => {
    const store = stores.find(s => s.id === storeId || s.id === parseInt(storeId));
    return store?.imageUrl;
  };

  // API 호출로 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 데이터 로딩 시작, stores 개수:', stores.length);

        // 사용자 통계 정보 조회
        try {
          const stats = await userAPI.getStats();
          setUserStats(stats);
        } catch (error) {
          console.warn('사용자 통계 로딩 실패:', error);
          // 기본값 유지
        }

        // 리뷰 데이터는 당분간 빈 상태로 유지
        setReviewData([]);

      } catch (error) {
        console.error('마이페이지 데이터 로딩 실패:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orders]); // orders만 의존성으로 설정

  // stores 데이터가 변경될 때마다 즐겨찾기 데이터 다시 로드
  useEffect(() => {
    if (stores.length > 0) {
      console.log('📦 stores 데이터 변경됨, 즐겨찾기 다시 로드');
      loadFavoriteData();
    } else {
      console.log('⚠️ stores 데이터가 없음, 즐겨찾기 초기화');
      setFavoriteData([]);
    }
  }, [stores]); // stores 변경 시에만 실행

  // 즐겨찾기 데이터 로딩 함수 (로컬스토리지 우선)
  const loadFavoriteData = async () => {
    try {
      console.log('🔄 즐겨찾기 데이터 로딩 시작...');
      
      // 1. 먼저 로컬스토리지에서 즐겨찾기 확인
      const favoriteIds = JSON.parse(localStorage.getItem('itseats-favorites') || '[]');
      console.log('💾 로컬스토리지 즐겨찾기 IDs:', favoriteIds);
      
      if (favoriteIds.length > 0) {
        // 로컬스토리지에 데이터가 있으면 즉시 사용
        const favoriteStores = favoriteIds.map(id => {
          const store = stores.find(s => String(s.id) === String(id));
          if (!store) {
            console.warn(`로컬스토리지에서 매장 정보를 찾을 수 없습니다: id=${id}`);
            return null;
          }
          return {
            id: store.id,
            title: store.name,
            image: store.imageUrl || "/samples/food1.jpg",
            rating: store.rating,
            category: store.category,
            deliveryTime: store.deliveryTime,
            deliveryFee: store.deliveryFee,
          };
        }).filter(Boolean);
        
        console.log('💾 로컬스토리지 즐겨찾기 매장들:', favoriteStores);
        setFavoriteData(favoriteStores);
        return; // 로컬스토리지 데이터 사용 후 종료
      }
      
      // 2. 로컬스토리지에 데이터가 없으면 API 호출
      try {
        console.log('📡 API에서 즐겨찾기 데이터 조회...');
        const favorites = await userAPI.getFavorites();
        console.log('📋 API 즐겨찾기 데이터:', favorites);
        
        // API 데이터와 매장 데이터 매칭
        const favoriteStores = favorites.map(favorite => {
          const store = stores.find(s => s.id === favorite.storeId || s.id === parseInt(favorite.storeId));
          if (!store) {
            console.warn(`API에서 매장 정보를 찾을 수 없습니다: storeId=${favorite.storeId}`);
            return null;
          }
          return {
            id: store.id,
            title: store.name,
            image: store.imageUrl || "/samples/food1.jpg",
            rating: store.rating,
            category: store.category,
            deliveryTime: store.deliveryTime,
            deliveryFee: store.deliveryFee,
            favoriteId: favorite.id,
            createdAt: favorite.createdAt,
          };
        }).filter(Boolean);
        
        console.log('✅ API 즐겨찾기 매장들:', favoriteStores);
        setFavoriteData(favoriteStores);
        
        // API 데이터를 로컬스토리지에도 동기화
        if (favoriteStores.length > 0) {
          const storeIds = favoriteStores.map(store => store.id);
          localStorage.setItem('itseats-favorites', JSON.stringify(storeIds));
          console.log('💾 API 데이터를 로컬스토리지에 동기화:', storeIds);
        }
        
      } catch (apiError) {
        console.warn('API 즐겨찾기 로딩 실패:', apiError);
        // API 실패 시 빈 배열로 설정
        setFavoriteData([]);
      }
      
    } catch (error) {
      console.error('즐겨찾기 데이터 로딩 실패:', error);
      setFavoriteData([]);
    }
  };

  // 주문 내역 처리 함수 추가
  const handleFavoriteClick = (storeId) => {
    console.log('즐겨찾기 매장 클릭:', storeId);
    // 매장 상세 페이지로 이동하는 로직 추가 가능
  };

  return {
    reviewData,
    orderData,
    favoriteData,
    userStats,
    loading,
    error,
    handleFavoriteClick,
    // 즐겨찾기 데이터 새로고침 함수 제공
    refreshFavorites: loadFavoriteData,
  };
}
