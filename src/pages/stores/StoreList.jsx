import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Header from "../../components/common/Header";
import { useNavigate, useSearchParams } from "react-router-dom";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import StoreListItem from "../../components/stores/StoreListItem";
import SortBottomSheet, {
  getSortLabel,
} from "../../components/stores/SortBottomSheet";
import Tabs from "../../components/stores/Tabs";
import { getCategoryName } from "../../utils/categoryUtils";
import { fetchStores } from "../../store/storeSlice";

import styles from "./StoreList.module.css";

export default function StoreList() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category");

  const sortParam = searchParams.get("sort");
  const [sort, setSort] = useState(sortParam || "order");
  const [isSortSheetOpen, setSortSheetOpen] = useState(false);

  // Redux에서 매장 데이터 가져오기
  const stores = useSelector((state) => state.store?.stores || []);
  const storeLoading = useSelector((state) => state.store?.loading || false);

  // 매장 데이터 로딩
  useEffect(() => {
    if (stores.length === 0 && !storeLoading) {
      dispatch(fetchStores());
    }
  }, [dispatch, stores.length, storeLoading]);

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

  // useMemo로 카테고리 필터링 및 정렬된 매장 목록 최적화
  const sortedStores = useMemo(() => {
    // 카테고리 필터링
    let filteredStores = stores;
    if (category && category !== 'all') {
      filteredStores = stores.filter(store => 
        store.category?.toLowerCase() === category.toLowerCase()
      );
    }
    
    // 정렬 적용
    return [...filteredStores].sort((a, b) => {
      switch(sort) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'delivery': {
          const aTime = parseInt(a.deliveryTime?.split('-')[0]) || 30;
          const bTime = parseInt(b.deliveryTime?.split('-')[0]) || 30;
          return aTime - bTime;
        }
        case 'reviewCount':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        default:
          return 0; // 기본 순서 유지
      }
    });
  }, [stores, category, sort]);

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
          {storeLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              매장 정보를 불러오는 중...
            </div>
          ) : sortedStores.length > 0 ? (
            sortedStores.map((store) => (
              <StoreListItem
                key={store.storeId}
                store={{
                  storeId: store.storeId,
                  name: store.name,
                  review: store.review,
                  reviewCount: store.reviewCount,
                  minutesToDelivery: parseInt(store.deliveryTime?.split('-')[0]) || 30
                }}
                onClick={() => handleStoreClick(store.storeId)}
              />
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              {category ? `${getCategoryName(category)} 매장이 없습니다.` : '매장이 없습니다.'}
            </div>
          )}
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
