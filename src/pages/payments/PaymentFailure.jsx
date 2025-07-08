import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import Button from '../../components/common/basic/Button';
import Card from '../../components/common/Card';
import styles from './PaymentFailure.module.css';
import commonStyles from "../../styles/CommonResult.module.css";

export default function PaymentFailure() {
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
    <div className={commonStyles.result}>
      <div className={commonStyles.wrapper}>
        <div className={commonStyles.boxSection}>
          <h2 className={styles.failureTitle}>결제 실패</h2>
          <p className={styles.errorCode}>{`에러 코드: ${searchParams.get("code")}`}</p>
          <p className={styles.failureReason}>{`실패 사유: ${searchParams.get("message")}`}</p>
          
          <div className="btn-group">
            <button 
              className="btn btn-primary"
              onClick={handleRetry}
            >
              {redirectTo === "/cart" ? "장바구니로 돌아가기" : "다시 시도하기"}
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={handleGoHome}
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
