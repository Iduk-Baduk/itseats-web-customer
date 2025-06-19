import PhotoButton from "../components/review/ReviewPhotoButton";
import ReviewCard from "../components/review/ReviewCard";
import ReviewTextarea from "../components/review/ReviewTextarea";
import ReviewItem from "../components/review/ReviewItem";
import ReviewSubmitButton from "../components/review/ReviewSubmitButton";
import ReviewHeader from "../components/review/ReviewHeader";
import { useState } from "react";

import styles from "./Review.module.css";

export default function Review({ className }) {
  const [foodRating, setFoodRating] = useState(0);

  return (
    <div className={className}>
      <ReviewHeader />
      <div className={styles.reviewContainer}>
        <div className={styles.reviewCard}>
          <ReviewCard
            object="음식"
            image={"https://example.com/image.jpg"}
            onSelect={(value) => setFoodRating(value)}
          />
          <ReviewCard object="배달" image={"https://example.com/image.jpg"} />
        </div>
        <p className={styles.text}>배달파트너에 대해 평가해주세요 (선택)</p>
        <hr className={styles.hr} />
        <ReviewTextarea className={styles.reviewTextarea} />
        {/* TODO: S3 스토리지 생기면 구현 */}
        <PhotoButton onClick={() => alert("추후 구현")} />
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
        disabled={foodRating === 0} // 버튼 비활성화 조건
        onClick={() => {}}
      />
    </div>
  );
}
