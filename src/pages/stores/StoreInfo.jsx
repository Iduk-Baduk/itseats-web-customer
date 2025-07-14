import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import Header from "../../components/common/Header";
import { useShare } from "../../hooks/useShare";
import { fetchStoreById } from "../../store/storeSlice";
import useAddressRedux from "../../hooks/useAddressRedux";

import styles from "./StoreInfo.module.css";
import CommonMap from "../../components/common/CommonMap";

export default function StoreInfo() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { copyToClipboardText } = useShare();
  const { storeId } = useParams();
  const { selectedAddress } = useAddressRedux();

  // Redux에서 매장 데이터 가져오기
  const store = useSelector(state => state.store?.currentStore);
  const storeLoading = useSelector(state => state.store?.loading || false);

  // 사용자 위치 (기본값 - 추후 위치 서비스 연동 가능)
  const userLocation = {
    lat: selectedAddress?.lat || 37.501887,
    lng: selectedAddress?.lng || 127.039252,
  };

  // 매장 데이터 로딩
  useEffect(() => {
    if (storeId) {
      dispatch(fetchStoreById(storeId));
    }
  }, [dispatch, storeId]);

  // 로딩 중이거나 매장 데이터가 없는 경우 처리
  if (storeLoading || !store) {
    return (
      <SlideInFromRight>
        <div className={styles.container}>
          <Header
            title="매장 정보"
            leftIcon="back"
            leftButtonAction={() => navigate(-1)}
            rightIcon=""
          />
          <div style={{ padding: '20px', textAlign: 'center' }}>
            매장 정보를 불러오는 중...
          </div>
        </div>
      </SlideInFromRight>
    );
  }

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
            lat={store.location?.lat || 37.4979}
            lng={store.location?.lng || 127.0276}
            markers={[
              {
                lat: store.location?.lat || 37.4979,
                lng: store.location?.lng || 127.0276,
                type: "store",
              },
              {
                lat: userLocation.lat,
                lng: userLocation.lng,
                type: "user",
              },
            ]}
            height="100%"
            level={6}
          />
        </div>
        <div className={styles.storeInfoContainer}>
          <div className={styles.flexContainer}>
            <div>
              <h2>{store.name}</h2>
              <p>{store?.address || "주소 정보 없음"}</p>
            </div>
            <p
              className={styles.copyButton}
              onClick={() => copyToClipboardText(store?.address || "")}
            >
              주소복사
            </p>
          </div>
          <div className={styles.businessStatus}>
            <h2>영업상태</h2>
            <p>{getBusinessStatus(store.orderable)}</p>
          </div>
          <div className={styles.storeDescription}>
            <h2>매장 소개</h2>
            <p>{store.description || "매장 소개가 없습니다."}</p>
          </div>
        </div>
      </div>
    </SlideInFromRight>
  );
}

function getBusinessStatus(orderable) {
  if (orderable === undefined) {
    return "영업 상태 알 수 없음";
  }
  switch (orderable) {
    case true:
      return "영업 중";
    case false:
      return "영업 종료";
  }
}
