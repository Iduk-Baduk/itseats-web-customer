import styles from "./RadioButton.module.css";

export default function RadioButton({ checked, onChange, label, id, className }) {
  return (
    <label className={`${styles.radioButton} ${className}`} htmlFor={id}>
      <input
        type="radio"
        id={id}
        checked={checked}
        onChange={onChange}
        className={`${styles.input} ${className}`}
      />
      <div className={styles.box}>
        <svg className={styles.icon} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
