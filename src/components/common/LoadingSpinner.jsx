import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ message = "페이지를 불러오는 중..." }) => {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}></div>
      <p className={styles.message}>{message}</p>
    </div>
  );
};

export default LoadingSpinner; 