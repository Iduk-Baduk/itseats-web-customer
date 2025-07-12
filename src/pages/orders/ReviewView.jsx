import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import reviewAPI from '../../services/reviewAPI';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './Review.module.css';

export default function ReviewView() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchReview() {
      setLoading(true);
      setError(null);
      try {
        const data = await reviewAPI.getReviewByOrderId(orderId);
        setReview(data);
      } catch (err) {
        setError(err.message || '리뷰 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchReview();
  }, [orderId]);

  if (loading) {
    return <LoadingSpinner message="리뷰 정보를 불러오는 중입니다..." />;
  }
  if (error) {
    return (
      <div className={styles.container}>
        <Header title="리뷰 보기" leftIcon="close" leftButtonAction={() => navigate(-1)} />
        <div className={styles.errorContainer}>{error}</div>
      </div>
    );
  }
  if (!review) {
    return (
      <div className={styles.container}>
        <Header title="리뷰 보기" leftIcon="close" leftButtonAction={() => navigate(-1)} />
        <div className={styles.errorContainer}>리뷰 정보가 없습니다.</div>
      </div>
    );
  }
  return (
    <div className={styles.container}>
      <Header title="리뷰 보기" leftIcon="close" leftButtonAction={() => navigate(-1)} />
      <div className={styles.content}>
        <h2>{review.storeName || '매장명'}</h2>
        <div>음식 평점: {review.storeStar} / 5</div>
        <div>배달 평점: {review.riderStar} / 5</div>
        <div>좋아요/별로: {review.menuLiked === 'GOOD' ? '좋아요' : review.menuLiked === 'BAD' ? '별로' : '-'}</div>
        <div>리뷰 내용: {review.content}</div>
        <div>작성일: {review.createdAt ? new Date(review.createdAt).toLocaleString() : '-'}</div>
      </div>
    </div>
  );
} 
