// src/components/orders/cart/CartCouponSection.jsx

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectNormalizedCoupons, removeCoupon } from '../../../store/couponSlice';
import { calculateMultipleCouponsDiscount } from '../../../utils/couponUtils';
import calculateCartTotal from '../../../utils/calculateCartTotal';
import styles from '../../../pages/orders/Cart.module.css';

export default function CartCouponSection() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const orderMenus = useSelector(state => state.cart.orderMenus);
  const currentStore = useSelector(state => state.store.currentStore);
  const coupons = useSelector(selectNormalizedCoupons);
  const selectedCouponIds = useSelector(state => state.coupon.selectedCouponIds);

  const couponsArray = Array.isArray(coupons) ? coupons : [];
  const selectedCouponIdsArray = Array.isArray(selectedCouponIds) ? selectedCouponIds : [];

  const orderPrice = orderMenus.reduce((sum, menu) => sum + calculateCartTotal(menu), 0);
  const deliveryFee = currentStore?.deliveryFee || 0;

  const appliedCoupons = couponsArray.filter(c => selectedCouponIdsArray.includes(c.id));
  const discountResult = calculateMultipleCouponsDiscount(appliedCoupons, orderPrice, deliveryFee);

  const handleDeselect = (couponId) => {
    dispatch(removeCoupon({ couponId }));
  };

  return (
    <section className={styles.section}>
      <div
        className={styles.couponHeader}
        onClick={() => navigate('/coupons/cart', { state: { from: 'cart' } })}
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

      {appliedCoupons.length > 0 ? (
        <div className={styles.appliedCouponInfo}>
          {appliedCoupons.map((coupon) => (
            <div key={coupon.id} className={styles.appliedCouponItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className={styles.couponName}>{coupon.name}</span>
                <span className={styles.couponDiscount}>
                  -{calculateMultipleCouponsDiscount([coupon], orderPrice, deliveryFee).totalDiscount.toLocaleString()}원
                </span>
              </div>
              <button
                onClick={() => handleDeselect(coupon.id)}
                className={styles.deselectButton}
              >
                ✕ 해제
              </button>
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
