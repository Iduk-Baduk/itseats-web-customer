import { useState } from "react";
import styles from "./ReviewCard.module.css";

const RiderIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
    <path
      fill="#199dff"
      d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2M5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5s5-2.2 5-5s-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5s3.5 1.6 3.5 3.5s-1.6 3.5-3.5 3.5m5.8-10l2.4-2.4l.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L6.31 9.9L11 14v5h2v-6.2zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5s5-2.2 5-5s-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5s3.5 1.6 3.5 3.5s-1.6 3.5-3.5 3.5"
    />
  </svg>
);

const YellowStarIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
    <path
      fill="#f0940f"
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21z"
    />
  </svg>
);

const GrayStarIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
    <path
      fill="#c2c2c2"
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21z"
    />
  </svg>
);

export default function ReviewCard({ object, image, className, onSelect }) {
  const [selected, setSelected] = useState(0);

  const handleSelect = (index) => {
    const value = index + 1;
    setSelected(value);
    if (onSelect) {
      onSelect(value);
    }
  };

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
                  onClick={() => handleSelect(index)}
                  className={styles.starButton}
                >
                  <Star className={styles.star} />
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.image}>
          {object === "음식" ? (
            <img src={image.url} alt="리뷰 대상" className={styles.image} />
          ) : (
            <RiderIcon className={styles.riderIcon} />
          )}
        </div>
      </div>
    </div>
  );
}
