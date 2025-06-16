import styles from "./CheckBox.module.css";

export default function CheckBox({ checked, onChange, label, id, className }) {
  return (
    <label className={`${styles.checkbox} ${className}`} htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className={styles.input}
      />
      <div className={styles.box}>
        <svg className={styles.icon} viewBox="0 0 24 24">
          <path d="M9 16.2l-3.5-3.5L4 14.2 9 19l11-11-1.4-1.4z" />
        </svg>
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
