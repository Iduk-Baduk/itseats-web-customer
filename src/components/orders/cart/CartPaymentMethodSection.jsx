import React from 'react';
import styles from '../../../pages/orders/Cart.module.css';

export default function CartPaymentMethodSection({ cartInfo = { totalPrice: 0, itemCount: 0, couponDiscount: 0 } }) {
  return (
    <section className={styles.section}>
      <div className={styles.paymentContainer}>
        {/* 결제수단 제목 */}
        <div className={styles.sectionTitle}>
          <h3>결제수단</h3>
          <p>토스페이먼츠로 안전하게 결제하세요</p>
        </div>
        
        {/* 결제수단 정보 표시 */}
        <div className={styles.tossContainer}>
          {/* 쿠폰 할인 정보 표시 */}
          {cartInfo.couponDiscount > 0 && (
            <div className={styles.tossDiscountInfo}>
              <span>쿠폰 할인: -{cartInfo.couponDiscount.toLocaleString()}원</span>
            </div>
          )}
          
          {/* 토스페이먼츠 정보 카드 */}
          <div className={styles.paymentMethodCard}>
            <div className={styles.paymentMethodInfo}>
              <div className={styles.paymentMethodIcon}>
                <img 
                  src="/icons/logos/toss.png" 
                  alt="토스페이먼츠" 
                  className={styles.paymentIcon}
                />
              </div>
              <div className={styles.paymentMethodDetails}>
                <h4>토스페이먼츠</h4>
                <p>신용카드, 계좌이체, 간편결제</p>
              </div>
            </div>
            <div className={styles.paymentMethodStatus}>
              <span className={styles.selectedBadge}>선택됨</span>
            </div>
          </div>
          
          {/* 결제 안내 메시지 */}
          <div className={styles.paymentNotice}>
            <p>• 신용카드, 계좌이체, 간편결제 등 다양한 결제수단을 이용할 수 있습니다</p>
            <p>• 결제는 토스페이먼츠의 보안 시스템을 통해 안전하게 처리됩니다</p>
          </div>
        </div>
      </div>
    </section>
  );
}
