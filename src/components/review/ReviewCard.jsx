import { useState } from "react";
import styles from "./ReviewCard.module.css";

const YellowStarIcon = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
      <path
        fill="#f0940f"
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21z"
      />
    </svg>
  );
};

const GrayStarIcon = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
      <path
        fill="#c2c2c2"
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21z"
      />
    </svg>
  );
};

export default function ReviewCard({ object, image, className }) {
  const [selected, setSelected] = useState(0); // 별점 관리

  return (
    <div className={className}>
      <div className={styles.reviewContainer}>
        <div className={styles.left}>
          <h2 className={styles.label}>
            {object}은 <strong>어떠셨나요?</strong>
          </h2>
          <div className={styles.starGroup}>
            {Array.from({ length: 5 }, (_, index) => {
              const Star = index < selected ? YellowStarIcon : GrayStarIcon;
              return (
                <button
                  key={index}
                  onClick={() => setSelected(index + 1)}
                  className={styles.starButton}
                >
                  <Star className={styles.star} />
                </button>
              );
            })}
          </div>
        </div>

        <img src={image.url} alt="리뷰 대상" className={styles.image} />
      </div>
    </div>
  );
}
