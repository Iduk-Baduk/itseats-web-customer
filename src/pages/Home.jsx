import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import useAddressRedux from "../hooks/useAddressRedux";
import calculateCartTotal from "../utils/calculateCartTotal";
import { fetchStores } from "../store/storeSlice";
import SearchInput from "../components/common/SearchInput";
import MenuGrid from "../components/common/MenuGrid";
import OptimizedImage from "../components/common/OptimizedImage";
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
  const orderMenus = useSelector((state) => state.cart.orderMenus);
  
  // Redux에서 매장 목록 가져오기
  const stores = useSelector((state) => state.store?.stores || []);
  const storeLoading = useSelector((state) => state.store?.loading || false);
  const storeError = useSelector((state) => state.store?.error || null);
  
  // 컴포넌트 마운트 시 매장 데이터 로딩
  useEffect(() => {
    dispatch(fetchStores());
  }, [dispatch]);
  
  // 개발 환경에서만 디버깅 로그 출력
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🏪 매장 데이터:', { count: stores.length, loading: storeLoading });
    }
  }, [stores.length, storeLoading]);
  
  // 디버깅: 전체 Redux 상태 확인
  useEffect(() => {
    // Redux 전체 상태를 1회성으로 확인
    const timer = setTimeout(() => {
      // console.log('🔍 전체 Redux 상태 확인:', {
      //   storeState: { stores: stores.length, loading: storeLoading, error: storeError },
      //   cartState: { orderMenus: orderMenus.length }
      // });
    }, 2000);

    return () => clearTimeout(timer);
  }, [stores, storeLoading, storeError, orderMenus]);

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

  // useMemo로 장바구니 정보 계산 최적화
  const cartInfo = useMemo(() => {
    return {
      orderPrice: orderMenus.reduce((sum, m) => sum + m.menuPrice * m.quantity, 0),
      totalPrice: orderMenus.reduce((sum, m) => sum + calculateCartTotal(m), 0),
      itemCount: orderMenus.reduce((sum, m) => sum + m.quantity, 0),
    };
  }, [orderMenus]);

  const hasItemsInCart = cartInfo.itemCount > 0;

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
        {storeLoading ? (
          <div>매장 정보를 불러오는 중...</div>
        ) : stores.length > 0 ? (
          stores.map((store) => (
            <StoreListItem
              key={store.id}
              store={{
                storeId: store.id,
                name: store.name,
                review: store.rating,
                reviewCount: store.reviewCount,
                minutesToDelivery: parseInt(store.deliveryTime?.split('-')[0]) || 30
              }}
              onClick={() => handleStoreClick(store.id)}
            />
          ))
        ) : (
          <div>매장 정보가 없습니다.</div>
        )}
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
