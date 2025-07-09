import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import SearchHeaderBar from "../../components/common/SearchHeaderBar";
import { useNavigate, useSearchParams } from "react-router-dom";
import StoreListItem from "../../components/stores/StoreListItem";
import SortBottomSheet, {
  getSortLabel,
} from "../../components/stores/SortBottomSheet";
import { fetchStoresByKeyword } from "../../store/storeSlice";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import { useListUIState, getErrorVariant } from "../../hooks/useUIState";
import useAddressRedux from "../../hooks/useAddressRedux";
import { addKeyword } from "../../store/searchSlice";
import styles from "../stores/StoreList.module.css";

export default function SearchResult() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyword = searchParams.get("keyword") || "";
  const [searchedKeyword, setSearchedKeyword] = useState(initialKeyword); // 검색어 표시용
  const [keyword, setKeyword] = useState(initialKeyword);

  const sortParam = searchParams.get("sort");
  const [sort, setSort] = useState(sortParam || "DISTANCE");
  const [isSortSheetOpen, setSortSheetOpen] = useState(false);

  // Redux에서 매장 데이터 가져오기
  const stores = useSelector((state) => state.store?.stores || []);
  const storeLoading = useSelector((state) => state.store?.loading || false);
  const storeError = useSelector((state) => state.store?.error || null);
  const { selectedAddressId } = useAddressRedux();

  // UI 상태 관리
  const uiState = useListUIState({
    isLoading: storeLoading,
    error: storeError,
    items: stores,
    searchKeyword: keyword,
    emptyVariant: "search",
  });

  useEffect(() => {
    setSearchedKeyword(initialKeyword);
    handleAddKeyword(keyword);
    setKeyword(initialKeyword);
  }, []);

  useEffect(() => {
    // 정렬 변경 시 다시 검색
    dispatch(fetchStoresByKeyword({
      keyword,
      sort,
      page: 0,
      addressId: selectedAddressId,
    }));
  }, [dispatch, initialKeyword, sort, keyword, selectedAddressId]);

  // 에러 핸들러
  const handleRetry = () => {
    dispatch(
      fetchStoresByKeyword({
        keyword,
        sort,
        page: 0,
        addressId: selectedAddressId,
      })
    );
    setSearchedKeyword(keyword);
  };

  const handleSearch = () => {
    dispatch(
      fetchStoresByKeyword({
        keyword,
        sort,
        page: 0,
        addressId: selectedAddressId,
      })
    );
    setSearchedKeyword(keyword);
    handleAddKeyword(keyword);
  };

  // 최근 검색어 추가
  const handleAddKeyword = (keyword) => {
    if (keyword === undefined || keyword === "") {
      return;
    }

    dispatch(addKeyword(keyword));
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // UI 상태별 렌더링
  const renderContent = () => {
    if (uiState.isLoading) {
      return <LoadingSpinner message="검색 중..." size="medium" pageLoading />;
    }

    if (uiState.hasError) {
      return (
        <ErrorState
          variant={getErrorVariant(storeError)}
          onPrimaryAction={handleRetry}
          onSecondaryAction={handleGoBack}
          primaryActionText="다시 검색"
          secondaryActionText="돌아가기"
        />
      );
    }

    if (uiState.isEmpty) {
      return (
        <EmptyState
          variant="search"
          title={`"${searchedKeyword}"에 대한 검색 결과가 없습니다`}
          description="다른 키워드로 검색해보세요"
          actionText="돌아가기"
          onAction={handleGoBack}
        />
      );
    }

    // 성공 상태: 검색 결과 표시
    return (
      <>
        <div className={styles.searchInfo}>
          <span className={styles.resultCount}>
            "{searchedKeyword}" 검색 결과 {uiState.itemCount}개
          </span>
        </div>

        {stores.map((store) => (
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
            onClick={() => navigate(`/stores/${store.storeId}`)}
          />
        ))}
      </>
    );
  };

  return (
    <>
      <SearchHeaderBar
        keyword={keyword}
        onBack={handleGoBack}
        onChange={(e) => setKeyword(e.target.value)}
        onSearch={handleSearch}
      />

      {/* 정렬 옵션은 검색 결과가 있을 때만 표시 */}
      {uiState.hasData && (
        <div className={styles.options}>
          <button
            className={styles.sortButton}
            aria-label="정렬 조건"
            onClick={() => setSortSheetOpen(true)}
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
      )}

      {/* 메인 콘텐츠 */}
      {renderContent()}

      {/* 정렬 바텀시트 */}
      <SortBottomSheet
        sort={sort}
        isOpen={isSortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        onSelect={(sort) => {
          setSort(sort);
          const params = Object.fromEntries(searchParams.entries());
          setSearchParams({ ...params, sort }, { replace: true });
        }}
      />
    </>
  );
}
