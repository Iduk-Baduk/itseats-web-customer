import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectNormalizedCoupons } from '../../../store/couponSlice';
import styles from '../../../pages/orders/Cart.module.css';

export default function CartCouponSection() {
  const navigate = useNavigate();
  const coupons = useSelector(selectNormalizedCoupons);
  
  // Cart.jsx와 일관성을 위해 selectedCouponIds 사용
  const selectedCouponIds = useSelector(state => state.coupon.selectedCouponIds);
  const appliedCoupons = coupons.filter(c => selectedCouponIds.includes(c.id));
  
  // 전체 coupon 상태 디버깅
  const couponState = useSelector(state => state.coupon);
  
  // 디버깅을 위한 콘솔 로그 (조건부 - 쿠폰 선택 상태 변경 시만)
  React.useEffect(() => {
    if (selectedCouponIds.length > 0 || appliedCoupons.length > 0) {
      console.log('🎫 CartCouponSection 쿠폰 상태 변경:', {
        selectedCouponIds,
        appliedCouponsCount: appliedCoupons.length,
        appliedCoupons: appliedCoupons.map(c => ({ id: c.id, name: c.name, discount: c.discount }))
      });
    }
  }, [selectedCouponIds.length, appliedCoupons.length]);

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
        {appliedCoupons.length > 0 ? (
          appliedCoupons.length === 1 ? (
            <>
              {appliedCoupons[0].name}
              <span className={styles.discountAmount}>- {appliedCoupons[0].discount.toLocaleString()}원</span>
            </>
          ) : (
            <>
              {appliedCoupons.length}개 쿠폰 적용
              <span className={styles.discountAmount}>
                - {appliedCoupons.reduce((sum, c) => sum + c.discount, 0).toLocaleString()}원
              </span>
            </>
          )
        ) : (
          <span className={styles.noCoupon}>쿠폰을 선택하세요</span>
        )}
      </div>
    </section>
  );
}
