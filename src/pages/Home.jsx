import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import useAddressRedux from "../hooks/useAddressRedux";
import calculateCartTotal from "../utils/calculateCartTotal";
import { fetchStores } from "../store/storeSlice";
import { initializeTestData } from "../utils/testDataInitializer";
import SearchInput from "../components/common/SearchInput";
import MenuGrid from "../components/common/MenuGrid";
import OptimizedImage from "../components/common/OptimizedImage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import { useUIState, getErrorVariant } from "../hooks/useUIState";
import styles from "./Home.module.css";
import StoreListItem from "../components/stores/StoreListItem";
import BottomButton from "../components/common/BottomButton";

function HomeHeader() {
  const navigate = useNavigate();
  const { selectedAddress } = useAddressRedux();

  const handleAddressClick = useCallback(() => {
    navigate("/address");
  }, [navigate]);

  return (
    <header className={styles.header}>
      <button
        className={styles.addressButton}
        aria-label="주소 관리"
        onClick={handleAddressClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 21.325q-.35 0-.7-.125t-.625-.375Q9.05 19.325 7.8 17.9t-2.087-2.762t-1.275-2.575T4 10.2q0-3.75 2.413-5.975T12 2t5.588 2.225T20 10.2q0 1.125-.437 2.363t-1.275 2.575T16.2 17.9t-2.875 2.925q-.275.25-.625.375t-.7.125M12 12q.825 0 1.413-.587T14 10t-.587-1.412T12 8t-1.412.588T10 10t.588 1.413T12 12"
          />
        </svg>
        <span>{selectedAddress ? selectedAddress.label : "주소 선택"}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M15.88 9.29L12 13.17L8.12 9.29a.996.996 0 1 0-1.41 1.41l4.59 4.59c.39.39 1.02.39 1.41 0l4.59-4.59a.996.996 0 0 0 0-1.41c-.39-.38-1.03-.39-1.42 0"
          />
        </svg>
      </button>
    </header>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [keyword, setKeyword] = useState("");
  const [filteredStores, setFilteredStores] = useState([]);
  const orderMenus = useSelector((state) => state.cart.orderMenus);
  
  // Redux에서 매장 목록 가져오기
  const stores = useSelector((state) => state.store?.stores || []);
  const storeLoading = useSelector((state) => state.store?.loading || false);
  const storeError = useSelector((state) => state.store?.error || null);

  // UI 상태 관리
  const storeUIState = useUIState({
    isLoading: storeLoading,
    error: storeError,
    data: filteredStores.length > 0 ? filteredStores : stores,
    loadingMessage: "매장 정보를 불러오는 중...",
    emptyMessage: keyword ? "검색 결과가 없습니다" : "주변에 매장이 없습니다"
  });
  
  // 컴포넌트 마운트 시 데이터 로딩 및 초기화
  useEffect(() => {
    dispatch(fetchStores());
    
    // 테스트 데이터 초기화 (주문 + 즐겨찾기)
    initializeTestData(dispatch);
  }, [dispatch]);

  // 매장 데이터 초기화
  useEffect(() => {
    if (stores.length > 0 && filteredStores.length === 0) {
      setFilteredStores(stores);
    }
  }, [stores, filteredStores.length]);

  // 검색 키워드 변경 시 필터링
  useEffect(() => {
    const filtered = stores.filter((store) =>
      store.name.toLowerCase().includes(keyword.toLowerCase())
    );
    setFilteredStores(filtered);
  }, [stores, keyword]);

  // useCallback으로 이벤트 핸들러 최적화
  const handleKeywordChange = useCallback((e) => {
    setKeyword(e.target.value);
  }, []);

  const handleStoreClick = useCallback((storeId) => {
    navigate(`/stores/${storeId}`);
  }, [navigate]);

  const handleCartClick = useCallback(() => {
    navigate("/cart");
  }, [navigate]);

  const handleRetryStores = useCallback(() => {
    dispatch(fetchStores());
  }, [dispatch]);

  const handleSearchStores = useCallback(() => {
    navigate("/search");
  }, [navigate]);

  // useMemo로 장바구니 정보 계산 최적화
  const cartInfo = useMemo(() => {
    return {
      orderPrice: orderMenus.reduce((sum, m) => sum + m.menuPrice * m.quantity, 0),
      totalPrice: orderMenus.reduce((sum, m) => sum + calculateCartTotal(m), 0),
      itemCount: orderMenus.reduce((sum, m) => sum + m.quantity, 0),
    };
  }, [orderMenus]);

  const hasItemsInCart = cartInfo.itemCount > 0;

  // 매장 목록 렌더링
  const renderStoreSection = () => {
    if (storeUIState.isLoading) {
      return (
        <LoadingSpinner 
          message="매장 정보를 불러오는 중..." 
          size="medium"
          variant="skeleton"
        />
      );
    }

    if (storeUIState.hasError) {
      return (
        <ErrorState
          variant={getErrorVariant(storeError)}
          title="매장 정보를 불러올 수 없습니다"
          onPrimaryAction={handleRetryStores}
          onSecondaryAction={handleSearchStores}
          primaryActionText="다시 시도"
          secondaryActionText="매장 검색"
        />
      );
    }

    if (storeUIState.isEmpty) {
      return (
        <EmptyState
          variant="default"
          icon="🏪"
          title="주변에 매장이 없습니다"
          description="다른 지역의 매장을 찾아보세요"
          actionText="매장 검색"
          onAction={handleSearchStores}
        />
      );
    }

    // 성공 상태: 매장 목록 표시
    return filteredStores.map((store) => (
      <StoreListItem
        key={store.id}
        store={{
          storeId: store.id,
          name: store.name,
          review: store.rating,
          reviewCount: store.reviewCount,
          image: store.images[0],
          menuImage1: store.images[1],
          menuImage2: store.images[2],
          minutesToDelivery: parseInt(store.deliveryTime?.split('-')[0]) || 30
        }}
        onClick={() => handleStoreClick(store.id)}
      />
    ));
  };

  return (
    <>
      <HomeHeader />
      <div className={styles.container}>
        <SearchInput
          value={keyword}
          onChange={handleKeywordChange}
          showIcon={true}
        />
        <MenuGrid />
        <div className={styles.bannerContainer}>
          <OptimizedImage 
            src="/samples/banner.jpg" 
            alt="홈 페이지 배너 이미지" 
            priority={true}
            className={styles.bannerImage}
            width={350}
            height={200}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2>골라먹는 맛집</h2>
        {renderStoreSection()}
      </div>

      {hasItemsInCart && (
        <BottomButton
          bottom="60px"
          onClick={handleCartClick}
          cartInfo={cartInfo}
        />
      )}
    </>
  );
}
