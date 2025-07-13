import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import useMyPageDetails from "../../hooks/useMyPageDetails";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import Header from "../../components/common/Header";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import styles from "./MyPageDetails.module.css";

export default function MyPageDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    reviewData,
    orderData,
    favoriteData,
    userStats,
    loading,
    error,
    handleFavoriteClick,
    handleOrderClick,
  } = useMyPageDetails();

  const [activeTab, setActiveTab] = useState("review");

  const defaultUser = location.state?.user || {
    name: "이름없음",
    reviewCount: 0,
    helpCount: 0,
    favoriteCount: 0,
  };

  const user = {
    name: defaultUser.name,
    reviewCount: userStats.reviewCount || defaultUser.reviewCount,
    helpCount: userStats.helpCount || defaultUser.helpCount,
    favoriteCount: userStats.favoriteCount || defaultUser.favoriteCount,
    orderCount: userStats.orderCount || 0,
    totalSpent: userStats.totalSpent || 0,
  };

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
    if (loading) {
      return (
        <div className={styles.loading}>
          <LoadingSpinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.error}>
          <ErrorState message={error} />
        </div>
      );
    }

    if (current.data.length === 0) {
      return (
        <div className={styles.empty}>
          <img src="/icons/mypage/clipboard.svg" alt="empty" />
          <p>{current.emptyText}</p>
        </div>
      );
    }

    if (activeTab === "review") {
      console.log('🔥 리뷰 데이터:', current.data);
      return (
        <div className={styles.reviewList}>
          {current.data.map((item, idx) => (
            <div key={item.reviewId || idx} className={styles.reviewItem}>
              <div className={styles.reviewHeader}>
                <strong>{item.storeName}</strong>
                <span>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className={styles.reviewStars}>
                {"⭐".repeat(item.rating)}
                <span className={styles.ratingNumber}>{item.rating}</span>
              </div>
              <p className={styles.reviewContent}>{item.content}</p>
            </div>
          ))}
        </div>

      );
    }



    if (activeTab === "orders") {
      return (
        <div className={styles.cards}>
          {current.data.map((item) => (
            <div
              key={item.id}
              className={styles.card}
              onClick={() => handleOrderClick(item.id)}
              style={{ cursor: "pointer" }}
            >
              <img src={item.image} alt={item.title} /> {/* ⭐ 이미지 추가 */}
              <p>{item.title}</p>
              <span>{item.date}</span>
              {item.totalPrice && (
                <span className={styles.price}>
                  {item.totalPrice.toLocaleString()}원
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }


    if (activeTab === "favorites") {
      return (
        <div className={styles.favoriteList}>
          {current.data.map((item) => (
            <div
              key={item.id}
              className={styles.favoriteItem}
              onClick={() => handleFavoriteClick(item.id)}
            >
              <h3>{item.title}</h3>
              <div className={styles.favoriteDetails}>
                <span className={styles.rating}>⭐ {item.rating}</span>
                <span className={styles.category}>{item.category}</span>
              </div>
              <div className={styles.deliveryInfo}>
                <span>{item.deliveryTime}</span>
                <span>배달비 {item.deliveryFee?.toLocaleString()}원</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <SlideInFromRight>
      <Header
        leftButtonAction={() => navigate(-1)}
        shadow={false}
        title=""
        rightIcon=""
      />
      <div className={styles.container}>
        <h2 className={styles.name}>{user.name}</h2>
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
          {Object.entries(tabContentMap).map(([key, { label }]) => (
            <button
              key={key}
              className={activeTab === key ? styles.active : ""}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.content}>{renderContent()}</div>
      </div>
    </SlideInFromRight>
  );
}
