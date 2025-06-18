import styles from './OrederCard.module.css';

export default function OrderCard({ order }) {
  return (
    <div className={styles.orderCard}>
      <div className={styles.storeInfo}>
        <div>
          <strong>{order.storeName}</strong>
          <p>{order.date}</p>
          <p>배달 완료 ⭐⭐⭐⭐⭐</p>
          <p>{order.menuSummary}</p>
        </div>
        <div className={styles.image}>{order.storeImage}</div>
      </div>
      <div className={styles.meta}>
        <span>{order.price}</span>
        <span className={styles.badge}>영수증</span>
      </div>
      <div className={styles.actions}>
        <button className={styles.reorder}>재주문하기</button>
        <button className={styles.review}>작성한 리뷰 보기</button>
      </div>
      <p className={styles.remaining}>리뷰 작성 기간이 6일 남았습니다.</p>
    </div>
  );
}
