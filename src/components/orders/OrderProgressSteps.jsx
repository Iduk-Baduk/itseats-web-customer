import PropTypes from 'prop-types';
import { ORDER_STATUS } from '../../constants/orderStatus';
import styles from './OrderProgressSteps.module.css';

const OrderProgressSteps = ({ orderStatus = ORDER_STATUS.WAITING }) => {
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
    if (!orderStatus) {
      return 0; // 기본값으로 첫 번째 단계 반환
    }
    
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i].statuses.includes(orderStatus)) {
        return i;
      }
    }
    return 0; // 매칭되지 않는 경우 첫 번째 단계로 폴백
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div 
      className={styles.progressSteps} 
      role="progressbar" 
      aria-valuenow={currentStepIndex + 1} 
      aria-valuemax={steps.length}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isActive = isCompleted || isCurrent;

        return (
          <div 
            key={step.key} 
            className={styles.stepContainer}
            aria-label={`${step.label} ${isCompleted ? '완료됨' : isCurrent ? '진행중' : '대기중'}`}
          >
            <div className={styles.stepWrapper}>
              <div 
                className={`${styles.stepCircle} ${
                  isCompleted ? styles.completed : 
                  isCurrent ? styles.current : 
                  styles.pending
                }`}
                aria-hidden="true"
              >
                {isCompleted && <span className={styles.checkmark} aria-label="완료">✓</span>}
              </div>
              <span className={`${styles.stepLabel} ${isActive ? styles.active : ''}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`${styles.stepLine} ${isCompleted ? styles.completed : ''}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
};

OrderProgressSteps.propTypes = {
  orderStatus: PropTypes.string.isRequired
};

export default OrderProgressSteps; 
