import React from 'react';
import styles from '../../../pages/orders/Cart.module.css';

export default function CartPaymentSummarySection({ cartInfo }) {
  if (!cartInfo) return null;
  return (
    <section className={styles.section}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>결제금액</div>
      <div className={styles.paymentDetails}>
        <div className={styles.paymentRow}>
          <span>주문금액</span>
          <span>{cartInfo.orderPrice.toLocaleString()}원</span>
        </div>
        <div className={styles.paymentRow}>
          <span>배달비</span>
          <span>{cartInfo.deliveryFee === 0 ? '무료' : `+${cartInfo.deliveryFee.toLocaleString()}원`}</span>
        </div>
        {/* 할인/쿠폰 등은 추후 추가 */}
        <div className={styles.totalCost}>
          <span>총 결제금액</span>
          <span>{cartInfo.totalPrice.toLocaleString()}원</span>
        </div>
      </div>
    </section>
  );
} 
