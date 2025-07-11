import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import useSubmitReview from '../../hooks/useSubmitReview';

import Header from '../../components/common/Header';
import BottomButton from '../../components/common/BottomButton';
import ReviewCard from '../../components/review/ReviewCard';
import ReviewTextarea from '../../components/review/ReviewTextarea';
import ReviewItem from '../../components/review/ReviewItem';
import PhotoButton from '../../components/review/ReviewPhotoButton';

import styles from './Review.module.css';

export default function Review({ className }) {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const location = useLocation();
  const { handleSubmitReview, isSubmitting } = useSubmitReview();

  const currentOrder = location.state?.order;

  const [storeStar, setStoreStar] = useState(0);
  const [riderStar, setRiderStar] = useState(0);
  const [menuLiked, setMenuLiked] = useState('NONE'); // GOOD, BAD, NONE
  const [content, setContent] = useState('');

  const handleLike = () => setMenuLiked('GOOD');
  const handleDislike = () => setMenuLiked('BAD');

  const onSubmit = async () => {
    if (storeStar === 0) return alert('음식 평점을 선택해주세요!');
    if (riderStar === 0) return alert('배달 평점을 선택해주세요!');
    if (menuLiked === 'NONE') return alert('좋아요 또는 별로를 선택해주세요!');
    if (content.trim().length < 10) return alert('리뷰 내용을 최소 10자 이상 작성해주세요.');

    try {
      await handleSubmitReview({
        orderId,
        storeStar,
        riderStar,
        menuLiked,
        content,
      });
      alert('리뷰가 제출되었습니다!');
      navigate('/orders'); // 작성 후 주문 목록으로 이동
    } catch (err) {
      alert(err.message || '리뷰 제출에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (!currentOrder) {
    return (
      <div className={className}>
        <Header title="평가 및 리뷰 작성" rightIcon="none" leftIcon="close" leftButtonAction={() => navigate('/orders')} />
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p>주문 정보를 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/orders')} style={{ marginTop: '20px', padding: '10px 20px' }}>
            주문 목록으로 이동
          </button>
        </div>
      </div>
    );
  }

  // ✅ 사진 우선 순위
  const storeImage = currentOrder.storeImage || '/samples/food1.jpg';
  const menuImage = currentOrder.orderMenus?.[0]?.menuImage || '/samples/food1.jpg';
  const menuName = currentOrder.orderMenus?.[0]?.menuName || '메뉴 이름 없음';
  const menuOptions = currentOrder.orderMenus?.[0]?.options?.join(', ') || '';

  // 🚨 리뷰 작성 가능 조건 확인
  if (currentOrder.orderStatus !== 'COMPLETED' || currentOrder.hasReview) {
    navigate('/orders');
    return null;
  }

  return (
    <div className={className}>
      <Header title="평가 및 리뷰 작성" rightIcon="none" leftIcon="close" leftButtonAction={() => navigate('/orders')} />
      <div className={styles.reviewContainer}>
        <div className={styles.reviewCard}>
          <ReviewCard object="음식" image={storeImage} onSelect={setStoreStar} />
          <ReviewCard object="배달" image="/icons/order/rider.jpg" onSelect={setRiderStar} />
        </div>

        <p className={styles.text}>메뉴에 대해 평가해주세요 (좋아요/별로)</p>
        <ReviewItem
          imageUrl={menuImage}
          name={menuName}
          option={menuOptions}
          selected={menuLiked}
          onLike={handleLike}
          onDislike={handleDislike}
          className={styles.reviewItem}
        />

        <ReviewTextarea
          className={styles.reviewTextarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`${currentOrder.storeName}에서의 식사는 어떠셨나요?`}
        />

        {/* ✅ 사진 추가 버튼 활성화 */}
        <PhotoButton onClick={() => alert('사진 업로드 기능은 추후 구현 예정입니다.')} />
      </div>

      <BottomButton disabled={isSubmitting} onClick={onSubmit}>
        <p>{isSubmitting ? '등록 중...' : '등록하기'}</p>
      </BottomButton>
    </div>
  );
}
