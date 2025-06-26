import React from 'react';
import PropTypes from 'prop-types';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ 
  message = "페이지를 불러오는 중...", 
  fullScreen = false,
  pageLoading = false 
}) => {
  const containerClass = fullScreen 
    ? `${styles.container} ${styles.fullScreen}`
    : pageLoading 
    ? `${styles.container} ${styles.pageLoading}`
    : styles.container;

  return (
    <div 
      className={containerClass} 
      role="status" 
      aria-live="polite"
      aria-label="로딩 중"
    >
      <div 
        className={styles.spinner}
        aria-hidden="true"
      ></div>
      <p className={styles.message}>
        {message}
        <span className="sr-only">로딩이 완료될 때까지 잠시 기다려 주세요.</span>
      </p>
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  fullScreen: PropTypes.bool,
  pageLoading: PropTypes.bool
};

export default LoadingSpinner; 