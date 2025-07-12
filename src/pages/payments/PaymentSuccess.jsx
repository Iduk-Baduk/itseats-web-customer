import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../../components/common/Header';
import Button from '../../components/common/basic/Button';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OrderProgress from '../../components/orders/OrderProgress';
import { clearCart } from '../../store/cartSlice';
import { addOrder, selectAllOrders } from '../../store/orderSlice';
import { generateOrderId, generatePaymentId } from '../../utils/idUtils';
import { logger } from '../../utils/logger';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import styles from './PaymentSuccess.module.css';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessed, setIsProcessed] = useState(false);

  // sessionStorage에서 결제 정보 가져오기
  const paymentResult = (() => {
    try {
      const data = sessionStorage.getItem('paymentResult');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('결제 정보 파싱 오류:', error);
      return null;
    }
  })();

  // Redux에서 장바구니 및 주문 정보 가져오기
  const cartItems = useSelector(state => state.cart.orderMenus);
  const currentStore = useSelector(state => state.cart.currentStore);
  const orders = useSelector(selectAllOrders);
  const selectedAddress = useSelector(state => 
    state.address.addresses.find(addr => addr.id === state.address.selectedAddressId)
  );

  // 실시간 주문 상태 추적
  const { startTracking } = useOrderTracking(orderData?.id, {
    autoStart: true,
    onStatusChange: ({ currentStatus }) => {
      logger.log(`🔄 주문 상태 업데이트: ${currentStatus}`);
      if (orderData) {
        setOrderData(prev => ({
          ...prev,
          orderStatus: currentStatus
        }));
      }
    },
    pollingInterval: 5000
  });

  useEffect(() => {
    // 이미 처리되었거나 결제 정보가 없으면 스킵
    if (isProcessed || !paymentResult) {
      if (!paymentResult) {
        navigate('/', { replace: true });
      }
      return;
    }

    // 결제 성공 후 처리 로직
    const processPaymentSuccess = async () => {
      try {
        setIsLoading(true);
        setIsProcessed(true);

        // 이미 생성된 주문 찾기
        let existingOrder = orders.find(order => 
          order.id === paymentResult.orderId || 
          order.orderId === paymentResult.orderId ||
          order.paymentId === paymentResult.paymentKey
        );

        if (existingOrder) {
          logger.log('✅ 기존 주문 정보 발견:', existingOrder);
          setOrderData(existingOrder);
        } else {
          // 새 주문 생성
          const newOrderData = {
            id: paymentResult.orderId,
            orderId: paymentResult.orderId,
            paymentId: paymentResult.paymentKey,
            storeName: currentStore?.storeName || "매장",
            storeId: currentStore?.storeId || 1,
            items: cartItems || [],
            totalPrice: paymentResult.amount,
            deliveryAddress: typeof selectedAddress === 'string' 
              ? selectedAddress 
              : selectedAddress?.address || "배송 주소",
            orderStatus: 'WAITING',
            statusMessage: '주문이 접수되었습니다.',
            createdAt: new Date().toISOString(),
            estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            storeImage: currentStore?.storeImage || "/samples/food1.jpg",
            menuSummary: cartItems?.map(item => item.menuName).join(", ") || "주문 메뉴",
            paymentMethod: "card",
            deliveryFee: 2500,
            isCompleted: false,
            showReviewButton: false
          };
          
          logger.log('📦 PaymentSuccess에서 새 주문 생성:', newOrderData);
          dispatch(addOrder(newOrderData));
          setOrderData(newOrderData);
        }

        // 주문 완료 후 결제 정보 정리
        sessionStorage.removeItem('paymentResult');

        // 장바구니 비우기 (UX 개선)
        setTimeout(() => {
          dispatch(clearCart());
          logger.log('🛒 장바구니 비움 완료 (결제 성공 후)');
        }, 1000);

        setIsLoading(false);
      } catch (error) {
        logger.error('결제 성공 처리 중 오류:', error);
        setIsLoading(false);
        
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    };

    processPaymentSuccess();
  }, [paymentResult, selectedAddress, navigate, dispatch, currentStore, isProcessed, cartItems, orders]);

  const handleGoToOrderStatus = () => {
    if (!orderData?.id) {
      logger.error('주문 데이터가 없습니다.');
      return;
    }
    navigate(`/orders/${orderData.id}/status`);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToOrders = () => {
    navigate('/orders');
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Header title="결제 처리 중" />
        <div className={styles.loadingContainer}>
          <LoadingSpinner 
            message="결제를 완료하는 중입니다..." 
            size="large" 
          />
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className={styles.container}>
        <Header title="결제 오류" />
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>❌</div>
          <h2>결제 처리 중 오류가 발생했습니다</h2>
          <p>다시 시도해 주세요.</p>
          <Button 
            onClick={handleGoHome}
            variant="primary"
            size="large"
          >
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header 
        title="결제 완료" 
        leftButtonAction={handleGoHome}
      />
      
      <div className={styles.content}>
        {/* 성공 아이콘 및 메시지 */}
        <div className={styles.successSection}>
          <div className={styles.successIcon}>✅</div>
          <h1 className={styles.successTitle}>결제가 완료되었습니다!</h1>
          <p className={styles.successMessage}>
            주문이 성공적으로 접수되었습니다.<br />
            매장에서 조리를 시작할 예정입니다.
          </p>
        </div>

        {/* 주문 진행 상태 */}
        <div className={styles.progressSection}>
          <OrderProgress orderStatus={orderData.orderStatus} />
        </div>

        {/* 주문 정보 카드 */}
        <Card className={styles.orderInfoCard}>
          <div className={styles.cardHeader}>
            <h3>주문 정보</h3>
            <span className={styles.orderNumber}>주문번호: {orderData.orderId}</span>
          </div>
          <div className={styles.orderDetails}>
            <div className={styles.detailRow}>
              <span>매장</span>
              <strong>{orderData.storeName}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>주문 시간</span>
              <strong>{new Date(orderData.createdAt).toLocaleString()}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>결제 금액</span>
              <strong>{orderData.totalPrice?.toLocaleString()}원</strong>
            </div>
            <div className={styles.detailRow}>
              <span>배달 주소</span>
              <strong>{orderData.deliveryAddress}</strong>
            </div>
          </div>
        </Card>

        {/* 버튼 영역 */}
        <div className={styles.buttonGroup}>
          <Button 
            onClick={handleGoToOrderStatus}
            variant="primary"
            size="large"
            className={styles.statusButton}
          >
            주문 상태 확인
          </Button>
          <Button 
            onClick={handleGoHome}
            variant="line"
            size="large"
            className={styles.homeButton}
          >
            홈으로 가기
          </Button>
        </div>
      </div>
    </div>
  );
} 
