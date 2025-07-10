import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import styles from '../../../pages/orders/Cart.module.css';
import { TossPaymentWidget } from '../../payment/TossPaymentWidget';
import { logger } from '../../../utils/logger';
import useCurrentUser from '../../../hooks/useCurrentUser';

export default function CartPaymentMethodSection({ cartInfo = { totalPrice: 0, itemCount: 0, couponDiscount: 0 } }) {
  const navigate = useNavigate();
  const { user, loading, error } = useCurrentUser();
  
  // 로딩 중이거나 에러 발생 시 처리
  if (loading) {
    return <div className={styles.loading}>결제 정보를 불러오는 중...</div>;
  }

  if (error || !user) {
    logger.error('사용자 정보 로드 실패:', error);
    navigate('/login');
    return null;
  }

  // 주문 ID를 useMemo로 안정화 (중복 렌더링 방지)
  const orderId = useMemo(() => uuidv4(), []);

  return (
    <section className={styles.section}>
      <div className={styles.paymentContainer}>
        {/* 결제수단 제목 */}
        <div className={styles.sectionTitle}>
          <h3>결제수단</h3>
          <p>토스페이먼츠로 안전하게 결제하세요</p>
        </div>
        
        {/* 토스페이먼츠 결제위젯 */}
        <div className={styles.tossContainer}>
          {/* 쿠폰 할인 정보 표시 */}
          {cartInfo.couponDiscount > 0 && (
            <div className={styles.tossDiscountInfo}>
              <span>쿠폰 할인: -{cartInfo.couponDiscount.toLocaleString()}원</span>
            </div>
          )}
          
          <TossPaymentWidget
            amount={{
              currency: "KRW",
              value: cartInfo.totalPrice || 0,
            }}
            orderId={orderId}
            orderName={`${cartInfo.itemCount}개 메뉴`}
            customerEmail={user.email}
            customerName={user.name}
            customerMobilePhone={user.phone}
            onPaymentSuccess={(result) => {
              logger.log('토스페이먼츠 결제 성공:', result);
              // 민감한 결제 정보를 sessionStorage에 저장
              sessionStorage.setItem('paymentResult', JSON.stringify({
                paymentKey: result.paymentKey,
                orderId: result.orderId,
                amount: result.amount
              }));
              navigate('/payments/toss-success');
            }}
            onPaymentError={(error) => {
              logger.error('토스페이먼츠 결제 실패:', error);
              // 에러 코드와 메시지만 URL에 포함
              navigate(`/payments/failure?code=${error.code}&message=${encodeURIComponent(error.message)}`);
            }}
          />
        </div>
      </div>
    </section>
  );
}
