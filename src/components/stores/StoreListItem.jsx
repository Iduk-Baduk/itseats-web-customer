import styles from './StoreListItem.module.css';

export default function StoreListItem({ store, onClick }) {
  return (
    <div className={styles.storeListItem} onClick={onClick}>
      <div className={styles.storeImageContainer}>
        <img
          src="/samples/banner.jpg"
          alt="가맹점 이미지"
          className={styles.storeImage}
        />
        <div className={styles.menuImageContainer}>
          <img
            src="/samples/banner.jpg"
            alt="메뉴 이미지"
            className={styles.menuImage}
          />
          <img
            src="/samples/banner.jpg"
            alt="메뉴 이미지"
            className={styles.menuImage}
          />
        </div>
      </div>
      <h3>{store.name}</h3>
      <div className={styles.storeInfo}>
        <span>⭐ {store.review}({store.reviewCount})</span>
        <span>0.0km</span>
        <span>최소주문 0,000원</span>
      </div>
    </div>
  );
}
