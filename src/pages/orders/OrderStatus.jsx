import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import CommonMap from "../../components/common/CommonMap";
import OrderProgress from "../../components/orders/OrderProgress";
import LineButton from "../../components/common/basic/LineButton";
import styles from "./OrderStatus.module.css";

export default function OrderStatus() {
  const navigate = useNavigate();

  const [orderStatusString, setOrderStatusString] = useState(
    getOrderStatusString(dummyOrderStatus.orderStatus)
  );

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
          <div className={styles.statusContainer}>
            <div className={styles.statusIndicator}>
              <span className={styles.statusText}>도착 예정시간</span>
              <p className={styles.estimatedTime}>
                8분<span>(오후 07:03)</span>
              </p>
            </div>
            <OrderProgress currentStep={orderStatusString.step} />

            <div className={styles.statusPerson}>
              {orderStatusString.image && (
                <img
                  src={orderStatusString.image}
                  alt={orderStatusString.person}
                />
              )}
              <div>
                <span>{orderStatusString.person}</span>
                <p>{orderStatusString.message}</p>
              </div>
            </div>

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

            <LineButton className={styles.helpButton}>
              <p>도움이 필요하신가요?</p>
            </LineButton>
          </div>
        </div>
      </div>
    </SlideInFromRight>
  );
}

function getOrderStatusString(status) {
  switch (status) {
    case "WAITING":
      return {
        step: 0,
        person: "사장님",
        message: "주문을 접수하고 있어요",
        image: "/icons/order/owner.jpg",
      };
    case "COOKING":
      return {
        step: 1,
        person: "사장님",
        message: "음식을 맛있게 조리하고 있어요",
        image: "/icons/order/owner.jpg",
      };
    case "COOKED":
      return {
        step: 2,
        person: "사장님",
        message: "음식을 조리를 완료했어요",
        image: "/icons/order/owner.jpg",
      };
    case "RIDER_READY":
      return {
        step: 2,
        person: "배달파트너",
        message: "음식을 가지러 가고 있어요",
        image: "/icons/order/rider.jpg",
      };
    case "DELIVERING":
      return {
        step: 2,
        person: "배달파트너",
        message: "배달 중이에요",
        image: "/icons/order/rider.jpg",
      };
    case "DELIVERED": {
      return {
        step: 3,
        person: "배달파트너",
        message: "목적지로 배달을 완료했어요",
        image: "/icons/order/rider.jpg",
      };
    }
    case "COMPLETED":
      return {
        step: 4,
        person: "잇츠잇츠",
        message: "주문이 완료되었어요",
      };
    case "CANCELED":
      return {
        step: -1,
        person: "잇츠잇츠",
        message: "주문이 취소되었어요",
      };
    default:
      return {
        step: -1,
        person: "알 수 없음",
        message: "주문 상태를 알 수 없어요",
      };
  }
}

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
