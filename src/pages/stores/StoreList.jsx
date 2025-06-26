import React, { useState, useCallback, useMemo } from "react";
import Header from "../../components/common/Header";
import { useNavigate, useSearchParams } from "react-router-dom";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import StoreListItem from "../../components/stores/StoreListItem";
import SortBottomSheet, {
  getSortLabel,
} from "../../components/stores/SortBottomSheet";
import Tabs from "../../components/stores/Tabs";
import { getCategoryName } from "../../utils/categoryUtils";

import styles from "./StoreList.module.css";

const dummyStores = [
  {
    storeId: 1,
    name: "버거킹 구름점",
    review: 4.9,
    reviewCount: 1742,
    minutesToDelivery: 30,
  },
  {
    storeId: 2,
    name: "맘스터치 구름점",
    review: 4.8,
    reviewCount: 52,
    minutesToDelivery: 25,
  },
  {
    storeId: 3,
    name: "청년닭발 구름점",
    review: 3.1,
    reviewCount: 124,
    minutesToDelivery: 40,
  },
  {
    storeId: 4,
    name: "피자헛 구름점",
    review: 4.2,
    reviewCount: 172,
    minutesToDelivery: 35,
  },
  {
    storeId: 5,
    name: "청룡각 구름점",
    review: 4.9,
    reviewCount: 742,
    minutesToDelivery: 30,
  },
  {
    storeId: 6,
    name: "떡볶이 참 잘하는집 구름점",
    review: 4.2,
    reviewCount: 945,
    minutesToDelivery: 10,
  },
];

export default function StoreList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category");

  const sortParam = searchParams.get("sort");
  const [sort, setSort] = useState(sortParam || "order");
  const [isSortSheetOpen, setSortSheetOpen] = useState(false);

  // useCallback으로 이벤트 핸들러 최적화
  const handleBackClick = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSearchClick = useCallback(() => {
    navigate("/search");
  }, [navigate]);

  const handleSortButtonClick = useCallback(() => {
    setSortSheetOpen(true);
  }, []);

  const handleSortSheetClose = useCallback(() => {
    setSortSheetOpen(false);
  }, []);

  const handleSortSelect = useCallback((newSort) => {
    setSort(newSort);
    const params = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...params, sort: newSort }, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleStoreClick = useCallback((storeId) => {
    navigate(`/stores/${storeId}`);
  }, [navigate]);

  // useMemo로 정렬된 매장 목록 최적화
  const sortedStores = useMemo(() => {
    return [...dummyStores].sort((a, b) => {
      switch(sort) {
        case 'rating':
          return b.review - a.review;
        case 'delivery':
          return a.minutesToDelivery - b.minutesToDelivery;
        case 'reviewCount':
          return b.reviewCount - a.reviewCount;
        default:
          return 0; // 기본 순서 유지
      }
    });
  }, [sort]);

  return (
    <SlideInFromRight>
      <div>
        <Header
          title={getCategoryName(category)}
          leftButtonAction={handleBackClick}
          rightButtonAction={handleSearchClick}
          shadow={false}
        />
        <Tabs />
        <div className={styles.container}>
          <div className={styles.options}>
            <button
              className={styles.sortButton}
              aria-label="정렬 조건"
              onClick={handleSortButtonClick}
            >
              <span>{getSortLabel(sort)}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M15.88 9.29L12 13.17L8.12 9.29a.996.996 0 1 0-1.41 1.41l4.59 4.59c.39.39 1.02.39 1.41 0l4.59-4.59a.996.996 0 0 0 0-1.41c-.39-.38-1.03-.39-1.42 0"
                />
              </svg>
            </button>
          </div>
          {sortedStores.map((store) => (
            <StoreListItem
              key={store.storeId}
              store={store}
              onClick={() => handleStoreClick(store.storeId)}
            />
          ))}
        </div>

        <SortBottomSheet
          sort={sort}
          isOpen={isSortSheetOpen}
          onClose={handleSortSheetClose}
          onSelect={handleSortSelect}
        />
      </div>
    </SlideInFromRight>
  );
}
