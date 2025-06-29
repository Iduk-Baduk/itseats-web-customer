import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessed, setIsProcessed] = useState(false); // 처리 완료 상태 추가

  // URL 파라미터에서 결제 정보 추출
  const paymentId = searchParams.get('paymentId');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

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
      // orderData 상태 업데이트
      if (orderData) {
        setOrderData(prev => ({
          ...prev,
          status: currentStatus
        }));
      }
    },
    pollingInterval: 5000 // 5초마다 갱신
  });

  useEffect(() => {
    // 이미 처리되었거나 필요한 파라미터가 없으면 스킵
    if (isProcessed || (!orderId && !paymentId)) {
      if (!orderId && !paymentId) {
        navigate('/', { replace: true });
      }
      return;
    }

    // 결제 성공 후 처리 로직 - 이미 생성된 주문 정보 조회
    const processPaymentSuccess = async () => {
      try {
        setIsLoading(true);
        setIsProcessed(true); // 처리 시작 플래그 설정

        // orderId 또는 paymentId로 이미 생성된 주문 찾기
        let existingOrder = null;
        if (orderId) {
          existingOrder = orders.find(order => 
            order.id === orderId || 
            order.orderId === orderId ||
            order.paymentId === paymentId
          );
        }
        
        // paymentId만 있는 경우도 체크
        if (!existingOrder && paymentId) {
          existingOrder = orders.find(order => order.paymentId === paymentId);
        }

        if (existingOrder) {
          // 이미 생성된 주문이 있으면 해당 정보 사용
          logger.log('✅ 기존 주문 정보 발견:', existingOrder);
          setOrderData(existingOrder);
        } else {
          // 주문 정보가 없으면 Redux에 주문 생성
          const parsedAmount = parseInt(amount) || 0;
          const newOrderId = orderId || generateOrderId();
          
          const newOrderData = {
            id: newOrderId,
            orderId: newOrderId,
            paymentId: paymentId || generatePaymentId(),
            storeName: currentStore?.storeName || "매장",
            storeId: currentStore?.storeId || 1,
            items: cartItems || [],
            totalPrice: parsedAmount,
            deliveryAddress: typeof selectedAddress === 'string' 
              ? selectedAddress 
              : selectedAddress?.address || "배송 주소",
            status: 'WAITING',
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
          
          // Redux에 주문 추가
          dispatch(addOrder(newOrderData));
          setOrderData(newOrderData);
        }

        // 주문 완료 페이지 표시 후 장바구니 비우기 (UX 개선)
        setTimeout(() => {
          dispatch(clearCart());
          logger.log('🛒 장바구니 비움 완료 (결제 성공 후)');
        }, 1000); // 1초 후 장바구니 비움

        // 로딩 완료
        setIsLoading(false);
      } catch (error) {
        console.error('결제 성공 처리 중 오류:', error);
        setIsLoading(false);
        
        // 에러 발생 시 홈으로 이동
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    };

    processPaymentSuccess();
  }, [orderId, paymentId, amount, selectedAddress, navigate, dispatch, currentStore, isProcessed]);

  const handleGoToOrderStatus = () => {
    if (!orderData?.id) {
      console.error('주문 데이터가 없습니다.');
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
          <OrderProgress orderStatus={orderData.status} />
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
