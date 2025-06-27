import PhotoButton from "../../components/review/ReviewPhotoButton";
import ReviewCard from "../../components/review/ReviewCard";
import ReviewTextarea from "../../components/review/ReviewTextarea";
import ReviewItem from "../../components/review/ReviewItem";
import ReviewSubmitButton from "../../components/review/ReviewSubmitButton";
import Header from "../../components/common/Header";
import BottomButton from "../../components/common/BottomButton";

import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import styles from "./Review.module.css";

export default function Review({ className }) {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const location = useLocation();
  
  // URL state나 Redux에서 주문 정보 가져오기
  const orderFromState = location.state?.order;
  const orderFromRedux = useSelector(state => 
    state.order?.orders?.find(o => o.id === orderId)
  );
  
  // 주문 정보 (state 우선, 없으면 Redux에서)
  const currentOrder = orderFromState || orderFromRedux;

  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [likeStatus, setLikeStatus] = useState(null);
  const [reviewText, setReviewText] = useState("");

  const handleLike = () => setLikeStatus("like");
  const handleDislike = () => setLikeStatus("dislike");

  const handleSubmit = async () => {
    const reviewData = {
      orderId,
      foodRating,
      deliveryRating,
      likeStatus,
      reviewText,
    };

    // 리뷰 API 연동은 향후 구현
    alert("리뷰가 제출되었습니다!");
    navigate(-1);
  };

  // 주문 정보가 없는 경우
  if (!currentOrder) {
    return (
      <div className={className}>
        <Header
          title="평가 및 리뷰 작성"
          rightIcon="none"
          leftIcon="close"
          leftButtonAction={() => navigate(-1)}
        />
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p>주문 정보를 찾을 수 없습니다.</p>
          <button 
            onClick={() => navigate("/orders")}
            style={{ marginTop: '20px', padding: '10px 20px' }}
          >
            주문 목록으로 이동
          </button>
        </div>
      </div>
    );
  }

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
            image={currentOrder.storeImage || "/samples/food1.jpg"}
            onSelect={(value) => setFoodRating(value)}
          />
          <ReviewCard
            object="배달"
            image="/icons/order/rider.jpg"
            onSelect={(value) => setDeliveryRating(value)}
          />
        </div>
        <p className={styles.text}>배달파트너에 대해 평가해주세요 (선택)</p>
        <hr className={styles.hr} />
        <ReviewTextarea
          className={styles.reviewTextarea}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder={`${currentOrder.storeName}에서의 식사는 어떠셨나요?`}
        />
        <PhotoButton onClick={() => alert("사진 업로드 기능은 추후 구현 예정입니다.")} />
        <ReviewItem
          imageUrl={currentOrder.storeImage || "/samples/food1.jpg"}
          name={currentOrder.menuSummary || currentOrder.storeName}
          option={currentOrder.orderMenus?.[0]?.options?.join(", ") || ""}
          selected={likeStatus}
          onLike={handleLike}
          onDislike={handleDislike}
          className={styles.reviewItem}
        />
      </div>

      <BottomButton
        disabled={foodRating === 0} // 음식 평점은 필수
        onClick={handleSubmit}
      >
        <p>등록하기</p>
      </BottomButton>
    </div>
  );
}
