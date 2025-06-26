import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import OptimizedImage from "../common/OptimizedImage";
import styles from "./MenuItem.module.css";

const MenuItem = React.memo(({ storeId, menu }) => {
  const navigate = useNavigate();

  const isSoldOut = menu.menuStatus === "OUT_OF_STOCK";

  const handleClick = useCallback(() => {
    navigate(`/stores/${storeId}/menus/${menu.menuId}`);
  }, [navigate, storeId, menu.menuId]);

  return (
    <div className={styles.menuItem} onClick={handleClick}>
      <div className={styles.menuInfo}>
        <h3 className={`${styles.menuName} ${isSoldOut ? styles.soldOut : ""}`}>
          {menu.menuName}
        </h3>
        <p className={`${styles.menuPrice} ${isSoldOut ? styles.soldOut : ""}`}>
          {menu.menuPrice.toLocaleString()}원
        </p>
      </div>
      {menu.image ? (
        <div className={styles.menuImageWrapper}>
          <OptimizedImage
            src={menu.image}
            alt={menu.menuName}
            className={`${styles.menuImage} ${isSoldOut ? styles.dimmed : ""}`}
            width={80}
            height={80}
            priority={false}
            placeholder="/samples/favoriteDefault.png"
          />
          {isSoldOut && <span className={styles.soldOutBadge}>품절</span>}
        </div>
      ) : (
        <div className={`${styles.menuImageWrapper} ${styles.noImage}`}>
          <OptimizedImage
            src="/samples/favoriteDefault.png"
            alt="기본 메뉴 이미지"
            className={styles.menuImage}
            width={80}
            height={80}
            priority={false}
          />
        </div>
      )}
    </div>
  );
});

MenuItem.displayName = 'MenuItem';

export default MenuItem;
