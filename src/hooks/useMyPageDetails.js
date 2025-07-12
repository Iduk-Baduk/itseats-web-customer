import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { userAPI } from "../services";
import { orderAPI } from "../services/orderAPI";
import { ORDER_STATUS } from "../constants/orderStatus";
import { STORAGE_KEYS, logger } from "../utils/logger";
import { useNavigate } from "react-router-dom";

export default function useMyPageDetails() {
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState([]);
  const [favoriteData, setFavoriteData] = useState([]);
  const [userStats, setUserStats] = useState({
    reviewCount: 0,
    helpCount: 0,
    favoriteCount: 0,
    orderCount: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redux에서 데이터 가져오기
  const orders = useSelector((state) => state.order?.orders || []);
  const stores = useSelector((state) => state.store?.stores || []);

  // 매장 이미지 가져오기 함수
  const getStoreImage = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    return store?.images?.[0] || "/samples/food1.jpg";
  };

  // 주문 데이터 변환 (완료된 주문만)
  const orderData = useMemo(() => {
    const completedOrders = orders.filter(order => 
      order.orderStatus === ORDER_STATUS.DELIVERED || 
      order.orderStatus === ORDER_STATUS.COMPLETED
    );
    
    logger.log('✅ 완료된 주문:', completedOrders);
    
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
          orderStatus: order.orderStatus,
          menuSummary: order.menuSummary || "메뉴 정보 없음",
        };
      });
  }, [orders, stores]);

  // 즐겨찾기 데이터 로딩 함수 (로컬스토리지 우선) - useCallback으로 최적화
  const loadFavoriteData = useCallback(async () => {
    try {
      logger.log('🔄 즐겨찾기 데이터 로딩 시작...');
      
      // 1. 먼저 로컬스토리지에서 즐겨찾기 확인
      const favoriteIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');
      logger.log('💾 로컬스토리지 즐겨찾기 IDs:', favoriteIds);
      
      if (favoriteIds.length > 0) {
        // 로컬스토리지에 데이터가 있으면 즉시 사용
        const favoriteStores = favoriteIds.map(id => {
          const store = stores.find(s => String(s.id) === String(id));
          if (!store) {
            logger.warn(`로컬스토리지에서 매장 정보를 찾을 수 없습니다: id=${id}`);
            return null;
          }
          return {
            id: store.storeId,
            title: store.name,
            image: store.images[0] || "/samples/food1.jpg",
            rating: store.review,
            category: store.category,
            deliveryTime: store.deliveryTime,
            deliveryFee: store.deliveryFee,
          };
        }).filter(Boolean);
        
        logger.log('💾 로컬스토리지 즐겨찾기 매장들:', favoriteStores);
        setFavoriteData(favoriteStores);
        return; // 로컬스토리지 데이터 사용 후 종료
      }
      
      // 2. 로컬스토리지에 데이터가 없으면 API 호출
      try {
        logger.log('📡 API에서 즐겨찾기 데이터 조회...');
        const favorites = await userAPI.getFavorites();
        logger.log('📋 API 즐겨찾기 데이터:', favorites);
        
        // API 데이터와 매장 데이터 매칭
        const favoriteStores = favorites.map(favorite => {
          const store = stores.find(s => s.id === favorite.storeId || s.id === parseInt(favorite.storeId));
          if (!store) {
            logger.warn(`API에서 매장 정보를 찾을 수 없습니다: storeId=${favorite.storeId}`);
            return null;
          }
          return {
            id: store.storeId,
            title: store.name,
            image: store.images[0] || "/samples/food1.jpg",
            rating: store.review,
            category: store.category,
            deliveryTime: store.deliveryTime,
            deliveryFee: store.deliveryFee,
            favoriteId: favorite.id,
            createdAt: favorite.createdAt,
          };
        }).filter(Boolean);
        
        logger.log('✅ API 즐겨찾기 매장들:', favoriteStores);
        setFavoriteData(favoriteStores);
        
        // API 데이터를 로컬스토리지에도 동기화
        if (favoriteStores.length > 0) {
          const storeIds = favoriteStores.map(store => store.storeId);
          localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(storeIds));
          logger.log('💾 API 데이터를 로컬스토리지에 동기화:', storeIds);
        }
        
      } catch (apiError) {
        logger.warn('API 즐겨찾기 로딩 실패:', apiError);
        // API 실패 시 빈 배열로 설정
        setFavoriteData([]);
      }
      
    } catch (error) {
      logger.error('즐겨찾기 데이터 로딩 실패:', error);
      setFavoriteData([]);
    }
  }, [stores]);

  // API 호출로 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        logger.log('🔄 데이터 로딩 시작, stores 개수:', stores.length);

        // Promise.all을 사용하여 병렬로 API 호출하고 개별 에러 처리
        const [userStatsResult] = await Promise.all([
          userAPI.getStats().catch((error) => {
            logger.warn('사용자 통계 데이터 로드 실패:', error);
            return {
              reviewCount: 0,
              helpCount: 0,
              favoriteCount: 0,
              orderCount: 0,
              totalSpent: 0
            };
          })
        ]);

        setUserStats(userStatsResult);

        // 리뷰 데이터는 당분간 빈 상태로 유지
        setReviewData([]);

      } catch (error) {
        logger.error('마이페이지 데이터 로딩 실패:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orders, stores]); // stores도 의존성에 추가

  // stores 데이터가 변경될 때마다 즐겨찾기 데이터 다시 로드
  useEffect(() => {
    if (stores.length > 0) {
      logger.log('📦 stores 데이터 변경됨, 즐겨찾기 다시 로드');
      loadFavoriteData();
    } else {
      logger.log('⚠️ stores 데이터가 없음, 즐겨찾기 초기화');
      setFavoriteData([]);
    }
  }, [stores, loadFavoriteData]); // loadFavoriteData 의존성 추가

  // 즐겨찾기 새로고침 함수
  const refreshFavorites = useCallback(async () => {
    await loadFavoriteData();
  }, [loadFavoriteData]);

  const handleFavoriteClick = useCallback((storeId) => {
    navigate(`/stores/${storeId}`);
  }, [navigate]);

  const handleOrderClick = useCallback((orderId) => {
    // 주문 ID로 주문 정보 찾기
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      logger.warn('주문 정보를 찾을 수 없습니다:', orderId);
      return;
    }

    // 가게 ID로 이동
    const storeId = order.storeId;
    if (storeId) {
      navigate(`/stores/${storeId}`);
    } else {
      logger.warn('가게 정보를 찾을 수 없습니다:', order);
    }
  }, [orders, navigate]);

  return {
    reviewData,
    orderData,
    favoriteData,
    userStats,
    loading,
    error,
    handleFavoriteClick,
    handleOrderClick,
    refreshFavorites
  };
}
