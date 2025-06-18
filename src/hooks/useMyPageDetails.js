import { useState, useEffect } from "react";

export default function useMyPageDetails() {
  const [reviewData, setReviewData] = useState([]);
  const [orderData, setOrderData] = useState([]);
  const [favoriteData, setFavoriteData] = useState([]);

  // 실제 서비스에서는 API 호출로 대체될 영역
  useEffect(() => {
    // 더미 데이터 예시
    setReviewData([]); // 빈 상태
    setOrderData([
      {
        id: 1,
        title: "독천낙지",
        date: "2025-03-05",
        image: "/images/order1.jpg",
      },
      {
        id: 2,
        title: "돈카츠마켈 정발...",
        date: "2025-03-02",
        image: "/images/order2.jpg",
      },
      {
        id: 3,
        title: "BBQ 도안가수원점",
        date: "2021-05-21",
        image: "/images/order3.jpg",
      },
    ]);
    setFavoriteData([]); // 빈 상태
  }, []);

  return {
    reviewData,
    orderData,
    favoriteData,
  };
}