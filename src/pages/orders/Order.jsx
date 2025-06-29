import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import OrderCard from "../../components/orders/OrderCard";
import OrderSearch from "../../components/orders/OrderSearch";
import OrderTab from "../../components/orders/OrderTab";
import { selectActiveOrders, selectCompletedOrders, selectAllOrders, updateOrderStatus } from "../../store/orderSlice";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { orderAPI } from "../../services/orderAPI";
import { logger } from "../../utils/logger";
import { useMultipleOrderTracking } from "../../hooks/useOrderTracking";
import styles from "./Order.module.css";

export default function Order() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [selectedTab, setSelectedTab] = React.useState("past");

  // Redux에서 주문 데이터 가져오기
  const allOrders = useSelector(selectAllOrders);
  const activeOrders = useSelector(selectActiveOrders);
  const completedOrders = useSelector(selectCompletedOrders);
  const isLoading = useSelector(state => state.order?.loading || false);

  // 활성 주문들의 ID 배열
  const activeOrderIds = activeOrders.map(order => order.id);

  // 여러 주문 동시 추적
  useMultipleOrderTracking(activeOrderIds, {
    pollingInterval: 5000, // 5초마다 폴링
    onStatusChange: (change) => {
      logger.log(`🔄 주문 상태 변경 감지 - 주문 ID: ${change.orderId}, 이전 상태: ${change.previousStatus}, 현재 상태: ${change.currentStatus}`);
    }
  });

  // 주문 상태 업데이트 핸들러
  const handleStatusChange = useCallback((orderId, currentStatus) => {
    logger.log(`🔄 주문 상태 업데이트 - 주문 ID: ${orderId}, 상태: ${currentStatus}`);
    dispatch(updateOrderStatus({ 
      orderId, 
      status: currentStatus,
      message: `주문 상태가 ${currentStatus}로 변경되었습니다.`
    }));
  }, [dispatch]);

  const handleWriteReview = useCallback((order) => {
    navigate(`/orders/${order.id}/review`);
  }, [navigate]);

  const handleReorder = useCallback((order) => {
    if (order.storeId) {
      navigate(`/stores/${order.storeId}`);
    } else {
      logger.warn('주문에서 매장 ID를 찾을 수 없습니다:', order);
      const foundStore = allOrders.find(o => o.storeName === order.storeName);
      if (foundStore && foundStore.storeId) {
        navigate(`/stores/${foundStore.storeId}`);
      } else {
        navigate('/');
      }
    }
  }, [navigate, allOrders]);

  // Redux 주문 데이터를 OrderCard 형식으로 변환
  const transformOrderForCard = useCallback((order) => {
    return {
      ...order,
      price: order.orderPrice || order.price || 0,
      date: order.createdAt ? new Date(order.createdAt).toLocaleString('ko-KR') : order.date,
      isCompleted: ['DELIVERED', 'COMPLETED'].includes(order.status),
      showReviewButton: ['DELIVERED', 'COMPLETED'].includes(order.status),
      rating: order.rating || 5,
    };
  }, []);

  // Redux 데이터 변환
  const displayCompletedOrders = completedOrders.map(transformOrderForCard);
  const displayActiveOrders = activeOrders.map(transformOrderForCard);

  if (isLoading) {
    return (
      <div>
        <OrderTab onTabChange={setSelectedTab} />
        <LoadingSpinner 
          message="주문 정보를 불러오는 중..." 
          pageLoading
        />
      </div>
    );
  }

  return (
    <div>
      <OrderTab onTabChange={setSelectedTab} />
      <OrderSearch className={styles.orderSearch} />
      
      {selectedTab === "past" && (
        displayCompletedOrders.length > 0 ? (
          displayCompletedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              className={styles.orderCard}
              onWriteReview={() => handleWriteReview(order)}
              onReorder={() => handleReorder(order)}
            />
          ))
        ) : (
          <EmptyState
            variant="order"
            title="아직 완료된 주문이 없습니다"
            description="첫 주문을 시작해보세요"
            actionText="주문하러 가기"
            onAction={() => navigate('/')}
          />
        )
      )}
      
      {selectedTab === "preparing" && (
        displayActiveOrders.length > 0 ? (
          displayActiveOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              className={styles.orderCard}
              onOpenStatus={() => navigate(`/orders/${order.id}/status`)}
            />
          ))
        ) : (
          <EmptyState
            variant="order"
            title="진행 중인 주문이 없습니다"
            description="새로운 주문을 시작해보세요"
            actionText="주문하러 가기"
            onAction={() => navigate('/')}
          />
        )
      )}
    </div>
  );
}
