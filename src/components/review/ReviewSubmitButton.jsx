import styles from "./ReviewSubmitButton.module.css";

export default function ReviewSubmitButton({ className, disabled, onClick }) {
  return (
    <div className={className}>
      <button
        className={`${styles.button} ${disabled ? styles.disabled : styles.active}`}
        onClick={onClick}
        disabled={disabled}
      >
        등록하기
      </button>
    </div>
  );
}
