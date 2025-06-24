import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import CommonMap from "../../components/common/CommonMap";
import OrderProgress from "../../components/orders/OrderProgress";
import LineButton from "../../components/common/basic/LineButton";
import { ORDER_STATUS_CONFIG } from "../../constants/orderStatus";
import { calculateETA, getOrderStep, isValidOrderStatus } from "../../utils/orderUtils";
import styles from "./OrderStatus.module.css";

export default function OrderStatus() {
  const navigate = useNavigate();

  // 주문 상태 정보 계산 (useMemo로 성능 최적화)
  const orderStatusInfo = useMemo(() => {
    const status = dummyOrderStatus.orderStatus;
    
    if (!isValidOrderStatus(status)) {
      console.warn(`Unknown order status: ${status}`);
      return {
        step: -1,
        person: "잇츠잇츠",
        message: "주문 상태를 확인 중입니다",
        image: null,
        showMap: false,
        showETA: false
      };
    }
    
    return ORDER_STATUS_CONFIG[status];
  }, []);

  // 도착 예정시간 계산
  const etaInfo = useMemo(() => {
    return calculateETA(dummyOrderStatus.deliveryEta);
  }, []);

  // 진행률 단계 계산
  const progressStep = useMemo(() => {
    return getOrderStep(dummyOrderStatus.orderStatus);
  }, []);

  return (
    <SlideInFromRight>
      <div>
        <Header
          title=""
          leftIcon="close"
          rightIcon={null}
          leftButtonAction={() => {
            navigate(-1);
          }}
        />
        <div className={styles.container}>
          {/* 지도 표시 - 상태에 따라 조건부 렌더링 */}
          {orderStatusInfo.showMap && (
            <div className={styles.map}>
              <CommonMap
                lat={dummyOrderStatus.storeLocation.lat}
                lng={dummyOrderStatus.storeLocation.lng}
                markers={[
                  {
                    lat: dummyOrderStatus.storeLocation.lat,
                    lng: dummyOrderStatus.storeLocation.lng,
                    type: "store",
                  },
                  {
                    lat: dummyOrderStatus.destinationLocation.lat,
                    lng: dummyOrderStatus.destinationLocation.lng,
                    type: "user",
                  },
                ]}
                height="100%"
                level={6}
              />
            </div>
          )}
          
          <div className={styles.statusContainer}>
            {/* 도착 예정시간 표시 - 상태에 따라 조건부 렌더링 */}
            {orderStatusInfo.showETA && etaInfo && (
              <div className={styles.statusIndicator}>
                <span className={styles.statusText}>도착 예정시간</span>
                <p className={styles.estimatedTime}>
                  {etaInfo.minutes}분<span>({etaInfo.timeString})</span>
                </p>
              </div>
            )}
            
            <OrderProgress orderStatus={dummyOrderStatus.orderStatus} />

            {/* 주문 상태 정보 표시 */}
            <div className={styles.statusPerson}>
              {orderStatusInfo.image && (
                <img
                  src={orderStatusInfo.image}
                  alt={orderStatusInfo.person}
                />
              )}
              <div>
                <span>{orderStatusInfo.person}</span>
                <p>{orderStatusInfo.message}</p>
              </div>
            </div>

            {/* 주문 상세 정보 */}
            <div className={styles.orderDetails}>
              <div className={styles.orderInfo}>
                <p className={styles.storeName}>{dummyOrderStatus.storeName}</p>
                <p>
                  <span>주문번호 {dummyOrderStatus.orderNumber}</span>
                  <span>
                    {dummyOrderStatus.orderPrice.toLocaleString()}원 (메뉴{" "}
                    {dummyOrderStatus.orderMenuCount}개)
                  </span>
                </p>
              </div>
              <div className={styles.deliveryInfo}>
                <p className={styles.storeName}>배달 주소</p>
                <span>{dummyOrderStatus.deliveryAddress}</span>
                <div className={styles.riderRequest}>
                  <span>배달 요청사항</span>
                  <span>{dummyOrderStatus.riderRequest}</span>
                </div>
              </div>
            </div>

            {/* 도움말 버튼 - 진행 중인 주문에만 표시 */}
            {orderStatusInfo.showMap && (
              <LineButton className={styles.helpButton}>
                <p>도움이 필요하신가요?</p>
              </LineButton>
            )}
          </div>
        </div>
      </div>
    </SlideInFromRight>
  );
}

// 더미 데이터 (기존과 동일하게 유지)
const dummyOrderStatus = {
  deliveryEta: "2025-06-11T08:11:00",
  orderStatus: "COOKED",
  storeName: "도미노피자 구름톤점",
  orderNumber: "14NKFA",
  orderPrice: 15900,
  orderMenuCount: 1,
  deliveryAddress: "경기 성남시 판교로 242 PDC A동 902호",
  destinationLocation: { lat: 37.501887, lng: 127.039252 },
  storeLocation: { lat: 37.4979, lng: 127.0276 },
  riderRequest: "문 앞에 놔주세요 (초인종 O)",
};
