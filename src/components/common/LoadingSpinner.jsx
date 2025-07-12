import React from 'react';
import PropTypes from 'prop-types';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ 
  message = "페이지를 불러오는 중...", 
  size = "medium", // small, medium, large
  variant = "default", // default, minimal, skeleton
  fullScreen = false,
  pageLoading = false,
  className = "",
  showMessage = true
}) => {
  const containerClass = fullScreen 
    ? `${styles.container} ${styles.fullScreen}`
    : pageLoading 
    ? `${styles.container} ${styles.pageLoading}`
    : styles.container;

  const spinnerClass = `${styles.spinner} ${styles[size]} ${styles[variant]}`;

  // Skeleton 변형의 경우 다른 UI 렌더링
  if (variant === "skeleton") {
    return (
      <div className={`${containerClass} ${className}`}>
        <div className={styles.skeletonContainer}>
          <div className={styles.skeletonLine}></div>
          <div className={styles.skeletonLine}></div>
          <div className={styles.skeletonLine}></div>
        </div>
      </div>
    );
  }

  // Minimal 변형의 경우 간단한 스피너만 렌더링
  if (variant === "minimal") {
    return (
      <div className={`${styles.minimalContainer} ${className}`}>
        <div className={spinnerClass} aria-hidden="true"></div>
      </div>
    );
  }

  return (
    <div 
      className={`${containerClass} ${className}`}
      role="status" 
      aria-live="polite"
      aria-label="로딩 중"
    >
      <div 
        className={spinnerClass}
        aria-hidden="true"
      ></div>
      {showMessage && (
        <p className={styles.message}>
          {message}
          <span className="sr-only">로딩이 완료될 때까지 잠시 기다려 주세요.</span>
        </p>
      )}
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['default', 'minimal', 'skeleton']),
  fullScreen: PropTypes.bool,
  pageLoading: PropTypes.bool,
  className: PropTypes.string,
  showMessage: PropTypes.bool
};

export default LoadingSpinner; 
