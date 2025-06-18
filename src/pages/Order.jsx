import React from "react";
import OrderCard from "../components/orders/OrderCard";
import OrderSearch from "../components/orders/OrderSearch";
import styles from "./Order.module.css";

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
    showReviewButton: true,
    remainingDays: undefined,
  },
];

export default function Order() {
  return (
    <div>
      <OrderSearch className={styles.orderSearch} />
      {dummyOrders &&
        dummyOrders.map((order) => (
          <OrderCard key={order.id} order={order} className={styles.orderCard} />
        ))}
    </div>
  );
}
