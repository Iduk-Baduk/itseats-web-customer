import styles from "./BottomButton.module.css";

export default function BottomButton({
  onClick,
  bottom,
  label,
  disabled,
  className,
  children,
  cartInfo = {
    orderPrice: 20000,
    totalPrice: 18000,
    itemCount: 11,
  },
}) {
  return (
    <button
      className={`${styles.bottomButton} ${className || ""}`}
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      style={{ bottom: bottom ? bottom : "0" }}
    >
      {!children && (
        <div className={styles.flexContainer}>
          <div>
            <span className={styles.itemCount}>{cartInfo.itemCount}</span>
            <span>카트 보기</span>
          </div>
          <div>
            <span className={styles.originalPrice}>{cartInfo.orderPrice.toLocaleString()}원</span>
            <span>{cartInfo.totalPrice.toLocaleString()}원</span>
          </div>
        </div>
      )}
      {children}
    </button>
  );
}
