import React from "react";
import OptimizedImage from "../common/OptimizedImage";
import styles from "./StoreListItem.module.css";

const StoreListItem = React.memo(({ store, onClick }) => {
  return (
    <div className={styles.storeListItem} onClick={onClick}>
      <div className={styles.storeImageContainer}>
        <OptimizedImage
          src={store.image || "/samples/banner.jpg"}
          alt={`${store.name} 가맹점 이미지`}
          className={styles.storeImage}
          width={120}
          height={80}
          priority={false}
        />
        <div className={styles.menuImageContainer}>
          <OptimizedImage
            src={store.menuImage1 || "/samples/food1.jpg"}
            alt={`${store.name} 메뉴 이미지`}
            className={styles.menuImage}
            width={40}
            height={40}
            priority={false}
          />
          <OptimizedImage
            src={store.menuImage2 || "/samples/food2.jpg"}
            alt={`${store.name} 메뉴 이미지`}
            className={styles.menuImage}
            width={40}
            height={40}
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
