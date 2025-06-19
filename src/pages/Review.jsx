import ReviewCard from "../components/review/ReviewCard";
import styles from "./Review.module.css";

export default function Review() {
  return (
    <div className={styles.reviewContainer}>
      <ReviewCard object="음식" image="example.jpg" className={styles.reviewCard} />
      <ReviewCard object="배달" image="example.jpg" className={styles.reviewCard} />
    </div>
  );
}
