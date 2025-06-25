import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import CommonMap from "../../components/common/CommonMap";
import OrderProgress from "../../components/orders/OrderProgress";
import LineButton from "../../components/common/basic/LineButton";
import { useOrderStatus } from "../../hooks/useOrderStatus";
import useOrderTracking from "../../hooks/useOrderTracking";
import styles from "./OrderStatus.module.css";

// 공통 레이아웃 컴포넌트
const StatusLayout = ({ message, navigate }) => (
  <div className={styles.container}>
    <Header
      title=""
      leftIcon="close"
      rightIcon={null}
      leftButtonAction={() => navigate(-1)}
    />
    <div className={styles.statusContainer}>
      <p>{message}</p>
    </div>
  </div>
);

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

  // 실시간 주문 추적 활성화
  const { isTracking, refreshStatus } = useOrderTracking(orderData?.id, {
    autoStart: isActiveOrder,
    pollingInterval: 8000, // 8초마다 폴링
    onStatusChange: (statusChange) => {
      console.log('🔔 주문 상태 변경 알림:', statusChange);
      // TODO: 푸시 알림이나 토스트 표시
    }
  });

  // 안전한 데이터 접근을 위한 기본값 설정 - useMemo로 최적화
  const safeOrderData = useMemo(() => {
    if (!orderData) return {
      storeName: "매장명 없음",
      orderNumber: "주문번호 없음",
      orderPrice: 0,
      orderMenuCount: 0,
      deliveryAddress: "주소 정보 없음",
      riderRequest: "요청사항 없음",
      storeLocation: { lat: 37.4979, lng: 127.0276 },
      destinationLocation: { lat: 37.501887, lng: 127.039252 },
      orderStatus: "UNKNOWN"
    };
    
    return {
      storeName: orderData.storeName || "매장명 없음",
      orderNumber: orderData.orderNumber || "주문번호 없음",
      orderPrice: orderData.orderPrice || 0,
      orderMenuCount: orderData.orderMenuCount || 0,
      deliveryAddress: orderData.deliveryAddress || "주소 정보 없음",
      riderRequest: orderData.riderRequest || "요청사항 없음",
      storeLocation: orderData.storeLocation || { lat: 37.4979, lng: 127.0276 },
      destinationLocation: orderData.destinationLocation || { lat: 37.501887, lng: 127.039252 },
      orderStatus: orderData.orderStatus || "UNKNOWN"
    };
  }, [orderData]);

  // 로딩 상태 처리
  if (isLoading) {
    return <StatusLayout message="주문 정보를 불러오는 중..." navigate={navigate} />;
  }

  // 에러 상태 처리
  if (error) {
    return <StatusLayout message={`주문 정보를 불러오는데 실패했습니다: ${error}`} navigate={navigate} />;
  }

  // 필수 데이터 검증
  if (!orderData || !orderStatusInfo) {
    return <StatusLayout message="주문 정보를 찾을 수 없습니다." navigate={navigate} />;
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
          {orderStatusInfo.showMap && safeOrderData.storeLocation && safeOrderData.destinationLocation && (
            <div className={styles.map}>
              <CommonMap
                lat={safeOrderData.storeLocation.lat}
                lng={safeOrderData.storeLocation.lng}
                markers={[
                  {
                    lat: safeOrderData.storeLocation.lat,
                    lng: safeOrderData.storeLocation.lng,
                    type: "store",
                  },
                  {
                    lat: safeOrderData.destinationLocation.lat,
                    lng: safeOrderData.destinationLocation.lng,
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
            
            <OrderProgress orderStatus={safeOrderData.orderStatus} />

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
                <p className={styles.storeName}>{safeOrderData.storeName}</p>
                <p>
                  <span>주문번호 {safeOrderData.orderNumber}</span>
                  <span>
                    {safeOrderData.orderPrice.toLocaleString()}원 (메뉴{" "}
                    {safeOrderData.orderMenuCount}개)
                  </span>
                </p>
              </div>
              <div className={styles.deliveryInfo}>
                <p className={styles.storeName}>배달 주소</p>
                <span>{safeOrderData.deliveryAddress}</span>
                <div className={styles.riderRequest}>
                  <span>배달 요청사항</span>
                  <span>{safeOrderData.riderRequest}</span>
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
