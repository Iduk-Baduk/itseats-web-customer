import styles from "./QuantityControl.module.css";

export default function QuantityControl({ quantity, onQuantityChange }) {
  return (
    <div className={styles.quantityControl}>
      <button
        className={styles.quantityButton}
        onClick={() => {
          if (quantity <= 1 && !confirm("카트에서 메뉴를 삭제하시겠습니까?")) {
            return;
          }
          onQuantityChange(-1);
        }}
      >
        {quantity > 1 && (
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              d="M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
        {quantity <= 1 && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              style={{ stroke: "#fff" }}
              fill="currentColor"
              d="M9 3v1H4v2h1v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h1V4h-5V3zM7 6h10v13H7zm2 2v9h2V8zm4 0v9h2V8z"
            />
          </svg>
        )}
      </button>
      <span className={styles.count}>{quantity}</span>
      <button
        className={styles.quantityButton}
        onClick={() => onQuantityChange(1)}
        disabled={quantity >= 99}
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
