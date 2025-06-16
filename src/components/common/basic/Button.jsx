import styles from "./Button.module.css";

export default function Button({ children, onClick, className = "", disabled = false }) {
  return (
    <button className={`${styles.button} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
