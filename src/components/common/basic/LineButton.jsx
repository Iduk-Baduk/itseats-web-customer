import styles from "./LineButton.module.css";

export default function LineButton({ children, onClick, className = "" }) {
  return (
    <button className={`${styles.button} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}
