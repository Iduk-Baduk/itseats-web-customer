import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { couponAPI } from "../../services/couponAPI";
import Header from "../../components/common/Header";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import styles from "./MyCoupons.module.css";

export default function MyCoupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await couponAPI.getCoupons();
        setCoupons(response.myCouponDtos || []);
      } catch (err) {
        setError(err.message || "쿠폰 정보를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const formatDiscount = (discountValue) => {
    return discountValue < 100
      ? `${discountValue}% 할인`
      : `${discountValue.toLocaleString()}원 할인`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <LoadingSpinner message="쿠폰 정보를 불러오는 중..." />;
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        icon="❌"
        title="에러 발생"
        description={error}
        actionText="다시 시도"
        onAction={() => window.location.reload()}
      />
    );
  }

  if (coupons.length === 0) {
    return (
      <EmptyState
        variant="default"
        icon="🎫"
        title="발급받은 쿠폰이 없습니다"
        description="나중에 다시 확인해주세요"
        actionText="홈으로 가기"
        onAction={() => navigate("/")}
      />
    );
  }

  return (
    <div className={styles.container}>
      <Header title="내 쿠폰" leftIcon="back" leftButtonAction={() => navigate(-1)} />
      {coupons.map((coupon) => (
        <div key={coupon.couponId || `${coupon.discountValue}-${coupon.validDate}`} className={styles.couponCard}>
          <div className={styles.left}>
            <div className={styles.discount}>{formatDiscount(coupon.discountValue)}</div>
            <div className={styles.category}>배달</div>
            <div className={styles.name}>{coupon.name || "쿠폰 이름 없음"}</div>
            <div className={styles.minOrder}>
              {coupon.minPrice.toLocaleString()}원 이상 주문 시
            </div>
            <div className={styles.validDate}>
              {formatDate(coupon.validDate)}까지 사용 가능
            </div>
          </div>
          <div className={styles.right}>
            {coupon.storeId ? (
              <button
                className={styles.storeButton}
                onClick={() => navigate(`/stores/${coupon.storeId}`)}
              >
                → 적용 가능 매장 보기
              </button>
            ) : (
              <span className={styles.noStore}>적용 가능 매장 없음</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
