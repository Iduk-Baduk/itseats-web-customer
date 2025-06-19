// useFavorite.js
import { useState, useMemo } from "react";

const dummyFavorites = [
  {
    id: 1,
    storeId:1,
    name: "스타벅스 강남점",
    rating: 4.9,
    reviewCount: 13812,
    distance: 0.2,
    eta: 26,
    deliveryType: "무료배달",
    coupon: "무료배달+1,000원 할인",
    imageUrl: "/samples/food1.jpg",
    addedAt: new Date("2025-06-18T10:00:00Z"),
  },
  {
    id: 2,
    storeId:2,
    name: "두찜 일산정발산점",
    rating: 4.6,
    reviewCount: 103,
    distance: 0.6,
    eta: 34,
    deliveryType: "무료배달",
    coupon: "무료배달+2,000원 할인",
    imageUrl: "/samples/food2.jpg",
    addedAt: new Date("2025-06-18T11:00:00Z"),
  },
];

function useFavorite() {
  const [favorites, setFavorites] = useState(dummyFavorites);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortOption, setSortOption] = useState("recent");

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
    setFavorites((prev) => prev.filter((store) => !selectedIds.includes(store.id)));
    setSelectedIds([]);
    setIsEditing(false);
  };

  const sortedFavorites = useMemo(() => {
    const sorted = [...favorites];
    if (sortOption === "recent") {
      sorted.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    } else if (sortOption === "rating") {
      sorted.sort((a, b) => b.rating - a.rating);
    }
    return sorted;
  }, [favorites, sortOption]);

  const navigateToHome = () => {
    window.location.href = "/"; // 홈으로 이동
  };

  return {
    favorites,
    isEditing,
    selectedIds,
    toggleEditMode,
    toggleSelect,
    handleUnfavorite,
    sortedFavorites,
    sortOption,
    setSortOption,
    navigateToHome,
  };
}

export default useFavorite;