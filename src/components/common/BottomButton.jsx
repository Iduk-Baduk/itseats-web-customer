// src/components/common/BottomButton.jsx
import { useLocation } from "react-router-dom";
import styles from "./BottomButton.module.css";

export default function BottomButton({
  onClick,
  bottom,
  label,
  disabled = false,
  className,
  children,
  cartInfo,
}) {
  const location = useLocation();

  if (!children && !cartInfo) return null;

  // ✅ 현재 경로가 /cart이고, 장바구니에 아이템이 있을 때만 "결제하기" 텍스트로 대체
  const isCartPage = location.pathname === "/cart";
  const showPaymentText = isCartPage && cartInfo?.itemCount > 0;

  return (
    <button
      className={`${styles.bottomButton} ${className || ""}`}
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      style={{ bottom: bottom || "0" }}
    >
      {children}

      {!children && cartInfo && (
        <div
          className={`${styles.flexContainer} ${
            showPaymentText ? styles.centered : ""
          }`}
        >
          {showPaymentText ? (
            <span className={styles.paymentText}>
              {cartInfo.totalPrice.toLocaleString()}원 결제하기
            </span>
          ) : (
            <>
              <div>
                <span className={styles.itemCount}>{cartInfo.itemCount}</span>
                <span>카트 보기</span>
              </div>
              <div>
                {cartInfo.totalPrice < cartInfo.orderPrice && (
                  <span className={styles.originalPrice}>
                    {cartInfo.orderPrice.toLocaleString()}원
                  </span>
                )}
                <span>{cartInfo.totalPrice.toLocaleString()}원</span>
              </div>
            </>
          )}
        </div>
      )}
    </button>
  );
}
