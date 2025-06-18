import Button from "../common/basic/Button";
import LineButton from "../common/basic/LineButton";
import styles from "./OrderCard.module.css";

export default function OrderCard({ order, className }) {
  return (
    <div className={className}>
      <div className={styles.orderCard}>
        <div className={styles.storeInfo}>
          <div>
            <strong>{order.storeName}</strong>
            <p className={styles.date}>{order.date}</p>
            <p>배달 완료 ⭐ ⭐ ⭐ ⭐ ⭐</p>
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
          <Button className={styles.reorderButton}>재주문하기</Button>
          <LineButton className={styles.reviewButton}>작성한 리뷰 보기</LineButton>
        </div>

        <p className={styles.remaining}>리뷰 작성 기간이 6일 남았습니다.</p>
      </div>
    </div>
  );
}
