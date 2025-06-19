// useFavorite.js
import { useState } from "react";

const dummyFavorites = [
  {
    id: 1,
    name: "회기버거 라페스타점",
    rating: 4.8,
    reviewCount: 1353,
    distance: 0.2,
    eta: 26,
    deliveryType: "무료배달",
    coupon: "무료배달+1,000원 할인",
    imageUrl: "/images/burger1.png",
    addedAt: new Date("2025-06-18T10:00:00Z"),
  },
  {
    id: 2,
    name: "두찜 일산정발산점",
    rating: 4.6,
    reviewCount: 103,
    distance: 0.6,
    eta: 34,
    deliveryType: "무료배달",
    coupon: "무료배달+2,000원 할인",
    imageUrl: "/images/chicken.png",
    addedAt: new Date("2025-06-18T11:00:00Z"),
  },
];

function useFavorite() {
  const [favorites, setFavorites] = useState(dummyFavorites);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

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

  const sortedFavorites = [...favorites].sort(
    (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
  );

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
    navigateToHome,
  };
}

export default useFavorite;
