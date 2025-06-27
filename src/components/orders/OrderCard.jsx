import { useMemo } from "react";
import Button from "../common/basic/Button";
import Card from "../common/Card";
import Tag, { StatusTag } from "../common/Tag";
import { ORDER_STATUS, ORDER_STATUS_CONFIG } from "../../constants/orderStatus";
import styles from "./OrderCard.module.css";

export default function OrderCard({
  order,
  className,
  onReorder,
  onWriteReview,
  onOpenStatus,
}) {
  // Redux 주문 데이터와 기존 더미 데이터 호환성을 위한 필드 매핑 - useMemo로 최적화
  const orderData = useMemo(() => {
    const statusConfig = ORDER_STATUS_CONFIG[order.status] || {};
    
    // 상태별 한국어 표시명 매핑
    const getStatusDisplayName = (status) => {
      switch(status) {
        case ORDER_STATUS.WAITING: return "주문 접수 중";
        case ORDER_STATUS.COOKING: return "조리 중";
        case ORDER_STATUS.COOKED: return "조리 완료";
        case ORDER_STATUS.RIDER_READY: return "라이더 배차 중";
        case ORDER_STATUS.DELIVERING: return "배달 중";
        case ORDER_STATUS.DELIVERED: return "배달 완료";
        case ORDER_STATUS.COMPLETED: return "주문 완료";
        case ORDER_STATUS.CANCELED: return "주문 취소";
        default: return "상태 확인 중";
      }
    };

    // 상태별 태그 타입 결정
    const getStatusTagType = (status) => {
      switch(status) {
        case ORDER_STATUS.WAITING:
        case ORDER_STATUS.COOKING:
        case ORDER_STATUS.COOKED:
        case ORDER_STATUS.RIDER_READY:
        case ORDER_STATUS.DELIVERING:
          return "pending";
        case ORDER_STATUS.DELIVERED:
        case ORDER_STATUS.COMPLETED:
          return "completed";
        case ORDER_STATUS.CANCELED:
          return "cancelled";
        default:
          return "pending";
      }
    };
    
    return {
      storeName: order.storeName || "알 수 없는 매장",
      date: order.date || (order.createdAt ? new Date(order.createdAt).toLocaleString('ko-KR') : new Date().toLocaleString('ko-KR')),
      status: order.status || "주문 확인 중",
      statusDisplayName: getStatusDisplayName(order.status),
      statusMessage: statusConfig.message || "상태 확인 중",
      statusTagType: getStatusTagType(order.status),
      person: statusConfig.person || "잇츠잇츠",
      price: Number(order.price || order.orderPrice || order.totalAmount || 0),
      menuSummary: order.menuSummary || order.items?.map(item => item.menuName).join(", ") || "메뉴 정보 없음",
      items: order.items || [],
      orderMenuCount: order.orderMenuCount || order.items?.length || 0,
      storeImage: order.storeImage || "/samples/food1.jpg",
      isCompleted: order.isCompleted !== undefined ? order.isCompleted : 
        [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(order.status),
      showReviewButton: order.showReviewButton !== undefined ? order.showReviewButton : 
        [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(order.status),
      remainingDays: order.remainingDays,
      isActive: [ORDER_STATUS.WAITING, ORDER_STATUS.COOKING, ORDER_STATUS.COOKED, ORDER_STATUS.RIDER_READY, ORDER_STATUS.DELIVERING].includes(order.status)
    };
  }, [order]);

  return (
    <div className={className}>
      <Card variant="default" interactive className={styles.orderCard}>
        <div className={styles.storeInfo}>
          <div>
            <strong>{orderData.storeName}</strong>
            <p className={styles.date}>{orderData.date}</p>
            <div className={styles.statusContainer}>
              <StatusTag 
                status={orderData.statusTagType} 
                size="small"
              />
              <div className={styles.statusInfo}>
                <span className={styles.statusDisplayName}>{orderData.statusDisplayName}</span>
                <span className={styles.statusMessage}>{orderData.person}: {orderData.statusMessage}</span>
              </div>
              {orderData.isCompleted && (
                <div className={styles.rating}>⭐ ⭐ ⭐ ⭐ ⭐</div>
              )}
            </div>
          </div>
          <img src={orderData.storeImage} className={styles.image} />
        </div>

        <div className={styles.summaryRow}>
          <p className={styles.summary}>{orderData.menuSummary}</p>
          <div className={styles.priceMeta}>
            <span>{(orderData.price || 0).toLocaleString()}원</span>
            <Tag variant="default" size="small" className={styles.badge}>
              영수증
            </Tag>
          </div>
        </div>

        {/* 메뉴 목록 - 간략 표시 */}
        {orderData.items && orderData.items.length > 0 && (
          <div className={styles.menuList}>
            {orderData.items.slice(0, 2).map((item, index) => (
              <div key={index} className={styles.menuItem}>
                <div className={styles.menuInfo}>
                  <span className={styles.menuName}>{item.menuName}</span>
                  <span className={styles.menuQuantity}>×{item.quantity}</span>
                </div>
                <span className={styles.menuPrice}>{item.price.toLocaleString()}원</span>
              </div>
            ))}
            {orderData.items.length > 2 && (
              <div className={styles.moreMenus}>
                외 {orderData.items.length - 2}개 메뉴
              </div>
            )}
          </div>
        )}

        {/* 진행 중인 주문의 경우 진행 단계 표시 */}
        {orderData.isActive && (
          <div className={styles.progressContainer}>
            <div className={styles.progressSteps}>
              {(() => {
                const steps = [
                  { key: 'order', label: '주문접수', statuses: [ORDER_STATUS.WAITING, ORDER_STATUS.COOKING, ORDER_STATUS.COOKED, ORDER_STATUS.RIDER_READY, ORDER_STATUS.DELIVERING] },
                  { key: 'cooking', label: '조리중', statuses: [ORDER_STATUS.COOKING, ORDER_STATUS.COOKED, ORDER_STATUS.RIDER_READY, ORDER_STATUS.DELIVERING] },
                  { key: 'cooked', label: '조리완료', statuses: [ORDER_STATUS.COOKED, ORDER_STATUS.RIDER_READY, ORDER_STATUS.DELIVERING] },
                  { key: 'delivering', label: '배달중', statuses: [ORDER_STATUS.DELIVERING] }
                ];

                // 현재 진행 단계 인덱스 계산
                const getCurrentStepIndex = () => {
                  switch(orderData.status) {
                    case ORDER_STATUS.WAITING: return 0;
                    case ORDER_STATUS.COOKING: return 1;
                    case ORDER_STATUS.COOKED:
                    case ORDER_STATUS.RIDER_READY: return 2;
                    case ORDER_STATUS.DELIVERING: return 3;
                    default: return 0;
                  }
                };

                const currentStepIndex = getCurrentStepIndex();

                return steps.map((step, index) => {
                  const isActive = step.statuses.includes(orderData.status);
                  const isCurrent = index === currentStepIndex;
                  const isCompleted = index < currentStepIndex;

                  // 디버깅용 로그
                  console.log(`단계 ${index} (${step.label}):`, {
                    status: orderData.status,
                    currentStepIndex,
                    isActive,
                    isCurrent,
                    isCompleted
                  });

                  return (
                    <div 
                      key={step.key}
                      className={`${styles.progressStep} ${isActive ? styles.active : ''} ${isCurrent ? styles.current : ''} ${isCompleted ? styles.completed : ''}`}
                    >
                      <div className={styles.stepDot}></div>
                      <span>{step.label}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {orderData.isCompleted && (
            <>
              <Button 
                variant="primary" 
                size="medium"
                className={styles.reorderButton} 
                onClick={onReorder}
              >
                재주문하기
              </Button>
              <Button
                variant="line"
                size="medium"
                className={
                  orderData.showReviewButton
                    ? styles.reviewButton
                    : styles.defaultHover
                }
                onClick={onWriteReview}
              >
                {orderData.showReviewButton ? "작성한 리뷰 보기" : "리뷰 쓰기"}
              </Button>
            </>
          )}
          {!orderData.isCompleted && (
            <Button 
              variant="primary" 
              size="medium"
              className={styles.statusButton} 
              onClick={onOpenStatus}
            >
              배달 현황 자세히 보기
            </Button>
          )}
        </div>

        {orderData.remainingDays && (
          <p className={styles.remaining}>리뷰 작성 기간이 {orderData.remainingDays}일 남았습니다.</p>
        )}
      </Card>
    </div>
  );
}
