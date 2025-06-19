import { useState, useEffect } from "react";

export default function useCoupons() {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    // 더미 예시 – 실제 API 연동 시 fetch/axios로 대체
    setCoupons([
      { id: 1, storeId: 1, salePrice: 3000 },
      { id: 2, storeId: 2, salePrice: 5000 },
    ]);
  }, []);

  return { coupons };
}
