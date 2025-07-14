import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Header from "../../components/common/Header";
import { useNavigate, useSearchParams } from "react-router-dom";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import StoreListItem from "../../components/stores/StoreListItem";
import SortBottomSheet, {
  getSortLabel,
} from "../../components/stores/SortBottomSheet";
import Tabs from "../../components/stores/Tabs";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getCategoryName } from "../../utils/categoryUtils";
import { fetchStoresByCategory } from "../../store/storeSlice";
import useAddressRedux from "../../hooks/useAddressRedux";

import styles from "./StoreList.module.css";

export default function StoreList() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category");

  const sortParam = searchParams.get("sort");
  const [sort, setSort] = useState(sortParam || "ORDER_COUNT");
  const [isSortSheetOpen, setSortSheetOpen] = useState(false);

  // Redux에서 매장 데이터 가져오기
  const stores = useSelector((state) => state.store?.stores || []);
  const storeLoading = useSelector((state) => state.store?.loading || false);
  const currentPage = useSelector((state) => state.store?.currentPage || 0);
  const hasNext = useSelector((state) => state.store?.hasNext || false);
  const { selectedAddressId } = useAddressRedux();

  // 매장 데이터 로딩
  useEffect(() => {
    dispatch(
      fetchStoresByCategory({
        category,
        sort,
        page: 0,
        addressId: selectedAddressId,
      })
    );
  }, [dispatch, category, sort, selectedAddressId]);

  // 무한 스크롤 구현
  const observer = useRef();
  const lastStoreElementRef = useCallback(
    (node) => {
      if (storeLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNext) {
          dispatch(
            fetchStoresByCategory({
              category,
              sort,
              page: currentPage + 1,
              addressId: selectedAddressId,
              next: true,
            })
          );
        }
      });
      if (node) observer.current.observe(node);
    },
    [storeLoading, hasNext, currentPage, dispatch, category, sort, selectedAddressId]
  );

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

  const handleSortSelect = useCallback(
    (newSort) => {
      setSort(newSort);
      const params = Object.fromEntries(searchParams.entries());
      setSearchParams({ ...params, sort: newSort }, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleStoreClick = useCallback(
    (storeId) => {
      navigate(`/stores/${storeId}`);
    },
    [navigate]
  );

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
          {stores.length === 0 && !storeLoading && (
            <div className={styles.noStoresMessage}>
              {category
                ? `${getCategoryName(category)} 매장이 없습니다.`
                : "매장이 없습니다."}
            </div>
          )}
          {stores.length > 0 &&
            stores.map((store, index) => {
              const isLastElement = index === stores.length - 1;
              return (
                  <StoreListItem
                    key={store.storeId}
                    store={{
                      storeId: store.storeId,
                      name: store.name,
                      review: store.review,
                      reviewCount: store.reviewCount,
                      images: store.images || ["/samples/food1.jpg"],
                      distance: store.distance || 1,
                      minOrderPrice: store.minOrderPrice || 10000,
                      minutesToDelivery:
                        parseInt(store.deliveryTime?.split("-")[0]) || 30,
                    }}
                    onClick={() => handleStoreClick(store.storeId)}
                    ref={isLastElement ? lastStoreElementRef : null}
                />
              );
            })}
          {storeLoading && (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <LoadingSpinner message="매장 정보를 불러오는 중..." />
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
