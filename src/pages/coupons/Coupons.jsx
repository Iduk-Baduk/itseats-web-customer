import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { couponAPI } from "../../services/couponAPI";
import CouponBanner from "../../components/common/CouponBanner";
import Header from "../../components/common/Header";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import styles from "./Coupons.module.css";

export default function Coupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCouponData = async () => {
      try {
        setLoading(true);
        const response = await couponAPI.getAllCoupons();
        console.log("전체 쿠폰 데이터:", response);
        setCoupons(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error("전체 쿠폰 데이터 fetch 에러:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCouponData();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <Header title="할인쿠폰" leftIcon="back" leftButtonAction={() => navigate(-1)} />
        <LoadingSpinner message="쿠폰 정보를 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Header title="할인쿠폰" leftIcon="back" leftButtonAction={() => navigate(-1)} />
        <EmptyState
          variant="error"
          icon="❌"
          title="쿠폰 정보를 불러올 수 없습니다"
          description="잠시 후 다시 시도해주세요"
          actionText="다시 시도"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className={styles.container}>
        <Header title="할인쿠폰" leftIcon="back" leftButtonAction={() => navigate(-1)} />
        <EmptyState
          variant="default"
          icon="🎫"
          title="발급 가능한 쿠폰이 없습니다"
          description="나중에 다시 확인해주세요"
          actionText="홈으로 가기"
          onAction={() => navigate("/")}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header title="할인쿠폰" leftIcon="back" leftButtonAction={() => navigate(-1)} />
      <div className={styles.couponContainer}>
        {coupons.map((coupon) => (
          <CouponBanner
            key={coupon.couponId}
            couponId={coupon.couponId}
            discountValue={coupon.discountValue}
            title={coupon.name}
            minPrice={coupon.minPrice}
            isIssued={coupon.issued} // ✅ issued 값 전달
          />
        ))}
      </div>
    </div>
  );
}
