import styles from "./DeliveryRadioButton.module.css";

export default function DeliveryRadioButton({
  checked,
  onChange,
  label,
  timeMin,
  timeMax,
  deliveryFee,
  id,
  className,
}) {
  return (
    <label className={`${styles.radioButton} ${className} ${checked ? styles.checked : ""}`} htmlFor={id}>
      <input
        type="radio"
        id={id}
        checked={checked}
        onChange={onChange}
        className={styles.input}
      />
      <div className={styles.box}>
        <svg className={styles.icon} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      </div>
      <div className={styles.flexContainer}>
        <div>
          {label && <p className={styles.label}>{label}</p>}
          {timeMin && timeMax && (
            <p className={styles.timeInfo}>
              {timeMin}-{timeMax}분
            </p>
          )}
        </div>
        {deliveryFee && (
          <p className={styles.feeInfo}>
            {deliveryFee.toLocaleString()}원
          </p>
        )}
      </div>
    </label>
  );
}
