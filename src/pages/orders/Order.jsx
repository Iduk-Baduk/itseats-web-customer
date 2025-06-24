import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import OrderCard from "../../components/orders/OrderCard";
import OrderSearch from "../../components/orders/OrderSearch";
import OrderTab from "../../components/orders/OrderTab";
import { selectActiveOrders, selectCompletedOrders } from "../../store/orderSlice";
import styles from "./Order.module.css";

export default function Order() {
  const navigate = useNavigate();

  // Redux에서 주문 데이터 가져오기
  const activeOrders = useSelector(selectActiveOrders);
  const completedOrders = useSelector(selectCompletedOrders);

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

  // 더미 데이터 (Redux에 데이터가 없을 때 사용)
  const dummyCompletedOrders = [
    {
      id: 1,
      storeName: "부리부리브리또 구름톤점",
      date: "2024-05-28 오후 06:05",
      status: "배달 완료",
      rating: 5,
      menuSummary: "불고기 부리또 + 음료 + 감자튀김",
      price: 4500,
      storeImage: "https://source.unsplash.com/featured/?burrito",
      isCompleted: true,
      showReviewButton: true,
      remainingDays: undefined,
    },
    {
      id: 2,
      storeName: "PIZZA WAVE",
      date: "2024-05-25 오후 06:05",
      status: "배달 완료",
      rating: 4,
      menuSummary: "페퍼로니 피자 + 콜라",
      price: 12000,
      storeImage: "https://source.unsplash.com/featured/?pizza",
      isCompleted: true,
      showReviewButton: false,
      remainingDays: 6,
    },
  ];

  const dummyActiveOrders = [
    {
      id: 1,
      storeName: "북경깐풍기 구름톤점",
      date: "2024-06-20 오후 06:05",
      status: "배달 중",
      rating: 4,
      menuSummary: "북경깐풍기 2인 세트",
      price: 18000,
      storeImage: "/samples/food1.jpg",
      isCompleted: false,
      showReviewButton: true,
      remainingDays: undefined,
    },
  ];

  // Redux 데이터가 있으면 변환하여 사용, 없으면 더미 데이터 사용
  const displayCompletedOrders = completedOrders.length > 0 
    ? completedOrders.map(transformOrderForCard) 
    : dummyCompletedOrders;
  const displayActiveOrders = activeOrders.length > 0 
    ? activeOrders.map(transformOrderForCard) 
    : dummyActiveOrders;

  return (
    <div>
      <OrderTab onTabChange={setSelectedTab} />
      <OrderSearch className={styles.orderSearch} />
      {selectedTab === "past" &&
        displayCompletedOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            className={styles.orderCard}
            onWriteReview={handleWriteReview}
          />
        ))}
      {selectedTab === "preparing" &&
        displayActiveOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            className={styles.orderCard}
            onOpenStatus={() => navigate(`/orders/${order.id}/status`)}
          />
        ))}
    </div>
  );
}
