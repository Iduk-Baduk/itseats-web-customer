import ReviewCard from "../components/review/ReviewCard";
import ReviewTextarea from "../components/review/ReviewTextarea";

import styles from "./Review.module.css";

export default function Review() {
  return (
    <div className={styles.reviewContainer}>
      <ReviewCard object="음식" image="example.jpg" />
      <ReviewCard object="배달" image="example.jpg" />
      <p>배달파트너에 대해 평가해주세요 (선택)</p>
      <hr className={styles.hr} />
      <ReviewTextarea className={styles.reviewTextarea} />
    </div>
  );
}
