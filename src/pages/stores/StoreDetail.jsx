import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import HeaderStoreDetail from "../../components/common/HeaderStoreDetail";
import { useShare } from "../../hooks/useShare";
import PhotoSlider from "../../components/stores/PhotoSlider";
import DeliveryTypeTab from "../../components/stores/DeliveryTypeTab";
import AutoScrollTabs from "../../components/stores/AutoScrollTabs";

import styles from "./StoreDetail.module.css";

const dummyStore = {
  images: [
    { image: "/samples/food1.jpg" },
    { image: "/samples/food2.jpg" },
    { image: "/samples/food3.jpg" },
  ],
  isLiked: true,
  reviewRating: 4.9,
  reviewCount: 13812,
  storeName: "스타벅스 강남점",
  description: "커피 전문점입니다.",
  storeAddress: "서울시 강남구 테헤란로",
  location: {
    lat: 37.4979,
    lng: 127.0276,
  },
  businessStatus: "OPEN",
  storePhone: "02-1234-5678",
  orderable: true,
  defaultTime: 24,
  takeoutTime: 12,
  minimumOrderPrice: 8000,
  deliveryFeeMin: 1000,
  deliveryFeeMax: 3000,
  menus: [
    {
      menuId: 11,
      menuName: "아메리카노",
      menuPrice: "2000",
      menuStatus: "ONSALE",
      menuGroupName: "음료",
    },
    {
      menuId: 13,
      menuName: "초코라떼",
      menuPrice: "2000",
      menuStatus: "OUT_OF_STOCK",
      menuGroupName: "음료",
    },
    {
      menuId: 25,
      menuName: "커피번",
      menuPrice: "3500",
      menuStatus: "HIDDEN",
      menuGroupName: "베이커리",
    },
  ],
};

export default function StoreDetail() {
  const navigate = useNavigate();
  const { copyToClipboard, shareViaWebAPI } = useShare();

  const { storeId } = useParams();

  const [isTransparent, setTransparent] = useState(true);
  const [menuTabFixed, setMenuTabFixed] = useState(false);

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

  return (
    <SlideInFromRight>
      <div>
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
          isFavorite={dummyStore.isLiked}
          favoriteButtonAction={() => {}}
        />
        <div id="intro" className={styles.intro}>
          <PhotoSlider images={dummyStore.images.map((img) => img.image)} />
          <div className={styles.introContent}>
            <h1>{dummyStore.storeName}</h1>
            <div>
              <span>
                ⭐ {dummyStore.reviewRating}({dummyStore.reviewCount})
              </span>
            </div>
          </div>
        </div>
        <DeliveryTypeTab
          storeId={storeId}
          defaultTime={dummyStore.defaultTime}
          takeoutTime={dummyStore.takeoutTime}
          minimumOrderPrice={dummyStore.minimumOrderPrice}
          deliveryFeeMin={dummyStore.deliveryFeeMin}
          deliveryFeeMax={dummyStore.deliveryFeeMax}
          address={dummyStore.storeAddress}
        />
        <AutoScrollTabs fixed={menuTabFixed} />
        <div style={{ margin: "24px 20px" }}>
          <h1 style={{ height: "2000px" }}>
            가맹점 상세페이지 Store ID: {storeId}
          </h1>
        </div>
      </div>
    </SlideInFromRight>
  );
}
