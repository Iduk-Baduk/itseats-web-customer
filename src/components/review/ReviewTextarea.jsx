import styles from "./ReviewTextarea.module.css";

export default function ReviewTextarea({ value, onClick, className }) {
  return (
    <div className={className}>
      <div className={styles.container}>
        <h3 className={styles.label}>자세한 음식 리뷰를 작성해주세요</h3>
        <textarea
          className={styles.textarea}
          placeholder="주문하신 메뉴의 맛과 양에 대해 자세히 써주시면 더 유용한 리뷰가 돼요."
          rows={5}
        />
      </div>
    </div>
  );
}
