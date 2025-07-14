import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";  // ← useNavigate 추가
import StoreAPI from "../../services/storeAPI";
import styles from "./ReviewListPage.module.css";

export default function ReviewListPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();  // ← 추가

  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoading(true);
        const res = await StoreAPI.getReviewsByStoreId(storeId);
        const reviewList = res?.reviews || [];
        setReviews(reviewList);

        if (reviewList.length > 0) {
          const avg =
            reviewList.reduce((sum, r) => sum + r.rating, 0) /
            reviewList.length;
          setAverage(avg.toFixed(1));
        } else {
          setAverage(0);
        }
      } catch (err) {
        console.error("리뷰 조회 에러:", err);
        setError("리뷰를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [storeId]);

  if (loading) return <div className={styles.container}>로딩 중...</div>;
  if (error) return <div className={styles.container}>{error}</div>;

  const ratingCounts = [5, 4, 3, 2, 1].map(
    (score) =>
      reviews.filter((r) => Math.round(r.rating) === score).length
  );

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        ← 
      </button>

      <h2>가게 리뷰</h2>
      <div className={styles.summary}>
        <div className={styles.average}>
          <strong>{average}</strong>
          <span>평가 {reviews.length}개</span>
        </div>
        <div className={styles.bars}>
          {ratingCounts.map((count, idx) => (
            <div key={5 - idx} className={styles.barRow}>
              <span>{5 - idx}점</span>
              <div className={styles.bar}>
                <div
                  className={styles.fill}
                  style={{
                    width: `${
                      reviews.length > 0
                        ? (count / reviews.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span>{count}개</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.reviewList}>
        {reviews.map((review) => (
          <div key={review.reviewId || review.id} className={styles.reviewItem}>
            <div className={styles.header}>
              <strong>{review.reviewer || "익명"}</strong>
              <span>
                {new Date(review.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>
            <div className={styles.rating}>⭐ {review.rating}</div>
            <p className={styles.content}>{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
