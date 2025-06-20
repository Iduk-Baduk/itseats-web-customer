import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import Header from "../../components/common/Header";
import { useShare } from "../../hooks/useShare";

import styles from "./StoreInfo.module.css";
import CommonMap from "../../components/common/CommonMap";

export default function StoreInfo() {
  const navigate = useNavigate();
  const { copyToClipboardText } = useShare();

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
        <div className={styles.map}>
          <CommonMap
            lat={dummyStore.location.lat}
            lng={dummyStore.location.lng}
            markers={[
              {
                lat: dummyStore.location.lat,
                lng: dummyStore.location.lng,
                label: dummyStore.storeName,
              },
              {
                lat: dummyUser.location.lat,
                lng: dummyUser.location.lng,
                label: "내 위치",
              },
            ]}
            height="100%"
            level={6}
          />
        </div>
        <div className={styles.storeInfoContainer}>
          <div className={styles.flexContainer}>
            <div>
              <h2>{dummyStore.storeName}</h2>
              <p>{dummyStore.storeAddress}</p>
            </div>
            <p
              className={styles.copyButton}
              onClick={() => copyToClipboardText(dummyStore.storeAddress)}
            >
              주소복사
            </p>
          </div>
          <div className={styles.businessStatus}>
            <h2>영업상태</h2>
            <p>{getBusinessStatus(dummyStore.businessStatus)}</p>
          </div>
          <div className={styles.storeDescription}>
            <h2>매장 소개</h2>
            <p>{dummyStore.description}</p>
          </div>
        </div>
      </div>
    </SlideInFromRight>
  );
}

function getBusinessStatus(status) {
  switch (status) {
    case "OPEN":
      return "영업 중";
    case "CLOSED":
      return "영업 종료";
  }
}

const dummyStore = {
  storeName: "한식세끼 1인 김치찜&김치찌개 구름점",
  description:
    "안녕하세요. 한식세끼 1인 김치찜&김치 찌개 구름점입니다. 저희 매장은 신선한 재료로 정성껏 요리합니다. 주요 메뉴는 김치찜과 김치찌개입니다. 많은 사랑 부탁드립니다.",
  storeAddress: "서울시 강남구 테헤란로 49 1층",
  location: {
    lat: 37.4979,
    lng: 127.0276,
  },
  businessStatus: "OPEN", // OPEN, CLOSED
  storePhone: "02-1234-5678",
  orderable: true,
};

const dummyUser = {
  location: {
    lat: 37.501887,
    lng: 127.039252,
  },
};
