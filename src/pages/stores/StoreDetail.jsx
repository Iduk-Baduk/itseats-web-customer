import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchStoreById } from "../../store/storeSlice";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import HeaderStoreDetail from "../../components/stores/HeaderStoreDetail";
import { useShare } from "../../hooks/useShare";
import PhotoSlider from "../../components/stores/PhotoSlider";
import DeliveryTypeTab from "../../components/stores/DeliveryTypeTab";
import AutoScrollTabs from "../../components/stores/AutoScrollTabs";

import styles from "./StoreDetail.module.css";

export default function StoreDetail() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { copyToClipboard, shareViaWebAPI } = useShare();

  const { storeId } = useParams();

  const [isTransparent, setTransparent] = useState(true);
  const [menuTabFixed, setMenuTabFixed] = useState(false);

  // Redux에서 매장 데이터 가져오기
  const store = useSelector(state => state.store?.currentStore);
  const stores = useSelector(state => state.store?.stores || []);
  const storeLoading = useSelector(state => state.store?.loading || false);
  
  // 현재 매장 데이터 (Redux에서 우선, 없으면 전체 목록에서 검색)
  const currentStore = store || stores.find(s => s.id === storeId || s.id === parseInt(storeId));
  
  // console.log('🏪 StoreDetail - 매장 데이터:', {
  //   storeId,
  //   store,
  //   stores: stores.length,
  //   loading: storeLoading
  // });

  // 매장 데이터 로딩
  useEffect(() => {
    if (storeId) {
      dispatch(fetchStoreById(storeId));
    }
  }, [dispatch, storeId]);

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

  // 로딩 중이거나 매장 데이터가 없는 경우 처리
  if (storeLoading || !currentStore) {
    return (
      <SlideInFromRight>
        <div className={styles.container}>
          <div>매장 정보를 불러오는 중...</div>
        </div>
      </SlideInFromRight>
    );
  }

  return (
    <SlideInFromRight>
      <div className={styles.container}>
        <HeaderStoreDetail
          isTransparent={isTransparent}
          backButtonAction={() => {
            navigate(-1);
          }}
          shareButtonAction={async () => {
            const result = await shareViaWebAPI();
            if (!result.success) {
              const result = await copyToClipboard();
              alert(result.message);
            }
          }}
          isFavorite={false} // 좋아요 기능은 별도 구현 필요
          favoriteButtonAction={() => {}}
        />
        <div id="intro" className={styles.intro}>
          <PhotoSlider images={[
            currentStore.imageUrl || "/samples/food1.jpg",
            "/samples/food2.jpg",
            "/samples/food3.jpg"
          ]} />
          <div className={styles.introContent}>
            <h1>{currentStore.name}</h1>
            <div className={styles.storeInfoButton}>
              <span>
                ⭐ {currentStore.rating}({currentStore.reviewCount})
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
          minimumOrderPrice={currentStore.minOrderAmount}
          deliveryFeeMin={currentStore.deliveryFee}
          deliveryFeeMax={currentStore.deliveryFee}
          address={currentStore.address}
        />
        <AutoScrollTabs
          storeId={currentStore.id}
          menus={currentStore.menus || []}
          fixed={menuTabFixed}
        />
      </div>
    </SlideInFromRight>
  );
}


