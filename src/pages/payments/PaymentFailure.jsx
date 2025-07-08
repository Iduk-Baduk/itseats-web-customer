import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import Button from '../../components/common/basic/Button';
import Card from '../../components/common/Card';
import styles from './PaymentFailure.module.css';

export function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 리다이렉트 파라미터 처리
  const redirectTo = searchParams.get("redirect") || "/cart";

  const handleRetry = () => {
    navigate(redirectTo);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className={styles.result}>
      <div className={styles.wrapper}>
        <div className={styles.boxSection}>
          <h2>결제 실패</h2>
          <p>{`에러 코드: ${searchParams.get("code")}`}</p>
          <p>{`실패 사유: ${searchParams.get("message")}`}</p>
          
          <button 
            className={styles.retryButton}
            onClick={handleRetry}
          >
            {redirectTo === "/cart" ? "장바구니로 돌아가기" : "다시 시도하기"}
          </button>
          
          <button 
            className={styles.homeButton}
            onClick={handleGoHome}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
} 
