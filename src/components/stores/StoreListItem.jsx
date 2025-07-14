import React from "react";
import OptimizedImage from "../common/OptimizedImage";
import styles from "./StoreListItem.module.css";

const StoreListItem = React.memo(({ store, onClick, ref }) => {
  return (
    <div className={styles.storeListItem} onClick={onClick} ref={ref}>
      <div className={styles.storeImageContainer}>
        <OptimizedImage
          src={store.images[0] || "/samples/banner.jpg"}
          alt={`${store.name} 가맹점 이미지`}
          className={styles.storeImage}
          width={120}
          height={164}
          priority={false}
        />
        <div className={styles.menuImageContainer}>
          <OptimizedImage
            src={store.images[1] || "/samples/food1.jpg"}
            alt={`${store.name} 메뉴 이미지`}
            className={styles.menuImage}
            width={80}
            height={80}
            priority={false}
          />
          <OptimizedImage
            src={store.images[2] || "/samples/food2.jpg"}
            alt={`${store.name} 메뉴 이미지`}
            className={styles.menuImage}
            width={80}
            height={80}
            priority={false}
          />
        </div>
      </div>
      <div className={styles.titleFlex}>
        <h3>{store.name}</h3>
        <span>{store.minutesToDelivery}분</span>
      </div>
      <div className={styles.storeInfo}>
        <span>
          ⭐ {store.review.toFixed(1)} ({store.reviewCount})
        </span>
        <span>{store.distance.toFixed(1)}km</span>
        <span>최소주문 {store.minOrderPrice.toLocaleString()}원</span>
      </div>
    </div>
  );
});

StoreListItem.displayName = 'StoreListItem';

export default StoreListItem;
