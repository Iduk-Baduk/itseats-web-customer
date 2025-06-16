import styles from "./LineButton.module.css";

export default function LineButton({ children, onClick, className = "", disabled = false }) {
  return (
    <button className={`${styles.button} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
