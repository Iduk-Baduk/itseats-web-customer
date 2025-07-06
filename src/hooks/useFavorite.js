// useFavorite.js
import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { STORAGE_KEYS, logger } from '../utils/logger';

function useFavorite() {
  const dispatch = useDispatch();
  
  // Redux에서 stores 상태 직접 확인
  const stores = useSelector(state => state.store?.stores || []);
  const storeLoading = useSelector(state => state.store?.loading || false);
  
  // localStorage에서 즐겨찾기 ID 목록 불러오기
  const [favoriteStoreIds, setFavoriteStoreIds] = useState(() => {
    // LocalStorage에서 즐겨찾기 목록 복원
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      const ids = saved ? JSON.parse(saved) : [];
      logger.log('💾 useFavorite - 로컬스토리지에서 즐겨찾기 로드:', ids);
      return ids;
    } catch (error) {
      logger.warn('💾 useFavorite - 로컬스토리지 로드 실패, 빈 배열 반환');
      return [];
    }
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortOption, setSortOption] = useState("recent");

  // favoriteStoreIds가 변경될 때 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favoriteStoreIds));
      logger.log('💾 useFavorite - 즐겨찾기 로컬스토리지 저장:', favoriteStoreIds);
    } catch (error) {
      logger.warn('즐겨찾기 저장 실패:', error);
    }
  }, [favoriteStoreIds]);

  // stores와 favoriteStoreIds를 조합하여 즐겨찾기 목록 생성
  const favorites = useMemo(() => {
    logger.log('🔄 useFavorite - 즐겨찾기 목록 생성:', {
      favoriteStoreIds,
      storesCount: stores.length
    });
    
    if (stores.length === 0) {
      logger.log('⚠️ useFavorite - stores 데이터가 없어서 빈 배열 반환');
      return [];
    }
    
    const favoriteStores = favoriteStoreIds.map(storeId => {
      const store = stores.find(s => String(s.id) === String(storeId));
      if (!store) {
        logger.warn(`⚠️ useFavorite - 매장을 찾을 수 없음: ${storeId}`);
        return null;
      }
      
      logger.log(`✅ useFavorite - 즐겨찾기 매장 매칭: ${store.name}`);
      return {
        id: store.storeId,
        title: store.name,
        image: store.images[0] || "/samples/food1.jpg",
        review: store.review,
        category: store.category,
        deliveryTime: store.deliveryTime,
        deliveryFee: store.deliveryFee,
      };
    }).filter(Boolean);
    
    logger.log('✅ useFavorite - 최종 즐겨찾기 목록:', favoriteStores);
    return favoriteStores;
  }, [stores, favoriteStoreIds]);

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
    setSelectedIds([]);
  };

  const toggleSelect = (id) => {
    const normalizedId = String(id);
    setSelectedIds((prev) =>
      prev.includes(normalizedId) ? prev.filter((i) => i !== normalizedId) : [...prev, normalizedId]
    );
  };

  const handleUnfavorite = () => {
    setFavoriteStoreIds((prev) => prev.filter((storeId) => !selectedIds.includes(String(storeId))));
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

  // 즐겨찾기 여부 설정
  const setIsFavorite = (storeId, isFav) => {
    setFavoriteStoreIds((prev) => {
      const normalizedStoreId = String(storeId);
      const normalizedPrev = prev.map(String);
      
      if (isFav) {
        return normalizedPrev.includes(normalizedStoreId)
          ? prev
          : [...prev, storeId];
      } else {
        return prev.filter((id) => String(id) !== normalizedStoreId);
      }
    });
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
    setIsFavorite,
  };
}

export default useFavorite;
