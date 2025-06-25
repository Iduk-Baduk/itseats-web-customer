import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectNormalizedCoupons } from '../../../store/couponSlice';
import styles from '../../../pages/orders/Cart.module.css';

export default function CartCouponSection() {
  const navigate = useNavigate();
  const coupons = useSelector(selectNormalizedCoupons);
  const selectedCouponId = useSelector(state => state.coupon.selectedCouponId);
  const appliedCoupon = coupons.find(c => c.id === selectedCouponId);

  return (
    <section className={styles.section}>
      {/* 상단 요약 */}
      <div
        className={styles.couponHeader}
        onClick={() => navigate('/coupons', { state: { from: 'cart' } })}
      >
        <span className={styles.couponIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#2196f3"><path d="M20.59 13.41c-.36-.36-.59-.86-.59-1.41s.23-1.05.59-1.41c.36-.36.59-.86.59-1.41V7c0-1.1-.9-2-2-2h-2.17c-.55 0-1.05-.23-1.41-.59-.36-.36-.86-.59-1.41-.59s-1.05.23-1.41.59c-.36.36-.86.59-1.41.59H7c-1.1 0-2 .9-2 2v2.17c0 .55-.23 1.05-.59 1.41-.36.36-.59.86-.59 1.41s.23 1.05.59 1.41c.36.36.59.86.59 1.41V17c0 1.1.9 2 2 2h2.17c.55 0 1.05.23 1.41.59.36.36.86.59 1.41.59s1.05-.23 1.41-.59c.36-.36.86-.59 1.41-.59H17c1.1 0 2-.9 2-2v-2.17c0-.55.23-1.05.59-1.41zM12 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>
          쿠폰
        </span>
        <span className={styles.couponCount}>
          {coupons.length}개 가능 &gt;
        </span>
      </div>
      {/* 적용된 쿠폰 요약 */}
      <div className={styles.appliedCoupon}>
        {appliedCoupon ? (
          <>
            {appliedCoupon.name}
            <span className={styles.discountAmount}>- {appliedCoupon.discount.toLocaleString()}원</span>
          </>
        ) : (
          <span className={styles.noCoupon}>쿠폰을 선택하세요</span>
        )}
      </div>
    </section>
  );
}
