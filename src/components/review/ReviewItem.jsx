import { useState } from "react";
import styles from "./ReviewItem.module.css";

const ThumbsDownIcon = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57l-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2m0 12l-4.34 4.34L12 14H3v-2l3-7h9zm4-12h4v12h-4z"
      />
    </svg>
  );
};

const ThumbsUpIcon = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57l.03-.32c0-.41-.17-.79-.44-1.06L14.17 1L7.58 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2M9 9l4.34-4.34L12 10h9v2l-3 7H9zM1 9h4v12H1z"
      />
    </svg>
  );
};

export default function ReviewItem({ className, imageUrl, name, option, onLike, onDislike }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className={className}>
      <div className={styles.container}>
        <div className={styles.imageBox}>{imageUrl && <img src={imageUrl} />}</div>

        <div className={styles.content}>
          <p className={styles.name}>{name}</p>
          <p className={styles.option}>{option}</p>
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.circleButton} ${selected === "dislike" ? styles.selected : ""}`}
            onClick={() => setSelected("dislike")}
          >
            <ThumbsDownIcon className={styles.icon} />
          </button>
          <button
            className={`${styles.circleButton} ${selected === "like" ? styles.selected : ""}`}
            onClick={() => setSelected("like")}
          >
            <ThumbsUpIcon className={styles.icon} />
          </button>
        </div>
      </div>
    </div>
  );
}
