import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { userAPI } from "../services/userAPI";
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
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const orders = useSelector((state) => state.order?.orders || []);
  const stores = useSelector((state) => state.store?.stores || []);

  const getStoreImage = (storeId) => {
    const store = stores.find((s) => s.id === storeId);
    return store?.images?.[0] || "/samples/food1.jpg";
  };

  const orderData = useMemo(() => {
    const completedOrders = orders.filter(
      (order) => order.orderStatus === "DELIVERED" || order.orderStatus === "COMPLETED"
    );

    return completedOrders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((order) => ({
        id: order.id,
        title: order.storeName || "매장명 없음",
        date: new Date(order.createdAt).toLocaleDateString("ko-KR"),
        image: order.storeImage || getStoreImage(order.storeId) || "/samples/food1.jpg",
        totalPrice: order.totalPrice || order.orderPrice || 0,
        orderStatus: order.orderStatus,
        menuSummary: order.menuSummary || "메뉴 정보 없음",
      }));
  }, [orders, stores]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const myReviewsResult = await userAPI.getReviews().catch((error) => {
          logger.warn("내 리뷰 데이터 로드 실패:", error);
          return { data: [] };
        });

        setReviewData(myReviewsResult || []);

      } catch (error) {
        logger.error("마이페이지 데이터 로딩 실패:", error);
        setError(error.message || "데이터 로딩 실패");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orders, stores]);

  const loadFavoriteData = useCallback(async () => {
    try {
      const favoriteIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || "[]");
      if (favoriteIds.length > 0) {
        const favoriteStores = favoriteIds
          .map((id) => {
            const store = stores.find((s) => String(s.id) === String(id));
            return store
              ? {
                  id: store.id,
                  title: store.name,
                  image: store.images[0] || "/samples/food1.jpg",
                  rating: store.review,
                  category: store.category,
                  deliveryTime: store.deliveryTime,
                  deliveryFee: store.deliveryFee,
                }
              : null;
          })
          .filter(Boolean);
        setFavoriteData(favoriteStores);
      } else {
        setFavoriteData([]);
      }
    } catch (error) {
      logger.error("즐겨찾기 데이터 로딩 실패:", error);
      setFavoriteData([]);
    }
  }, [stores]);

  useEffect(() => {
    if (stores.length > 0) {
      loadFavoriteData();
    } else {
      setFavoriteData([]);
    }
  }, [stores, loadFavoriteData]);

  const handleFavoriteClick = useCallback(
    (storeId) => {
      navigate(`/stores/${storeId}`);
    },
    [navigate]
  );

  const handleOrderClick = useCallback(
    (orderId) => {
      const order = orders.find((o) => o.id === orderId);
      if (order?.storeId) {
        navigate(`/stores/${order.storeId}`);
      } else {
        logger.warn("가게 정보를 찾을 수 없습니다:", order);
      }
    },
    [orders, navigate]
  );

  return {
    reviewData,
    orderData,
    favoriteData,
    userStats,
    loading,
    error,
    handleFavoriteClick,
    handleOrderClick,
  };
}
