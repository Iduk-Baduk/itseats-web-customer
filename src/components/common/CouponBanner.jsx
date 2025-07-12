import React, { useState } from "react";
import { couponAPI } from "../../services/couponAPI";
import styles from "./CouponBanner.module.css";

const CouponBanner = ({ couponId, discountValue, title, minPrice, isIssued }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [issued, setIssued] = useState(isIssued); // ✅ 상태로 관리

  const handleIssueCoupon = async () => {
    if (issued) return; // 이미 발급된 경우 막기

    try {
      setIsLoading(true);
      await couponAPI.issueCoupon(couponId);
      alert("쿠폰이 발급되었습니다!");
      setIssued(true); // ✅ 버튼 상태 변경
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.couponContainer}>
      <div className={styles.couponInfo}>
        <div className={styles.discountAmount}>
          {discountValue >= 10 && discountValue <= 99
            ? `${discountValue}% 할인`
            : `${discountValue.toLocaleString()}원 할인`}
        </div>
        <div className={styles.couponTitle}>{title}</div>
        <div className={styles.minOrderPrice}>
          {minPrice.toLocaleString()}원 이상 주문 시
        </div>
      </div>
      <button
        className={`${styles.issueButton} ${issued ? styles.disabledButton : ""}`}
        onClick={handleIssueCoupon}
        disabled={issued || isLoading}
      >
        <span className={styles.buttonIcon}>↓</span>
        <span className={styles.buttonText}>
          {issued ? "발급 완료" : isLoading ? "발급 중..." : "쿠폰받기"}
        </span>
      </button>
    </div>
  );
};

export default CouponBanner;
