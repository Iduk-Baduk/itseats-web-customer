import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchStoreById, fetchMenusByStoreId } from "../../store/storeSlice";
import { selectCartItemCount } from "../../store/cartSlice";
import calculateCartTotal from "../../utils/calculateCartTotal";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import HeaderStoreDetail from "../../components/stores/HeaderStoreDetail";
import { useShare } from "../../hooks/useShare";
import useFavorite from "../../hooks/useFavorite";
import PhotoSlider from "../../components/stores/PhotoSlider";
import DeliveryTypeTab from "../../components/stores/DeliveryTypeTab";
import AutoScrollTabs from "../../components/stores/AutoScrollTabs";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import Toast from "../../components/common/Toast";
import BottomButton from "../../components/common/BottomButton";
import { useUIState, getErrorVariant } from "../../hooks/useUIState";

import styles from "./StoreDetail.module.css";

export default function StoreDetail() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { copyToClipboard, shareViaWebAPI } = useShare();
  const { toggleFavorite } = useFavorite();

  const { storeId } = useParams();

  const [isTransparent, setTransparent] = useState(true);
  const [menuTabFixed, setMenuTabFixed] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Redux에서 장바구니 정보 가져오기
  const cartItemCount = useSelector(selectCartItemCount);
  const cartItems = useSelector(state => state.cart.orderMenus);
  const cartTotalPrice = cartItems.reduce((total, item) => total + calculateCartTotal(item), 0);

  // 토스트 메시지 타이머 정리를 위한 useEffect
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Redux에서 매장 데이터 가져오기
  const store = useSelector(state => state.store?.currentStore);
  const stores = useSelector(state => state.store?.stores || []);
  const storeLoading = useSelector(state => state.store?.loading || false);
  const storeError = useSelector(state => state.store?.error || null);
  
  // 현재 매장 데이터 (Redux에서 우선, 없으면 전체 목록에서 검색)
  const currentStore = store || stores.find(s => s.id === storeId || s.id === parseInt(storeId));

  // UI 상태 관리
  const uiState = useUIState({
    isLoading: storeLoading,
    error: storeError,
    hasData: Boolean(currentStore),
    loadingMessage: "매장 정보를 불러오는 중...",
    emptyMessage: "매장 정보를 찾을 수 없습니다"
  });
  
  // 매장 데이터 로딩
  useEffect(() => {
    if (storeId) {
      dispatch(fetchStoreById(storeId));
      dispatch(fetchMenusByStoreId(storeId));
    }
  }, [dispatch, storeId]);

  useEffect(() => {
    if (store && store.liked) {
      setIsFavorite(store.storeId, store.liked);
    }
  }, [store])

  // 아래로 스크롤 되었을 때 헤더 배경을 흰색으로 변경
  useEffect(() => {
    const onScroll = () => {
      const target = document.getElementById("intro");
      if (!target) return;

      const rect = target.getBoundingClientRect();
      // intro가 화면 밖으로 완전히 가려졌는지 확인
      setTransparent(rect.bottom > 0);
    };
    const onScroll2 = () => {
      const target = document.getElementById("delivery-type-tab");
      if (!target) return;

      const rect = target.getBoundingClientRect();
      setMenuTabFixed(rect.bottom <= 0);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll2, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll2);
    };
  }, []);

  // 에러 핸들러
  const handleRetry = () => {
    dispatch(fetchStoreById(storeId));
    dispatch(fetchMenusByStoreId(storeId));
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/");
  };

  // 장바구니 페이지로 이동
  const handleCartClick = () => {
    navigate("/cart");
  };

  // UI 상태별 렌더링
  const renderContent = () => {
    if (uiState.isLoading) {
      return (
        <div className={styles.container}>
          <LoadingSpinner 
            message="매장 정보를 불러오는 중..." 
            size="large"
            pageLoading
          />
        </div>
      );
    }

    if (uiState.hasError) {
      return (
        <div className={styles.container}>
          <ErrorState
            variant={getErrorVariant(storeError)}
            title="매장 정보를 불러올 수 없습니다"
            onPrimaryAction={handleRetry}
            onSecondaryAction={handleGoHome}
            primaryActionText="다시 시도"
            secondaryActionText="홈으로"
          />
        </div>
      );
    }

    if (uiState.isEmpty) {
      return (
        <div className={styles.container}>
          <ErrorState
            variant="notFound"
            title="매장을 찾을 수 없습니다"
            description="요청하신 매장이 존재하지 않거나 삭제되었습니다"
            onPrimaryAction={handleGoHome}
            onSecondaryAction={handleGoBack}
            primaryActionText="홈으로"
            secondaryActionText="이전 페이지"
          />
        </div>
      );
    }

    // 성공 상태: 매장 상세 정보 표시
    return (
      <div className={styles.container}>
        <HeaderStoreDetail
          isTransparent={isTransparent}
          backButtonAction={handleGoBack}
          shareButtonAction={async () => {
            const result = await shareViaWebAPI();
            if (!result.success) {
              const result = await copyToClipboard();
              alert(result.message);
            }
          }}
          isFavorite={currentStore?.liked || false}
          favoriteButtonAction={() => {
            if (!currentStore?.storeId) return;
            const wasAlreadyFavorite = currentStore.liked || false;
            toggleFavorite(currentStore.storeId);
            // 토스트 메시지 표시
            const message = wasAlreadyFavorite ? '즐겨찾기에서 제거되었습니다!' : '즐겨찾기에 추가되었습니다!';
            setToastMessage(message);
          }}
        />
        <div id="intro" className={styles.intro}>
          <PhotoSlider images={currentStore.images || ['/samples/food1.jpg']} />
          <div className={styles.introContent}>
            <h1>{currentStore.name}</h1>
            <div className={styles.storeInfoButton}>
              <span>
                ⭐ {currentStore.review}({currentStore.reviewCount})
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M12.6 12L8 7.4L9.4 6l6 6l-6 6L8 16.6z"
                />
              </svg>
            </div>
          </div>
        </div>
        <DeliveryTypeTab
          storeId={storeId}
          defaultTime={parseInt(currentStore.deliveryTime?.split('-')[0]) || 30}
          takeoutTime={15} // 기본값
          minimumOrderPrice={currentStore.minOrderAmount || 10000}
          deliveryFeeMin={currentStore.defaultDeliveryFee}
          deliveryFeeMax={currentStore.onlyOneDeliveryFee}
          address={currentStore.address}
        />
        <AutoScrollTabs
          storeId={currentStore.storeId}
          menus={currentStore.menus || []}
          fixed={menuTabFixed}
        />
      </div>
    );
  };

  return (
    <SlideInFromRight>
      {renderContent()}
      {toastMessage && <Toast message={toastMessage} />}
      {cartItemCount > 0 && (
        <BottomButton
          onClick={handleCartClick}
          cartInfo={{
            itemCount: cartItemCount,
            totalPrice: cartTotalPrice,
            orderPrice: cartTotalPrice
          }}
        />
      )}
    </SlideInFromRight>
  );
}


