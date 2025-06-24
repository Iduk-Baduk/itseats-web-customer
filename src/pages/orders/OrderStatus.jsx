import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import CommonMap from "../../components/common/CommonMap";
import OrderProgress from "../../components/orders/OrderProgress";
import LineButton from "../../components/common/basic/LineButton";
import { useOrderStatus } from "../../hooks/useOrderStatus";
import styles from "./OrderStatus.module.css";

export default function OrderStatus() {
  const navigate = useNavigate();
  
  // Redux 훅 사용
  const {
    orderData,
    orderStatusInfo,
    etaInfo,
    progressStep,
    isLoading,
    error,
    updateStatus,
    isActiveOrder
  } = useOrderStatus();

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <div className={styles.container}>
        <Header
          title=""
          leftIcon="close"
          rightIcon={null}
          leftButtonAction={() => navigate(-1)}
        />
        <div className={styles.statusContainer}>
          <p>주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className={styles.container}>
        <Header
          title=""
          leftIcon="close"
          rightIcon={null}
          leftButtonAction={() => navigate(-1)}
        />
        <div className={styles.statusContainer}>
          <p>주문 정보를 불러오는데 실패했습니다: {error}</p>
        </div>
      </div>
    );
  }

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
                lat={orderData.storeLocation.lat}
                lng={orderData.storeLocation.lng}
                markers={[
                  {
                    lat: orderData.storeLocation.lat,
                    lng: orderData.storeLocation.lng,
                    type: "store",
                  },
                  {
                    lat: orderData.destinationLocation.lat,
                    lng: orderData.destinationLocation.lng,
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
            
            <OrderProgress orderStatus={orderData.orderStatus} />

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
                <p className={styles.storeName}>{orderData.storeName}</p>
                <p>
                  <span>주문번호 {orderData.orderNumber}</span>
                  <span>
                    {orderData.orderPrice.toLocaleString()}원 (메뉴{" "}
                    {orderData.orderMenuCount}개)
                  </span>
                </p>
              </div>
              <div className={styles.deliveryInfo}>
                <p className={styles.storeName}>배달 주소</p>
                <span>{orderData.deliveryAddress}</span>
                <div className={styles.riderRequest}>
                  <span>배달 요청사항</span>
                  <span>{orderData.riderRequest}</span>
                </div>
              </div>
            </div>

            {/* 도움말 버튼 - 진행 중인 주문에만 표시 */}
            {isActiveOrder && (
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
