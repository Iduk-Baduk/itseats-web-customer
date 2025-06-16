import styles from "./LineButton.module.css";

export default function LineButton({ children, onClick }) {
  return (
    <button className={styles.button} onClick={onClick}>
      {children}
    </button>
  );
}
