import { useMemo, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/common/Header";
import SlideInFromRight from "../../components/animation/SlideInFromRight";
import CommonMap from "../../components/common/CommonMap";
import OrderProgress from "../../components/orders/OrderProgress";
import LineButton from "../../components/common/basic/LineButton";
import { useOrderStatus } from "../../hooks/useOrderStatus";
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
  const [statusChange, setStatusChange] = useState(null);
  
  // URL 파라미터에서 orderId 추출
  const { orderId } = useParams();
  const {
    orderData,
    isLoading,
    error,
    hasData,
    orderStatusInfo,
    etaInfo,
    progressStep,
    updateStatus,
    isActiveOrder,
    isCompletedOrder,
    isCanceledOrder
  } = useOrderStatus(orderId);

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

  // 주문 상태 변경 감지
  useEffect(() => {
    if (statusChange) {
      // 상태 변경 알림 처리 로직은 향후 구현
      // 예: 토스트 메시지, 푸시 알림 등
    }
  }, [statusChange]);

  // 로딩 상태 처리
  if (isLoading) {
    return <StatusLayout message="주문 정보를 불러오는 중..." navigate={navigate} />;
  }

  // 사용자 친화적 에러 메시지 변환
  const getUserFriendlyErrorMessage = (error) => {
    if (error?.includes('Network') || error?.includes('fetch')) {
      return '네트워크 연결을 확인해 주세요.';
    }
    if (error?.includes('404') || error?.includes('not found')) {
      return '주문 정보를 찾을 수 없습니다.';
    }
    if (error?.includes('500') || error?.includes('server')) {
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    }
    if (error?.includes('timeout')) {
      return '요청 시간이 초과되었습니다. 다시 시도해 주세요.';
    }
    return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  };

  // 에러 상태 처리
  if (error) {
    return (
      <div className={styles.container}>
        <Header
          title="주문 오류"
          leftIcon="close"
          rightIcon={null}
          leftButtonAction={() => navigate(-1)}
        />
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>주문 정보를 불러오는데 실패했습니다</h2>
          <p>{getUserFriendlyErrorMessage(error)}</p>
          <div className={`${styles.errorActions} btn-group`}>
            <button 
              onClick={() => window.location.reload()}
              className={`btn btn-primary ${styles.retryButton}`}
            >
              다시 시도
            </button>
            <button 
              onClick={() => navigate('/cart')}
              className={`btn btn-secondary ${styles.primaryButton}`}
            >
              장바구니로 돌아가기
            </button>
            <button 
              onClick={() => navigate('/')}
              className={`btn btn-secondary ${styles.secondaryButton}`}
            >
              홈으로 이동
            </button>
          </div>
        </div>
      </div>
    );
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
            
            {/* 주문 진행 상태 표시 */}
            <div className={styles.progressContainer}>
              <OrderProgress orderStatus={safeOrderData.orderStatus} />
            </div>

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

              {/* 메뉴 상세 정보 */}
              {(orderData?.items || orderData?.orderMenus) && (orderData.items?.length > 0 || orderData.orderMenus?.length > 0) && (
                <div className={styles.menuDetails}>
                  <p className={styles.sectionTitle}>주문 메뉴</p>
                  <div className={styles.menuList}>
                    {(orderData.items || orderData.orderMenus || []).map((item, index) => (
                      <div key={index} className={styles.menuItem}>
                        <div className={styles.menuHeader}>
                          <div className={styles.menuInfo}>
                            <span className={styles.menuName}>{item.menuName}</span>
                            <span className={styles.menuQuantity}>×{item.quantity}</span>
                          </div>
                          <span className={styles.menuPrice}>
                            {(item.price || item.menuTotalPrice || 0).toLocaleString()}원
                          </span>
                        </div>
                        {(item.options || item.menuOptions) && (item.options?.length > 0 || item.menuOptions?.length > 0) && (
                          <div className={styles.menuOptions}>
                            {(item.options || item.menuOptions || []).map((option, optIndex) => (
                              <div key={optIndex} className={styles.optionItem}>
                                <span className={styles.optionName}>
                                  {option.name || option.optionName}: {option.value || option.optionValue}
                                </span>
                                {(option.price || option.optionPrice || 0) > 0 && (
                                  <span className={styles.optionPrice}>
                                    +{(option.price || option.optionPrice || 0).toLocaleString()}원
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
