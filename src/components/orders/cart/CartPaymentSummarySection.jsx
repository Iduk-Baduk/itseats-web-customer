import React from 'react';
import styles from '../../../pages/orders/Cart.module.css';

export default function CartPaymentSummarySection({ cartInfo }) {
  if (!cartInfo) return null;

  return (
    <section className={styles.section}>
      <div className={styles.paymentSectionTitle}>결제금액</div>
      <div className={styles.paymentDetails}>
        <div className={styles.paymentRow}>
          <span>주문금액</span>
          <span>{cartInfo.orderPrice.toLocaleString()}원</span>
        </div>
        <div className={styles.paymentRow}>
          <span>배달비</span>
          <span>{cartInfo.deliveryFee === 0 ? '무료' : `+${cartInfo.deliveryFee.toLocaleString()}원`}</span>
        </div>
        {cartInfo.couponDiscount > 0 && (
          <div className={`${styles.paymentRow} ${styles.discountRow}`}>
            <span>쿠폰 할인</span>
            <span>- {cartInfo.couponDiscount.toLocaleString()}원</span>
          </div>
        )}
        <div className={styles.totalCost}>
          <span>총 결제금액</span>
          <span>{cartInfo.totalPrice.toLocaleString()}원</span>
        </div>
      </div>
    </section>
  );
} 
