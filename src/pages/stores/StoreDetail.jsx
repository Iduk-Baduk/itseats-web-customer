import { useNavigate, useParams } from "react-router-dom";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import HeaderStoreDetail from "../../components/common/HeaderStoreDetail";
import { useShare } from "../../hooks/useShare";

import styles from "./StoreDetail.module.css";
import { useEffect, useState } from "react";

const dummyStore = {
  images: [
    { image: "/samples/banner.jpg" },
    { image: "/samples/banner.jpg" },
    { image: "/samples/banner.jpg" },
  ],
  isLiked: true,
  reviewRating: 4.9,
  reviewCount: 13812,
  storeName: "스타벅스 강남점",
  description: "커피 전문점입니다.",
  storeAddress: "서울시 강남구 테헨란로",
  location: {
    lat: 37.4979,
    lng: 127.0276,
  },
  businessStatus: "OPEN",
  storePhone: "02-1234-5678",
  orderable: true,
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

  // 아래로 스크롤 되었을 때 헤더 배경을 흰색으로 변경
  useEffect(() => {
    const onScroll = () => {
      const target = document.getElementById("intro");
      if (!target) return;

      const rect = target.getBoundingClientRect();
      // intro가 화면 밖으로 완전히 가려졌는지 확인
      setTransparent(rect.bottom > 0);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
          <img src={dummyStore.images[0].image} alt="Store Banner" />
        </div>
        <div style={{ margin: "80px 20px" }}>
          <h1 style={{ height: "2000px" }}>
            가맹점 상세페이지 Store ID: {storeId}
          </h1>
        </div>
      </div>
    </SlideInFromRight>
  );
}
