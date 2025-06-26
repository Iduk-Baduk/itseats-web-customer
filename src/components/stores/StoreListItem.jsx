import React from "react";
import styles from "./StoreListItem.module.css";

const StoreListItem = React.memo(({ store, onClick }) => {
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
      <div className={styles.titleFlex}>
        <h3>{store.name}</h3>
        <span>{store.minutesToDelivery}분</span>
      </div>
      <div className={styles.storeInfo}>
        <span>
          ⭐ {store.review}({store.reviewCount})
        </span>
        <span>0.0km</span>
        <span>최소주문 0,000원</span>
      </div>
    </div>
  );
});

StoreListItem.displayName = 'StoreListItem';

export default StoreListItem;
