import { useMemo, useEffect, useCallback } from "react";
import { useOrderTracking } from "../../hooks/useOrderTracking";
import Button from "../common/basic/Button";
import Card from "../common/Card";
import Tag, { StatusTag } from "../common/Tag";
import { ORDER_STATUS, ORDER_STATUS_CONFIG } from "../../constants/orderStatus";
import styles from "./OrderCard.module.css";
import { logger } from "../../utils/logger";
import OrderProgress from "./OrderProgress";
import React from "react";

function OrderCard({
  order,
  className,
  onReorder,
  onWriteReview,
  onViewReview,
  onOpenStatus,
}) {
  const handleStatusChange = useCallback(({ currentStatus, orderData }) => {
    logger.log(`🔄 주문 ${order.id} 상태 변경: ${currentStatus}`);
  }, [order.id]);

  const { startTracking, stopTracking } = useOrderTracking(order.id, {
    autoStart: false,
    onStatusChange: handleStatusChange,
    pollingInterval: 5000,
  });

  useEffect(() => {
    const ACTIVE_STATUSES = [
      ORDER_STATUS.WAITING,
      ORDER_STATUS.COOKING,
      ORDER_STATUS.COOKED,
      ORDER_STATUS.RIDER_READY,
      ORDER_STATUS.DELIVERING,
    ];
    const initialStatus = order.orderStatus;
    const isInitiallyActive = ACTIVE_STATUSES.includes(initialStatus);

    if (isInitiallyActive) {
      logger.log(`🔄 주문 ${order.id} 추적 시작 (초기 상태: ${initialStatus})`);
      startTracking();
    }

    return () => {
      if (isInitiallyActive) {
        logger.log(`⏹️ 주문 ${order.id} 추적 중단`);
        stopTracking();
      }
    };
  }, [order.id, order.orderStatus]);

  const orderData = useMemo(() => {
    const statusConfig = ORDER_STATUS_CONFIG[order.orderStatus] || {};

    const getStatusDisplayName = (status) => {
      switch (status) {
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

    const getStatusTagType = (status) => {
      switch (status) {
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

    const isCompleted = [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(order.orderStatus);

    return {
      storeName: order.storeName || "알 수 없는 매장",
      date: order.date || (order.createdAt ? new Date(order.createdAt).toLocaleString('ko-KR') : new Date().toLocaleString('ko-KR')),
      orderStatus: order.orderStatus || "주문 확인 중",
      statusDisplayName: getStatusDisplayName(order.orderStatus),
      statusMessage: statusConfig.message || "상태 확인 중",
      statusTagType: getStatusTagType(order.orderStatus),
      person: statusConfig.person || "잇츠잇츠",
      price: Number(order.price || order.orderPrice || order.totalAmount || 0),
      menuSummary: order.menuSummary || order.items?.map((item) => item.menuName).join(", ") || "메뉴 정보 없음",
      items: order.items || [],
      orderMenuCount: order.orderMenuCount || order.items?.length || 0,
      storeImage: order.storeImage || "/samples/food1.jpg",
      isCompleted,
      hasReview: order.hasReview === true,
      remainingDays: order.remainingDays,
      isActive: [ORDER_STATUS.WAITING, ORDER_STATUS.COOKING, ORDER_STATUS.COOKED, ORDER_STATUS.RIDER_READY, ORDER_STATUS.DELIVERING].includes(order.orderStatus),
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
              <StatusTag status={orderData.statusTagType} size="small" />
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
            <span>{orderData.price.toLocaleString()}원</span>
            <Tag variant="default" size="small" className={styles.badge}>
              영수증
            </Tag>
          </div>
        </div>

        {orderData.items.length > 0 && (
          <div className={styles.menuList}>
            {orderData.items.slice(0, 2).map((item, index) => (
              <div key={index} className={styles.menuItem}>
                <div className={styles.menuInfo}>
                  <span className={styles.menuName}>{item.menuName}</span>
                  <span className={styles.menuQuantity}>×{item.quantity}</span>
                </div>
                <span className={styles.menuPrice}>{Number(item.price).toLocaleString()}원</span>
              </div>
            ))}
            {orderData.items.length > 2 && (
              <div className={styles.moreMenus}>
                외 {orderData.items.length - 2}개 메뉴
              </div>
            )}
          </div>
        )}

        {orderData.isActive && (
          <div className={styles.progressContainer}>
            <OrderProgress orderStatus={orderData.orderStatus} />
          </div>
        )}

        <div className={styles.actions}>
          {orderData.isCompleted && (
            <>
              <Button variant="primary" size="medium" className={styles.reorderButton} onClick={onReorder}>
                재주문하기
              </Button>
              {orderData.hasReview ? (
                <Button variant="line" size="medium" className={styles.reviewButton} onClick={onViewReview}>
                  작성한 리뷰 보기
                </Button>
              ) : (
                <Button variant="line" size="medium" className={styles.reviewButton} onClick={onWriteReview}>
                  리뷰 쓰기
                </Button>
              )}
            </>
          )}
          {!orderData.isCompleted && (
            <Button variant="primary" size="medium" className={styles.statusButton} onClick={onOpenStatus}>
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

export default React.memo(OrderCard, (prevProps, nextProps) => {
  return prevProps.order.id === nextProps.order.id &&
         prevProps.order.orderStatus === nextProps.order.orderStatus &&
         prevProps.order.hasReview === nextProps.order.hasReview;
});
