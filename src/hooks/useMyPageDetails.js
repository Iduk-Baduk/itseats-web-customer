import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";

export default function useMyPageDetails() {
  const [reviewData, setReviewData] = useState([]);
  const [favoriteData, setFavoriteData] = useState([]);

  // Redux에서 주문 데이터 가져오기
  const orders = useSelector(state => state.order?.orders || []);
  const stores = useSelector(state => state.store?.stores || []);

  // 주문 데이터를 마이페이지 형식으로 변환
  const orderData = useMemo(() => {
    return orders.map(order => ({
      id: order.id,
      title: order.storeName || "매장명 없음",
      date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('ko-KR') : "날짜 없음",
      image: order.storeImage || "/samples/food1.jpg",
    }));
  }, [orders]);

  // API 호출로 데이터 로딩 (실제 서비스에서 구현)
  useEffect(() => {
    // 리뷰 데이터 로딩
    const loadReviewData = async () => {
      try {
        // TODO: 실제 리뷰 API 호출
        // const reviews = await reviewAPI.getMyReviews();
        // setReviewData(reviews);
        setReviewData([]); // 현재는 빈 상태
      } catch (error) {
        console.warn('리뷰 데이터 로딩 실패:', error);
        setReviewData([]);
      }
    };

    // 즐겨찾기 데이터 로딩
    const loadFavoriteData = async () => {
      try {
        // LocalStorage에서 즐겨찾기 ID 목록 가져오기
        const favoriteIds = JSON.parse(localStorage.getItem('itseats-favorites') || '[]');
        
        // 매장 데이터와 매칭하여 즐겨찾기 목록 생성
        const favoriteStores = favoriteIds.map(id => {
          const store = stores.find(s => s.id === id || s.id === parseInt(id));
          return store ? {
            id: store.id,
            title: store.name,
            image: store.imageUrl || "/samples/food1.jpg",
            rating: store.rating,
          } : null;
        }).filter(Boolean);
        
        setFavoriteData(favoriteStores);
      } catch (error) {
        console.warn('즐겨찾기 데이터 로딩 실패:', error);
        setFavoriteData([]);
      }
    };

    loadReviewData();
    loadFavoriteData();
  }, [stores]);

  return {
    reviewData,
    orderData,
    favoriteData,
  };
}
