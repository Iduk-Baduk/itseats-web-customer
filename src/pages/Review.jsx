import PhotoButton from "../components/review/PhotoButton";
import ReviewCard from "../components/review/ReviewCard";
import ReviewTextarea from "../components/review/ReviewTextarea";
import ReviewItem from "../components/review/ReviewItem";

import styles from "./Review.module.css";

export default function Review() {
  return (
    <div className={styles.reviewContainer}>
      <ReviewCard object="음식" image={"https://example.com/image.jpg"} />
      <ReviewCard object="배달" image={"https://example.com/image.jpg"} />
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
  );
}
