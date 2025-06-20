import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import Header from "../../components/common/Header";
import { useShare } from "../../hooks/useShare";

import styles from "./StoreInfo.module.css";

export default function StoreInfo() {
  const navigate = useNavigate();
  const { copyToClipboard, shareViaWebAPI } = useShare();

  const { storeId } = useParams();

  return (
    <SlideInFromRight>
      <div className={styles.container}>
        <Header
          title="매장 정보"
          leftIcon="back"
          leftButtonAction={() => {
            navigate(-1);
          }}
          rightIcon=""
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
};
