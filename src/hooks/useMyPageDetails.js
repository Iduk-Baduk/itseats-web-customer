import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { userAPI } from "../services/userAPI";
import { orderAPI } from "../services/orderAPI";

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
    return orders
      .filter(order => order.status === 'delivered') // 배달 완료된 주문만
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)) // 최신순
      .map(order => ({
        id: order.id,
        title: order.storeName || "매장명 없음",
        date: order.orderDate ? new Date(order.orderDate).toLocaleDateString('ko-KR') : "날짜 없음",
        image: order.storeImage || getStoreImage(order.storeId) || "/samples/food1.jpg",
        totalPrice: order.totalPrice,
        status: order.status,
      }));
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

        // 사용자 통계 정보 조회
        try {
          const stats = await userAPI.getStats();
          setUserStats(stats);
        } catch (error) {
          console.warn('사용자 통계 로딩 실패:', error);
          // 기본값 유지
        }

        // 즐겨찾기 데이터 로딩
        try {
          const favorites = await userAPI.getFavorites();
          
          // 즐겨찾기 데이터와 매장 데이터 매칭
          const favoriteStores = favorites.map(favorite => {
            const store = stores.find(s => s.id === favorite.storeId || s.id === parseInt(favorite.storeId));
            return store ? {
              id: store.id,
              title: store.name,
              image: store.imageUrl || "/samples/food1.jpg",
              rating: store.rating,
              category: store.category,
              deliveryTime: store.deliveryTime,
              deliveryFee: store.deliveryFee,
              favoriteId: favorite.id,
              createdAt: favorite.createdAt,
            } : null;
          }).filter(Boolean);
          
          setFavoriteData(favoriteStores);
        } catch (error) {
          console.warn('즐겨찾기 데이터 로딩 실패:', error);
          // LocalStorage에서 폴백 데이터 로딩
          const favoriteIds = JSON.parse(localStorage.getItem('itseats-favorites') || '[]');
          const favoriteStores = favoriteIds.map(id => {
            const store = stores.find(s => s.id === id || s.id === parseInt(id));
            return store ? {
              id: store.id,
              title: store.name,
              image: store.imageUrl || "/samples/food1.jpg",
              rating: store.rating,
              category: store.category,
              deliveryTime: store.deliveryTime,
              deliveryFee: store.deliveryFee,
            } : null;
          }).filter(Boolean);
          setFavoriteData(favoriteStores);
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
  }, [stores]);

  return {
    reviewData,
    orderData,
    favoriteData,
    userStats,
    loading,
    error,
  };
}
