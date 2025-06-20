import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import HeaderStoreDetail from "../../components/stores/HeaderStoreDetail";
import { useShare } from "../../hooks/useShare";
import PhotoSlider from "../../components/stores/PhotoSlider";
import DeliveryTypeTab from "../../components/stores/DeliveryTypeTab";
import AutoScrollTabs from "../../components/stores/AutoScrollTabs";

import styles from "./StoreDetail.module.css";

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
          isFavorite={dummyStore.isLiked}
          favoriteButtonAction={() => {}}
        />
        <div id="intro" className={styles.intro}>
          <PhotoSlider images={dummyStore.images.map((img) => img.image)} />
          <div className={styles.introContent}>
            <h1>{dummyStore.storeName}</h1>
            <div className={styles.storeInfoButton}>
              <span>
                ⭐ {dummyStore.reviewRating}({dummyStore.reviewCount})
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
          defaultTime={dummyStore.defaultTime}
          takeoutTime={dummyStore.takeoutTime}
          minimumOrderPrice={dummyStore.minimumOrderPrice}
          deliveryFeeMin={dummyStore.deliveryFeeMin}
          deliveryFeeMax={dummyStore.deliveryFeeMax}
          address={dummyStore.storeAddress}
        />
        <AutoScrollTabs
          storeId={dummyStore.storeId}
          menus={dummyStore.menus}
          fixed={menuTabFixed}
        />
      </div>
    </SlideInFromRight>
  );
}

const dummyStore = {
  storeId: 1,
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
      menuPrice: 2000,
      menuStatus: "ONSALE",
      menuGroupName: "음료",
      image: "/samples/food1.jpg",
    },
    {
      menuId: 13,
      menuName: "초코라떼",
      menuPrice: 2000,
      menuStatus: "OUT_OF_STOCK",
      menuGroupName: "음료",
      image: "/samples/food2.jpg",
    },
    {
      menuId: 25,
      menuName: "커피번",
      menuPrice: 3500,
      menuStatus: "ONSALE",
      menuGroupName: "베이커리",
      image: "/samples/food3.jpg",
    },
    {
      menuId: 31,
      menuName: "치즈케이크",
      menuPrice: 4000,
      menuStatus: "ONSALE",
      menuGroupName: "디저트",
    },
    {
      menuId: 32,
      menuName: "허니브레드",
      menuPrice: 4500,
      menuStatus: "ONSALE",
      menuGroupName: "디저트",
    },
    {
      menuId: 33,
      menuName: "에그샐러드샌드위치",
      menuPrice: 5000,
      menuStatus: "ONSALE",
      menuGroupName: "샌드위치",
    },
    {
      menuId: 34,
      menuName: "베이컨샌드위치",
      menuPrice: 5200,
      menuStatus: "OUT_OF_STOCK",
      menuGroupName: "샌드위치",
    },
    {
      menuId: 35,
      menuName: "오렌지주스",
      menuPrice: 3000,
      menuStatus: "ONSALE",
      menuGroupName: "음료",
    },
    {
      menuId: 36,
      menuName: "딸기스무디",
      menuPrice: 3500,
      menuStatus: "ONSALE",
      menuGroupName: "음료",
    },
    {
      menuId: 37,
      menuName: "바닐라라떼",
      menuPrice: 2500,
      menuStatus: "ONSALE",
      menuGroupName: "음료",
    },
    {
      menuId: 38,
      menuName: "크루아상",
      menuPrice: 3000,
      menuStatus: "ONSALE",
      menuGroupName: "베이커리",
    },
    {
      menuId: 39,
      menuName: "블루베리머핀",
      menuPrice: 3200,
      menuStatus: "OUT_OF_STOCK",
      menuGroupName: "베이커리",
    },
    {
      menuId: 40,
      menuName: "딸기케이크",
      menuPrice: 4800,
      menuStatus: "ONSALE",
      menuGroupName: "디저트",
    },
    {
      menuId: 41,
      menuName: "카푸치노",
      menuPrice: 2300,
      menuStatus: "ONSALE",
      menuGroupName: "음료",
    },
    {
      menuId: 42,
      menuName: "레몬에이드",
      menuPrice: 2800,
      menuStatus: "ONSALE",
      menuGroupName: "음료",
    },
    {
      menuId: 43,
      menuName: "치아바타",
      menuPrice: 3900,
      menuStatus: "ONSALE",
      menuGroupName: "베이커리",
    },
    {
      menuId: 44,
      menuName: "햄치즈샌드위치",
      menuPrice: 5300,
      menuStatus: "ONSALE",
      menuGroupName: "샌드위치",
    },
    {
      menuId: 45,
      menuName: "티라미수",
      menuPrice: 4700,
      menuStatus: "OUT_OF_STOCK",
      menuGroupName: "디저트",
    },
    {
      menuId: 46,
      menuName: "녹차라떼",
      menuPrice: 2700,
      menuStatus: "ONSALE",
      menuGroupName: "음료",
    },
    {
      menuId: 47,
      menuName: "플레인스콘",
      menuPrice: 3100,
      menuStatus: "ONSALE",
      menuGroupName: "베이커리",
    },
  ],
};
