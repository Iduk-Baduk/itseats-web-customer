import styles from "./OrderProgress.module.css";

const steps = ["주문수락", "조리중", "배달중", "배달완료"];

export default function OrderProgress({ currentStep = 1 }) {
  return (
    <div className={styles.container}>
      <div className={styles.lineContainer}>
        <div className={styles.fullLine} />
        <div
          className={styles.progressLine}
          style={{ width: `${Math.min((currentStep / (steps.length - 1)) * 100, 100)}%` }}
        />
      </div>
      <div className={styles.steps}>
        {steps.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={index} className={styles.step}>
              <div
                className={`${styles.circle} ${
                  isCompleted
                    ? styles.completed
                    : isCurrent
                    ? styles.current
                    : styles.pending
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