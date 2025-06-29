import React from 'react';
import styles from '../../../pages/orders/Cart.module.css';

export default function CartPaymentSummarySection({ cartInfo, selectedPaymentType, coupayAmount }) {
  if (!cartInfo) return null;

  // 쿠페이머니 사용 금액 계산 (할인 적용 후 총 결제금액에 맞춰 조정)
  const usedCoupayAmount = selectedPaymentType === 'coupay' 
    ? Math.min(coupayAmount || 0, cartInfo.totalPrice) 
    : 0;
  
  // 쿠페이머니 사용 후 남은 결제 금액
  const remainingAmount = Math.max(0, cartInfo.totalPrice - usedCoupayAmount);

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
        {usedCoupayAmount > 0 && (
          <div className={`${styles.paymentRow} ${styles.coupayRow}`}>
            <span>쿠페이머니 사용</span>
            <span>- {usedCoupayAmount.toLocaleString()}원</span>
          </div>
        )}
        <div className={styles.totalCost}>
          <span>총 결제금액</span>
          <span>{cartInfo.totalPrice.toLocaleString()}원</span>
        </div>
        {usedCoupayAmount > 0 && remainingAmount > 0 && (
          <div className={styles.remainingAmount}>
            <span>추가 결제 필요</span>
            <span>{remainingAmount.toLocaleString()}원</span>
          </div>
        )}
      </div>
    </section>
  );
} 
