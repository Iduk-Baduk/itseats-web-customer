import { useLocation, useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchStores } from "../../store/storeSlice";
import useMyPageDetails from "../../hooks/useMyPageDetails";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import Header from "../../components/common/Header";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import { logger } from "../../utils/logger";
import styles from "./MyPageDetails.module.css";

export default function MyPageDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux에서 stores 상태 직접 확인
  const stores = useSelector(state => state.store?.stores || []);
  const storeLoading = useSelector(state => state.store?.loading || false);
  
  logger.log('🏪 MyPageDetails - Redux stores 상태:', {
    storesCount: stores.length,
    storeLoading,
    firstStore: stores[0]
  });

  // stores 데이터가 없으면 직접 로드
  useEffect(() => {
    if (stores.length === 0 && !storeLoading) {
      logger.log('🔄 MyPageDetails에서 fetchStores 호출');
      dispatch(fetchStores());
    }
  }, [stores.length, storeLoading, dispatch]);

  // 기본 사용자 정보 (MyPage에서 전달받음)
  const { user: defaultUser } = location.state || {
    user: { reviewCount: 0, helpCount: 0, favoriteCount: 0, name: "이름없음" },
  };

  const { 
    reviewData, 
    orderData, 
    favoriteData, 
    userStats, 
    loading, 
    error, 
    handleFavoriteClick,
    refreshFavorites
  } = useMyPageDetails();
  const [activeTab, setActiveTab] = useState("review");

  // 실제 통계 데이터가 있으면 사용, 없으면 기본값 사용
  const user = {
    name: defaultUser.name,
    reviewCount: userStats.reviewCount || defaultUser.reviewCount,
    helpCount: userStats.helpCount || defaultUser.helpCount,
    favoriteCount: userStats.favoriteCount || defaultUser.favoriteCount,
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

    if (activeTab === "orders") {
      return (
        <div className={styles.cards}>
          {current.data.map((item) => (
            <div key={item.id} className={styles.card}>
              <img src={item.image} alt={item.title} />
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
              <img src={item.image} alt={item.title} />
              <div className={styles.favoriteInfo}>
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

  // 개발 환경에서 상태 디버그 출력
  logger.log('🔍 MyPageDetails 상태:', {
    loading,
    error,
    reviewDataCount: reviewData.length,
    orderDataCount: orderData.length,
    favoriteDataCount: favoriteData.length,
    userStats,
    favoriteData: favoriteData.slice(0, 2) // 처음 2개만 출력
  });

  return (
    <SlideInFromRight>
      <Header
        leftButtonAction={() => {
          navigate(-1);
        }}
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
