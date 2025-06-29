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

  // 주문 상태 업데이트 핸들러
  const handleStatusChange = useCallback((orderId, currentStatus) => {
    if (process.env.NODE_ENV === 'development') {
      logger.log(`🔄 주문 상태 업데이트 - 주문 ID: ${orderId}, 상태: ${currentStatus}`);
    }
    dispatch(updateOrderStatus({ 
      orderId, 
      status: currentStatus,
      message: `주문 상태가 ${currentStatus}로 변경되었습니다.`
    }));
  }, [dispatch]);

  // 활성 주문들에 대한 상태 추적
  useEffect(() => {
    if (!activeOrders.length) return;

    const intervals = {};
    const orderIds = {}; // 주문 ID를 저장할 객체

    // 각 활성 주문에 대한 폴링 설정
    activeOrders.forEach(order => {
      const orderId = order.id; // 주문 ID를 저장
      orderIds[orderId] = true;

      const pollOrderStatus = async () => {
        try {
          const response = await orderAPI.trackOrder(orderId);
          const updatedOrder = response.data;
          
          // 상태가 변경되었거나 마지막 체크 시간이 다른 경우 업데이트
          if (updatedOrder && (
            updatedOrder.status !== order.status || 
            updatedOrder.lastChecked !== order.lastChecked
          )) {
            handleStatusChange(orderId, updatedOrder.status);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            logger.error(`주문 상태 추적 실패 (${orderId}):`, error);
          }
        }
      };

      // 초기 상태 확인
      pollOrderStatus();

      // 5초마다 상태 확인
      intervals[orderId] = setInterval(pollOrderStatus, 5000);
    });

    // 클린업: 모든 인터벌 제거
    return () => {
      Object.entries(intervals).forEach(([orderId, interval]) => {
        clearInterval(interval);
        if (process.env.NODE_ENV === 'development') {
          logger.log(`⏹️ 주문 ${orderId} 추적 중단`);
        }
      });
    };
  }, [activeOrders, handleStatusChange]);

  // 디버깅을 위한 로그
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.log('📊 주문 목록 업데이트:', {
        전체: allOrders.length,
        진행중: activeOrders.length,
        완료: completedOrders.length,
        주문목록: allOrders.map(order => ({
          id: order.id,
          storeName: order.storeName,
          status: order.status
        }))
      });
    }
  }, [allOrders, activeOrders, completedOrders]);

  const handleWriteReview = useCallback((order) => {
    navigate(`/orders/${order.id}/review`);
  }, [navigate]);

  const handleReorder = useCallback((order) => {
    if (order.storeId) {
      navigate(`/stores/${order.storeId}`);
    } else {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('주문에서 매장 ID를 찾을 수 없습니다:', order);
      }
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
