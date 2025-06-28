// Favorite.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/common/Header";
import SlideInFromRight from "../components/animation/SlideInFromRight";
import useFavorite from "../hooks/useFavorite";
import BottomButton from "../components/common/BottomButton";
import styles from "./Favorite.module.css";
import { STORAGE_KEYS, logger } from '../utils/logger';

export default function Favorite() {
  const navigate = useNavigate();
  const stores = useSelector(state => state.store?.stores || []);
  const storeLoading = useSelector(state => state.store?.loading || false);
  
  const {
    favorites,
    isEditing,
    selectedIds,
    toggleEditMode,
    toggleSelect,
    handleUnfavorite,
    sortedFavorites,
    sortOption,
    setSortOption,
    navigateToHome,
  } = useFavorite();

  // 개발 환경에서 상태 디버그 출력
  logger.log('🔍 Favorite 페이지 상태:', {
    storesCount: stores.length,
    storeLoading,
    favoritesCount: favorites.length,
    favorites: favorites.slice(0, 2), // 처음 2개만 출력
    localStorage: localStorage.getItem(STORAGE_KEYS.FAVORITES)
  });

  return (
    <SlideInFromRight>
      <div className={styles.container}>
        <Header
          title="즐겨찾기"
          leftButtonAction={() => {
            navigate(-1);
          }}
          rightIcon=""
        />
        <div className={styles.fixed}>
          {!isEditing ? (
            <button className={styles.editButton} onClick={toggleEditMode}>
              수정
            </button>
          ) : (
            <button className={styles.cancelButton} onClick={toggleEditMode}>
              취소
            </button>
          )}
        </div>

        {!favorites.length ? (
          <div className={styles.empty}>
            <p>
              즐겨찾는 맛집이 없습니다.
              <br />
              좋아하는 맛집에 하트를 눌러주세요.
            </p>
            <img
              className={styles.favoritePic}
              src="/samples/favoriteDefault.png"
              alt="favoritePic"
            />
            <p></p>
            <button onClick={navigateToHome}>잇츠잇츠 맛집 구경가기</button>
          </div>
        ) : (
          <>
            <div className={styles.total}>
              <span>{`총 ${favorites.length}개`}</span>
              <select
                className={styles.sortSelect}
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="recent">최근 추가 순</option>
                <option value="rating">별점 순</option>
              </select>
            </div>

            <ul className={styles.list}>
              {sortedFavorites.map((store) => (
                <li
                  key={store.id}
                  className={`${styles.item} ${
                    !isEditing ? styles.notEditing : ""
                  }`}
                  onClick={() => {
                    if (isEditing) {
                      toggleSelect(store.id);
                    } else {
                      navigate(`/stores/${store.id}`);
                    }
                  }}
                >
                  <img src={store.image} alt={store.title} />
                  <div className={styles.details}>
                    <p className={styles.name}>{store.title}</p>
                    <p className={styles.subinfo}>
                      ⭐ {store.rating} · {store.category} · {store.deliveryTime} · 배달비 {store.deliveryFee?.toLocaleString()}원
                    </p>
                  </div>
                  {isEditing && (
                    <span
                      className={`${styles.checkCircle} ${
                        selectedIds.includes(store.id) ? styles.checked : ""
                      }`}
                    >
                      <div
                        className={styles.box}
                        style={{ borderRadius: "50%" }}
                      >
                        <svg className={styles.icon} viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="4" fill="currentColor" />
                        </svg>
                      </div>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {isEditing && selectedIds.length > 0 && (
          <BottomButton onClick={handleUnfavorite}>
            {selectedIds.length}개 즐겨찾기 해제
          </BottomButton>
        )}
      </div>
    </SlideInFromRight>
  );
}
