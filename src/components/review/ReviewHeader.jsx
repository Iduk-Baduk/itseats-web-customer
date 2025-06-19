import styles from "./ReviewHeader.module.css";

const DeleteButton = ({ onClick, className }) => {
  return (
    <button onClick={onClick} className={className}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path
          fill="#000"
          d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"
        />
      </svg>
    </button>
  );
};

export default function ReviewHeader({ className, onClose }) {
  return (
    <div className={className}>
      <div className={styles.container}>
        <DeleteButton className={styles.deleteButton} onClick={onClose} />
        <h1 className={styles.title}>평가 및 리뷰 작성</h1>
      </div>
    </div>
  );
}
