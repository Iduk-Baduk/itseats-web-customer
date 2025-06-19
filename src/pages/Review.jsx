import PhotoButton from "../components/review/ReviewPhotoButton";
import ReviewCard from "../components/review/ReviewCard";
import ReviewTextarea from "../components/review/ReviewTextarea";
import ReviewItem from "../components/review/ReviewItem";
import ReviewSubmitButton from "../components/review/ReviewSubmitButton";
import ReviewHeader from "../components/review/ReviewHeader";
import { useState } from "react";

import styles from "./Review.module.css";
import { useNavigate } from "react-router-dom";

const reviewDummyData = {
  foodImage: "https://example.com/image.jpg",
  deliveryImage: "https://example.com/image.jpg",
  reviewItem: {
    imageUrl: "https://example.com/image.jpg",
    name: "[오] 필라델피아 치즈 스테이크 (L)",
    option: "코카콜라 제로 1.25L",
  },
};

export default function Review({ className }) {
  const [foodRating, setFoodRating] = useState(0);
  const [likeStatus, setLikeStatus] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const navigate = useNavigate();

  const handleLike = () => setLikeStatus("like");
  const handleDislike = () => setLikeStatus("dislike");

  const handleSubmit = () => {
    alert(
      `별점: ${foodRating}\n` +
        `음식 사진: ${reviewDummyData.foodImage}\n` +
        `좋아요 여부: ${likeStatus}\n` +
        `리뷰 내용: ${reviewText}`
    );
  };

  return (
    <div className={className}>
      <ReviewHeader onClose={() => navigate(-1)} />
      <div className={styles.reviewContainer}>
        <div className={styles.reviewCard}>
          <ReviewCard
            object="음식"
            image={reviewDummyData.foodImage}
            onSelect={(value) => setFoodRating(value)}
          />
          <ReviewCard object="배달" image={reviewDummyData.deliveryImage} />
        </div>
        <p className={styles.text}>배달파트너에 대해 평가해주세요 (선택)</p>
        <hr className={styles.hr} />
        <ReviewTextarea
          className={styles.reviewTextarea}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
        />
        {/* TODO: S3 스토리지 생기면 구현 */}
        <PhotoButton onClick={() => alert("추후 구현")} />
        <ReviewItem
          imageUrl={reviewDummyData.reviewItem.imageUrl}
          name={reviewDummyData.reviewItem.name}
          option={reviewDummyData.reviewItem.option}
          selected={likeStatus}
          onLike={handleLike}
          onDislike={handleDislike}
          className={styles.reviewItem}
        />
      </div>

      <ReviewSubmitButton
        className={styles.reviewSubmitButton}
        disabled={foodRating === 0} // 버튼 비활성화 조건
        onClick={handleSubmit}
      />
    </div>
  );
}
