import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
          <img
            src={menu.image}
            alt={menu.menuName}
            className={`${styles.menuImage} ${isSoldOut ? styles.dimmed : ""}`}
          />
          {isSoldOut && <span className={styles.soldOutBadge}>품절</span>}
        </div>
      ) : (
        <div className={`${styles.menuImageWrapper} ${styles.noImage}`} />
      )}
    </div>
  );
});

MenuItem.displayName = 'MenuItem';

export default MenuItem;
