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
  return (
    <div className={className}>
      <div className={styles.orderCard}>
        <div className={styles.storeInfo}>
          <div>
            <strong>{order.storeName}</strong>
            <p className={styles.date}>{order.date}</p>
            <p>{order.status} ⭐ ⭐ ⭐ ⭐ ⭐</p>
          </div>
          <img src={order.storeImage} className={styles.image} />
        </div>

        <div className={styles.summaryRow}>
          <p className={styles.summary}>{order.menuSummary}</p>
          <div className={styles.priceMeta}>
            <span>{order.price.toLocaleString()}원</span>
            <span className={styles.badge}>영수증</span>
          </div>
        </div>

        <div className={styles.actions}>
          {order.isCompleted && (
            <>
              <Button className={styles.reorderButton} onClick={onReorder}>
                재주문하기
              </Button>
              <LineButton
                className={
                  order.showReviewButton
                    ? styles.reviewButton
                    : styles.defaultHover
                }
                onClick={onWriteReview}
              >
                {order.showReviewButton ? "작성한 리뷰 보기" : "리뷰 쓰기"}
              </LineButton>
            </>
          )}
          {!order.isCompleted && (
            <Button className={styles.statusButton} onClick={onOpenStatus}>
              배달 현황 보기
            </Button>
          )}
        </div>

        {order.remainingDays && (
          <p className={styles.remaining}>리뷰 작성 기간이 {order.remainingDays}일 남았습니다.</p>
        )}
      </div>
    </div>
  );
}
