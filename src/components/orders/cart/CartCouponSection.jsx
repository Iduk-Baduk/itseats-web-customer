import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectNormalizedCoupons } from '../../../store/couponSlice';
import { calculateMultipleCouponsDiscount } from '../../../utils/couponUtils';
import calculateCartTotal from '../../../utils/calculateCartTotal';
import styles from '../../../pages/orders/Cart.module.css';

export default function CartCouponSection() {
  const navigate = useNavigate();

  // Redux에서 데이터 가져오기
  const orderMenus = useSelector(state => state.cart.orderMenus);
  const currentStore = useSelector(state => state.store.currentStore);
  const coupons = useSelector(selectNormalizedCoupons);
  const selectedCouponIds = useSelector(state => state.coupon.selectedCouponIds);
  
  // 주문 금액 및 배달비 계산
  const orderPrice = orderMenus.reduce((sum, menu) => sum + calculateCartTotal(menu), 0);
  const deliveryFee = currentStore?.deliveryFee || 0;
  
  // 적용된 쿠폰 목록 계산
  const appliedCoupons = coupons.filter(c => selectedCouponIds.includes(c.id));
  
  // 다중 쿠폰 할인 금액 계산
  const discountResult = calculateMultipleCouponsDiscount(appliedCoupons, orderPrice, deliveryFee);

  return (
    <section className={styles.section}>
      {/* 쿠폰 헤더 */}
      <div
        className={styles.couponHeader}
        onClick={() => navigate('/coupons', { state: { from: 'cart' } })}
      >
        <span className={styles.couponIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.59 13.41c-.36-.36-.59-.86-.59-1.41s.23-1.05.59-1.41c.36-.36.59-.86.59-1.41V7c0-1.1-.9-2-2-2h-2.17c-.55 0-1.05-.23-1.41-.59-.36-.36-.86-.59-1.41-.59s-1.05.23-1.41.59c-.36.36-.86.59-1.41.59H7c-1.1 0-2 .9-2 2v2.17c0 .55-.23 1.05-.59 1.41-.36.36-.59.86-.59 1.41s.23 1.05.59 1.41c.36.36.59.86.59 1.41V17c0 1.1.9 2 2 2h2.17c.55 0 1.05.23 1.41.59.36.36.86.59 1.41.59s1.05-.23 1.41-.59c.36-.36.86-.59 1.41-.59H17c1.1 0 2-.9 2-2v-2.17c0-.55.23-1.05.59-1.41zM12 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
          </svg>
          쿠폰
        </span>
        <span className={styles.couponCount}>
          {appliedCoupons.length > 0 ? `${appliedCoupons.length}개 적용됨` : `${coupons.length}개 보유`} &gt;
        </span>
      </div>
      
      {/* 적용된 쿠폰 정보 */}
      {appliedCoupons.length > 0 ? (
        <div className={styles.appliedCouponInfo}>
          {appliedCoupons.map((coupon, index) => (
            <div key={coupon.id} className={styles.appliedCouponItem}>
              <span className={styles.couponName}>
                {coupon.name}
              </span>
              <span className={styles.couponDiscount}>
                -{calculateMultipleCouponsDiscount([coupon], orderPrice, deliveryFee).totalDiscount.toLocaleString()}원
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noCouponApplied}>
          쿠폰을 선택하세요
        </div>
      )}
    </section>
  );
}
