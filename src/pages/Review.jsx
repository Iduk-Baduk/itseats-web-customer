import PhotoButton from "../components/review/ReviewPhotoButton";
import ReviewCard from "../components/review/ReviewCard";
import ReviewTextarea from "../components/review/ReviewTextarea";
import ReviewItem from "../components/review/ReviewItem";
import ReviewSubmitButton from "../components/review/ReviewSubmitButton";
import Header from "../components/common/Header";
import BottomButton from "../components/common/BottomButton";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./Review.module.css";

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
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [likeStatus, setLikeStatus] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const navigate = useNavigate();

  const handleLike = () => setLikeStatus("like");
  const handleDislike = () => setLikeStatus("dislike");

  const handleSubmit = () => {
    alert(
      `별점: ${foodRating}\n` +
        `배달 별점: ${deliveryRating}\n` +
        `음식 사진: ${reviewDummyData.foodImage}\n` +
        `좋아요 여부: ${likeStatus}\n` +
        `리뷰 내용: ${reviewText}`
    );
  };

  return (
    <div className={className}>
      <Header
        title="평가 및 리뷰 작성"
        rightIcon="none"
        leftIcon="close"
        leftButtonAction={() => navigate(-1)}
      />
      <div className={styles.reviewContainer}>
        <div className={styles.reviewCard}>
          <ReviewCard
            object="음식"
            image={reviewDummyData.foodImage}
            onSelect={(value) => setFoodRating(value)}
          />
          <ReviewCard
            object="배달"
            image={reviewDummyData.deliveryImage}
            onSelect={(value) => setDeliveryRating(value)}
          />
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

      <BottomButton
        disabled={foodRating === 0} // 버튼 비활성화 조건
        onClick={handleSubmit}
      >
        <p>등록하기</p>
      </BottomButton>
    </div>
  );
}
