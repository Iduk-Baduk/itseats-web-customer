import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import OrderCard from "../../components/orders/OrderCard";
import OrderSearch from "../../components/orders/OrderSearch";
import OrderTab from "../../components/orders/OrderTab";
import { selectActiveOrders, selectCompletedOrders } from "../../store/orderSlice";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import styles from "./Order.module.css";

export default function Order() {
  const navigate = useNavigate();

  // Redux에서 주문 데이터 가져오기
  const activeOrders = useSelector(selectActiveOrders);
  const completedOrders = useSelector(selectCompletedOrders);
  const isLoading = useSelector(state => state.order?.loading || false);

  const handleWriteReview = () => {
    navigate("/review"); // Review 페이지로 이동
  };

  const [selectedTab, setSelectedTab] = React.useState("past"); // "past" or "preparing"

  // Redux 주문 데이터를 OrderCard 형식으로 변환
  const transformOrderForCard = (order) => {
    return {
      ...order,
      // OrderCard 호환성을 위한 필드 매핑
      price: order.orderPrice || order.price || 0,
      date: order.createdAt ? new Date(order.createdAt).toLocaleString('ko-KR') : order.date,
      isCompleted: ['DELIVERED', 'COMPLETED'].includes(order.status),
      showReviewButton: ['DELIVERED', 'COMPLETED'].includes(order.status),
      rating: order.rating || 5,
    };
  };

  // Redux 데이터 변환
  const displayCompletedOrders = completedOrders.map(transformOrderForCard);
  const displayActiveOrders = activeOrders.map(transformOrderForCard);

  // 로딩 상태
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
              onWriteReview={handleWriteReview}
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
