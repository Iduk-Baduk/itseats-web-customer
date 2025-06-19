import { useState, useEffect } from "react";

export default function useCoupons() {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    setCoupons([
      {
        id: 1,
        storeId: 1,
        salePrice: 2000,
        storeName: "스타벅스 강남점",
        validDate: "2025/09/07",
        deliveryType: "배달", // ✅ 추가
      },
      {
        id: 2,
        storeId: 1,
        salePrice: 3000,
        storeName: "스타벅스 강남점",
        validDate: "2025/12/31",
        deliveryType: "픽업", // ✅ 추가
      },
    ]);
  }, []);

  return { coupons };
}
