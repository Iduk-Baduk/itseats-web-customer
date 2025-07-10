import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import styles from '../../../pages/orders/Cart.module.css';
import { TossPaymentWidget } from '../../payment/TossPaymentWidget';
import { logger } from '../../../utils/logger';

export default function CartPaymentMethodSection({ cartInfo = { totalPrice: 0 }, onPaymentRequest }) {
  const navigate = useNavigate();
  const tossWidgetRef = useRef(null);
  
  // 고객 정보 가져오기 (실제로는 로그인된 사용자 정보를 사용해야 함)
  const customerInfo = useSelector(state => state.user?.currentUser) || {
    email: "test@example.com",
    name: "테스트사용자",
    phone: "01000000000"
  };

  // 결제 요청 함수
  const handlePaymentRequest = async () => {
    if (tossWidgetRef.current && tossWidgetRef.current.isReady) {
      try {
        await tossWidgetRef.current.requestPayment();
      } catch (error) {
        logger.error('결제 요청 실패:', error);
      }
    } else {
      logger.warn('토스페이먼츠 위젯이 준비되지 않았습니다.');
    }
  };

  // 외부에서 결제 요청할 수 있도록 콜백 전달
  React.useEffect(() => {
    if (onPaymentRequest) {
      onPaymentRequest(handlePaymentRequest);
    }
  }, [onPaymentRequest]);

  return (
    <section className={styles.section}>
      <div className={styles.paymentContainer}>
        {/* 결제수단 헤더 */}
        <div className={styles.paymentHeader}>
          <h3 className={styles.paymentTitle}>결제수단</h3>
          <div className={styles.paymentDescription}>
            토스페이먼츠로 안전하게 결제하세요
          </div>
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
            ref={tossWidgetRef}
            amount={{
              currency: "KRW",
              value: cartInfo.totalPrice || 0,
            }}
            orderId={uuidv4()}
            orderName={`${cartInfo.itemCount}개 메뉴`}
            customerEmail={customerInfo.email}
            customerName={customerInfo.name}
            customerMobilePhone={customerInfo.phone}
            onPaymentSuccess={(result) => {
              logger.log('토스페이먼츠 결제 성공:', result);
              // 결제 성공 시 처리 로직
              navigate(`/payments/toss-success?paymentKey=${result.paymentKey}&orderId=${result.orderId}&amount=${result.amount}`);
            }}
            onPaymentError={(error) => {
              logger.error('토스페이먼츠 결제 실패:', error);
              // 결제 실패 시 처리 로직
              navigate(`/payments/failure?code=${error.code}&message=${encodeURIComponent(error.message)}`);
            }}
          />
        </div>
      </div>
    </section>
  );
}
