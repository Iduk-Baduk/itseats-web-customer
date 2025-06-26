import Button from "../common/basic/Button";
import Card from "../common/Card";
import Tag, { StatusTag } from "../common/Tag";
import { ORDER_STATUS } from "../../constants/orderStatus";
import styles from "./OrderCard.module.css";

export default function OrderCard({
  order,
  className,
  onReorder,
  onWriteReview,
  onOpenStatus,
}) {
  // Redux 주문 데이터와 기존 더미 데이터 호환성을 위한 필드 매핑
  const orderData = {
    storeName: order.storeName || "알 수 없는 매장",
    date: order.date || order.createdAt || new Date().toLocaleString('ko-KR'),
    status: order.status || "주문 확인 중",
    price: Number(order.price || order.orderPrice || 0),
    menuSummary: order.menuSummary || "메뉴 정보 없음",
    storeImage: order.storeImage || "/images/default-store.jpg",
    isCompleted: order.isCompleted !== undefined ? order.isCompleted : 
      [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(order.status),
    showReviewButton: order.showReviewButton !== undefined ? order.showReviewButton : 
      [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(order.status),
    remainingDays: order.remainingDays,
  };

  return (
    <div className={className}>
      <Card variant="default" interactive className={styles.orderCard}>
        <div className={styles.storeInfo}>
          <div>
            <strong>{orderData.storeName}</strong>
            <p className={styles.date}>{orderData.date}</p>
            <div className={styles.statusContainer}>
              <StatusTag 
                status={orderData.status === ORDER_STATUS.DELIVERED ? 'completed' : 'pending'} 
                size="small"
              />
              <div className={styles.rating}>⭐ ⭐ ⭐ ⭐ ⭐</div>
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
              배달 현황 보기
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
