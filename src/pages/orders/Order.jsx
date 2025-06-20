import React from "react";
import OrderCard from "../../components/orders/OrderCard";
import OrderSearch from "../../components/orders/OrderSearch";
import OrderTab from "../../components/orders/OrderTab";
import { useNavigate } from "react-router-dom";
import styles from "./Order.module.css";
import { useNavigate } from "react-router-dom";

const dummyOrders = [
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
  {
    id: 3,
    storeName: "청년닭발 구름점",
    date: "2024-05-23 오후 08:12",
    status: "배달 완료",
    rating: 3,
    menuSummary: "닭발 세트 + 주먹밥",
    price: 9800,
    storeImage: "https://source.unsplash.com/featured/?spicy",
    isCompleted: true,
    showReviewButton: false,
    remainingDays: 3,
  },
  {
    id: 4,
    storeName: "청룡각 구름점",
    date: "2024-05-20 오후 07:40",
    status: "배달 완료",
    rating: 4,
    menuSummary: "짬뽕 + 탕수육",
    price: 15500,
    storeImage: "https://source.unsplash.com/featured/?chinesefood",
    isCompleted: true,
    showReviewButton: true,
    remainingDays: undefined,
  },
];
const dummyDoingOrders = [
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

export default function Order() {
  const navigate = useNavigate();

  const handleWriteReview = () => {
    navigate("/review"); // Review 페이지로 이동
  };

  const [selectedTab, setSelectedTab] = React.useState("past"); // "past" or "preparing"

  return (
    <div>
      <OrderTab onTabChange={setSelectedTab} />
      <OrderSearch className={styles.orderSearch} />
      {selectedTab === "past" &&
        dummyOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            className={styles.orderCard}
            onWriteReview={handleWriteReview}
          />
        ))}
      {selectedTab === "preparing" &&
        dummyDoingOrders.map((order) => (
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
