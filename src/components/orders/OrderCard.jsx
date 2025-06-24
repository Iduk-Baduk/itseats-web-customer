import Button from "../common/basic/Button";
import LineButton from "../common/basic/LineButton";
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
    storeName: order.storeName || order.storeName,
    date: order.date || order.createdAt || new Date().toLocaleString('ko-KR'),
    status: order.status || order.status,
    price: order.price || order.orderPrice || 0,
    menuSummary: order.menuSummary || order.menuSummary,
    storeImage: order.storeImage || order.storeImage,
    isCompleted: order.isCompleted !== undefined ? order.isCompleted : 
      ['DELIVERED', 'COMPLETED'].includes(order.status),
    showReviewButton: order.showReviewButton !== undefined ? order.showReviewButton : 
      ['DELIVERED', 'COMPLETED'].includes(order.status),
    remainingDays: order.remainingDays,
  };

  return (
    <div className={className}>
      <div className={styles.orderCard}>
        <div className={styles.storeInfo}>
          <div>
            <strong>{orderData.storeName}</strong>
            <p className={styles.date}>{orderData.date}</p>
            <p>{orderData.status} ⭐ ⭐ ⭐ ⭐ ⭐</p>
          </div>
          <img src={orderData.storeImage} className={styles.image} />
        </div>

        <div className={styles.summaryRow}>
          <p className={styles.summary}>{orderData.menuSummary}</p>
          <div className={styles.priceMeta}>
            <span>{orderData.price.toLocaleString()}원</span>
            <span className={styles.badge}>영수증</span>
          </div>
        </div>

        <div className={styles.actions}>
          {orderData.isCompleted && (
            <>
              <Button className={styles.reorderButton} onClick={onReorder}>
                재주문하기
              </Button>
              <LineButton
                className={
                  orderData.showReviewButton
                    ? styles.reviewButton
                    : styles.defaultHover
                }
                onClick={onWriteReview}
              >
                {orderData.showReviewButton ? "작성한 리뷰 보기" : "리뷰 쓰기"}
              </LineButton>
            </>
          )}
          {!orderData.isCompleted && (
            <Button className={styles.statusButton} onClick={onOpenStatus}>
              배달 현황 보기
            </Button>
          )}
        </div>

        {orderData.remainingDays && (
          <p className={styles.remaining}>리뷰 작성 기간이 {orderData.remainingDays}일 남았습니다.</p>
        )}
      </div>
    </div>
  );
}
