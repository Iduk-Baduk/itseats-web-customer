import styles from "./BottomButton.module.css";

export default function BottomButton({
  onClick,
  bottom,
  label,
  disabled = false,
  className,
  children,
  cartInfo, // 💡 필수로 전달받음
}) {
  if (!cartInfo) return null; // cartInfo 없으면 렌더링 생략

  return (
    <button
      className={`${styles.bottomButton} ${className || ""}`}
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      style={{ bottom: bottom || "0" }}
    >
      {!children && (
        <div className={styles.flexContainer}>
          <div>
            <span className={styles.itemCount}>{cartInfo.itemCount}</span>
            <span>카트 보기</span>
          </div>
          <div>
            {cartInfo.orderPrice !== cartInfo.totalPrice && (
              <span className={styles.originalPrice}>
                {cartInfo.orderPrice.toLocaleString()}원
              </span>
            )}
            <span>{cartInfo.totalPrice.toLocaleString()}원</span>
          </div>
        </div>
      )}
      {children}
    </button>
  );
}
