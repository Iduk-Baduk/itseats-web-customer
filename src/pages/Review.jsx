import PhotoButton from "../components/review/PhotoButton";
import ReviewCard from "../components/review/ReviewCard";
import ReviewTextarea from "../components/review/ReviewTextarea";
import ReviewItem from "../components/review/ReviewItem";

import styles from "./Review.module.css";
import ReviewSubmitButton from "../components/review/ReviewSubmitButton";

export default function Review({ className }) {
  return (
    <div className={className}>
      <div className={styles.reviewContainer}>
        <div className={styles.reviewCard}>
          <ReviewCard object="음식" image={"https://example.com/image.jpg"} />
          <ReviewCard object="배달" image={"https://example.com/image.jpg"} />
        </div>
        <p className={styles.text}>배달파트너에 대해 평가해주세요 (선택)</p>
        <hr className={styles.hr} />
        <ReviewTextarea className={styles.reviewTextarea} />
        <PhotoButton />
        <ReviewItem
          imageUrl={"https://example.com/image.jpg"}
          name="[오] 필라델피아 치즈 스테이크 (L)"
          option="코카콜라 제로 1.25L"
          onLike={() => {}}
          onDislike={() => {}}
          className={styles.reviewItem}
        />
      </div>
      <ReviewSubmitButton
        className={styles.reviewSubmitButton}
        disabled={true}
        onClick={() => {}}
      />
    </div>
  );
}
