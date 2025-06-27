import { ORDER_STATUS } from '../../constants/orderStatus';
import styles from './OrderProgressSteps.module.css';

const OrderProgressSteps = ({ orderStatus }) => {
  const steps = [
    { 
      key: 'order', 
      label: '주문접수', 
      statuses: [
        ORDER_STATUS.WAITING, 
        ORDER_STATUS.COOKING, 
        ORDER_STATUS.COOKED, 
        ORDER_STATUS.RIDER_READY, 
        ORDER_STATUS.DELIVERING
      ] 
    },
    { 
      key: 'cooking', 
      label: '조리중', 
      statuses: [
        ORDER_STATUS.COOKING, 
        ORDER_STATUS.COOKED, 
        ORDER_STATUS.RIDER_READY, 
        ORDER_STATUS.DELIVERING
      ] 
    },
    { 
      key: 'cooked', 
      label: '조리완료', 
      statuses: [
        ORDER_STATUS.COOKED, 
        ORDER_STATUS.RIDER_READY, 
        ORDER_STATUS.DELIVERING
      ] 
    },
    { 
      key: 'delivering', 
      label: '배달중', 
      statuses: [ORDER_STATUS.DELIVERING] 
    }
  ];

  const getCurrentStepIndex = () => {
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i].statuses.includes(orderStatus)) {
        return i;
      }
    }
    return -1;
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className={styles.progressSteps}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isActive = isCompleted || isCurrent;

        return (
          <div key={step.key} className={styles.stepContainer}>
            <div className={styles.stepWrapper}>
              <div 
                className={`${styles.stepCircle} ${
                  isCompleted ? styles.completed : 
                  isCurrent ? styles.current : 
                  styles.pending
                }`}
              >
                {isCompleted && <span className={styles.checkmark}>✓</span>}
              </div>
              <span className={`${styles.stepLabel} ${isActive ? styles.active : ''}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`${styles.stepLine} ${isCompleted ? styles.completed : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrderProgressSteps; 
