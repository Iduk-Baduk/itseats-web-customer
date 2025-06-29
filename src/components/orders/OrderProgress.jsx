import { getOrderStep } from "../../utils/orderUtils";
import styles from "./OrderProgress.module.css";

const steps = ["주문접수", "주문수락", "조리중", "배달중", "배달완료"];

export default function OrderProgress({ currentStep = 1, orderStatus = null }) {
  // orderStatus가 제공되면 자동으로 단계 계산, 없으면 currentStep 사용
  const actualStep = orderStatus ? getOrderStep(orderStatus) : currentStep;
  
  // 안전한 단계 값 보장 (0-5 범위)
  const safeStep = Math.max(0, Math.min(5, actualStep || 0));
  
  return (
    <div className={styles.container}>
      <div className={styles.lineContainer}>
        <div className={styles.fullLine} />
        <div
          className={styles.progressLine}
          style={{ 
            width: `${Math.min((safeStep / (steps.length - 1)) * 100, 100)}%` 
          }}
        />
      </div>
      <div className={styles.steps}>
        {steps.map((label, index) => {
          const isCompleted = index < safeStep;
          const isCurrent = index === safeStep;

          return (
            <div 
              key={index} 
              className={`${styles.step} ${isCurrent ? styles.currentStep : ''}`}
            >
              <div
                className={`${styles.circle} ${
                  isCompleted
                    ? styles.completed
                    : isCurrent
                    ? styles.current
                    : ""
                }`}
              >
                {isCompleted ? (
                  <svg
                    className={styles.check}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="white"
                      d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"
                    />
                  </svg>
                ) : isCurrent ? (
                  <div className={styles.innerCircle} />
                ) : null}
              </div>
              <span className={styles.label}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
