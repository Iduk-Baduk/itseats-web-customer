import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import SearchHeaderBar from "../../components/common/SearchHeaderBar";
import { useNavigate, useSearchParams } from "react-router-dom";
import StoreListItem from "../../components/stores/StoreListItem";
import SortBottomSheet, {
  getSortLabel,
} from "../../components/stores/SortBottomSheet";
import { fetchStores } from "../../store/storeSlice";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import { useListUIState, getErrorVariant } from "../../hooks/useUIState";
import styles from "../stores/StoreList.module.css";

export default function SearchResult() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyword = searchParams.get("keyword") || "";
  const [keyword, setKeyword] = useState(initialKeyword);

  const sortParam = searchParams.get("sort");
  const [sort, setSort] = useState(sortParam || "order");
  const [isSortSheetOpen, setSortSheetOpen] = useState(false);
  
  // Redux에서 매장 데이터 가져오기
  const stores = useSelector((state) => state.store?.stores || []);
  const storeLoading = useSelector((state) => state.store?.loading || false);
  const storeError = useSelector((state) => state.store?.error || null);
  
  // 키워드 기반 매장 필터링 및 정렬
  const filteredAndSortedStores = useMemo(() => {
    // 검색 키워드로 필터링
    const filteredStores = stores.filter(store => 
      store.name?.toLowerCase().includes(keyword.toLowerCase()) ||
      store.category?.toLowerCase().includes(keyword.toLowerCase())
    );
    
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
  }, [stores, keyword, sort]);

  // UI 상태 관리
  const uiState = useListUIState({
    isLoading: storeLoading,
    error: storeError,
    items: filteredAndSortedStores,
    searchKeyword: keyword,
    emptyVariant: 'search'
  });
  
  useEffect(() => {
    setKeyword(initialKeyword);
  }, [initialKeyword]);
  
  // 매장 데이터가 없으면 로딩
  useEffect(() => {
    if (stores.length === 0 && !storeLoading) {
      dispatch(fetchStores());
    }
  }, [dispatch, stores.length, storeLoading]);

  // 에러 핸들러
  const handleRetry = () => {
    dispatch(fetchStores());
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // UI 상태별 렌더링
  const renderContent = () => {
    if (uiState.isLoading) {
      return (
        <LoadingSpinner 
          message="검색 중..." 
          size="medium"
          pageLoading
        />
      );
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
          title={`"${keyword}"에 대한 검색 결과가 없습니다`}
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
            "{keyword}" 검색 결과 {uiState.itemCount}개
          </span>
        </div>
        
        {filteredAndSortedStores.map((store) => (
          <StoreListItem
            key={store.id}
            store={{
              storeId: store.id,
              name: store.name,
              review: store.rating,
              reviewCount: store.reviewCount,
              minutesToDelivery: parseInt(store.deliveryTime?.split('-')[0]) || 30
            }}
            onClick={() => navigate(`/stores/${store.id}`)}
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
