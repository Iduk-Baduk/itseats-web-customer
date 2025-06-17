import { useLocation } from "react-router-dom";
import { useState } from "react";
import useMyPageDetails from "../hooks/useMyPageDetails";
import styles from "./MyPageDetails.module.css";

export default function MyPageDetails() {
  const location = useLocation();
  const { user } = location.state || {
    user: { reviewCount: 0, helpCount: 0, favoriteCount: 0, name: "이름없음" },
  };

  const { reviewData, orderData, favoriteData } = useMyPageDetails();
  const [activeTab, setActiveTab] = useState("review");

  const tabContentMap = {
    review: {
      label: "리뷰",
      data: reviewData,
      emptyText: "작성한 리뷰가 없습니다.",
    },
    orders: {
      label: "주문내역",
      data: orderData,
      emptyText: "주문 내역이 없습니다.",
    },
    favorites: {
      label: "즐겨찾기",
      data: favoriteData,
      emptyText: "즐겨찾기가 없습니다.",
    },
  };

  const current = tabContentMap[activeTab];

  const renderContent = () => {
    if (current.data.length === 0) {
      return (
        <div className={styles.empty}>
          <img src="/icons/mypage/clipboard.svg" alt="empty" />
          <p>{current.emptyText}</p>
        </div>
      );
    }

    if (activeTab === "orders") {
      return (
        <div className={styles.cards}>
          {current.data.map((item) => (
            <div key={item.id} className={styles.card}>
              <img src={item.image} alt={item.title} />
              <p>{item.title}</p>
              <span>{item.date}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <ul className={styles.list}>
        {current.data.map((item, idx) => (
          <li key={idx}>{item.title}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.name}>{user.name}</h2> {/* ✅ 이름 추가 */}
      <div className={styles.stats}>
        <div>
          <strong>{user.reviewCount}</strong>
          <p>내가 남긴 리뷰</p>
        </div>
        <div>
          <strong>{user.helpCount}</strong>
          <p>도움이 됐어요</p>
        </div>
        <div>
          <strong>{user.favoriteCount}</strong>
          <p>즐겨찾기</p>
        </div>
      </div>
      <div className={styles.tabs}>
        {Object.entries(tabContentMap).map(([key, tab]) => (
          <button
            key={key}
            className={`${styles.tab} ${
              activeTab === key ? styles.active : ""
            }`}
            onClick={() => setActiveTab(key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
}
