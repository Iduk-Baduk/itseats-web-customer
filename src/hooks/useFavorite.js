// useFavorite.js
import { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";

function useFavorite() {
  // Redux에서 매장 데이터 가져오기
  const stores = useSelector((state) => state.store?.stores || []);
  
  // 즐겨찾기 상태 관리 (실제 서비스에서는 API나 LocalStorage 연동)
  const [favoriteStoreIds, setFavoriteStoreIds] = useState(() => {
    // LocalStorage에서 즐겨찾기 목록 복원
    try {
      const saved = localStorage.getItem('itseats-favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortOption, setSortOption] = useState("recent");

  // 즐겨찾기 변경 시 LocalStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem('itseats-favorites', JSON.stringify(favoriteStoreIds));
    } catch (error) {
      console.warn('즐겨찾기 저장 실패:', error);
    }
  }, [favoriteStoreIds]);

  // 실제 즐겨찾기 매장 목록 생성
  const favorites = useMemo(() => {
    return favoriteStoreIds.map(storeId => {
      const store = stores.find(s => s.id === storeId || s.id === parseInt(storeId));
      if (!store) return null;
      
      return {
        id: store.id,
        storeId: store.id,
        name: store.name,
        rating: store.rating,
        reviewCount: store.reviewCount,
        distance: 0.5, // 기본값 - 실제로는 위치 기반 계산 필요
        eta: parseInt(store.deliveryTime?.split('-')[0]) || 30,
        deliveryType: store.deliveryFee === 0 ? "무료배달" : "유료배달",
        coupon: store.coupon || "할인 정보 없음",
        imageUrl: store.imageUrl || "/samples/food1.jpg",
        addedAt: new Date(), // 실제로는 즐겨찾기 추가 시점 저장 필요
      };
    }).filter(Boolean);
  }, [favoriteStoreIds, stores]);

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
    setSelectedIds([]);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleUnfavorite = () => {
    setFavoriteStoreIds((prev) => prev.filter((storeId) => !selectedIds.includes(storeId)));
    setSelectedIds([]);
    setIsEditing(false);
  };

  // 즐겨찾기 추가/제거 함수
  const toggleFavorite = (storeId) => {
    setFavoriteStoreIds((prev) => {
      const normalizedStoreId = String(storeId);
      const normalizedPrev = prev.map(String);
      
      return normalizedPrev.includes(normalizedStoreId)
        ? prev.filter((id) => String(id) !== normalizedStoreId)
        : [...prev, storeId];
    });
  };

  // 즐겨찾기 여부 확인
  const isFavorite = (storeId) => {
    return favoriteStoreIds.some(id => String(id) === String(storeId));
  };

  const sortedFavorites = useMemo(() => {
    const sorted = [...favorites];
    if (sortOption === "recent") {
      sorted.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    } else if (sortOption === "rating") {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return sorted;
  }, [favorites, sortOption]);

  const navigateToHome = () => {
    window.location.href = "/"; // 홈으로 이동
  };

  return {
    favorites: sortedFavorites,
    isEditing,
    selectedIds,
    toggleEditMode,
    toggleSelect,
    handleUnfavorite,
    sortedFavorites,
    sortOption,
    setSortOption,
    navigateToHome,
    toggleFavorite,
    isFavorite,
  };
}

export default useFavorite;
