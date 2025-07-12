import styles from "./OptionInput.module.css";

export default function OptionInput({
  type,
  checked,
  onChange,
  label,
  price,
  id,
  disabled,
  className,
}) {
  return (
    <label
      className={`${styles.checkbox} ${className} ${
        disabled ? styles.disabled : ""
      }`}
      htmlFor={id}
    >
      <input
        type={type}
        id={id}
        checked={checked}
        onChange={onChange}
        className={styles.input}
        disabled={disabled}
      />
      {renderIcon(type, disabled)}
      <div className={styles.labelContainer}>
        {disabled && <span className={styles.disabledText}>(품절)</span>}
        {label && <span className={styles.label}>{label}</span>}
        {price > 0 && <span className={styles.price}>(+{price.toLocaleString()}원)</span>}
      </div>
    </label>
  );
}

const renderIcon = (type, disabled) => {
  if (disabled) {
    return (
      <div
        className={styles.box}
        style={{ backgroundColor: "var(--border-color-light)" }}
      >
        <svg className={styles.icon} viewBox="0 0 24 24">
          <path
            d="M6 6L18 18M6 18L18 6"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  }

  if (type === "radio") {
    return (
      <div className={styles.box} style={{ borderRadius: "50%" }}>
        <svg className={styles.icon} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      </div>
    );
  }

  return (
    <div className={styles.box}>
      <svg className={styles.icon} viewBox="0 0 24 24">
        <path
          d="M9 16.2l-3.5-3.5L4 14.2 9 19l11-11-1.4-1.4z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};
