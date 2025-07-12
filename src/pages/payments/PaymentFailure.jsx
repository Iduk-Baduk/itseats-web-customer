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

  // 사용자 친화적 에러 메시지 변환
  const getUserFriendlyErrorMessage = (code, message) => {
    // 에러 코드에 따른 사용자 친화적 메시지 변환
    switch(code) {
      case 'USER_CANCEL':
        return '사용자가 결제를 취소했습니다.';
      case 'INVALID_CARD':
        return '유효하지 않은 카드 정보입니다.';
      case 'INSUFFICIENT_FUNDS':
        return '잔액이 부족합니다.';
      case 'CARD_EXPIRED':
        return '만료된 카드입니다.';
      case 'INVALID_PIN':
        return '잘못된 PIN 번호입니다.';
      case 'NETWORK_ERROR':
        return '네트워크 연결을 확인해 주세요.';
      case 'TIMEOUT':
        return '결제 시간이 초과되었습니다. 다시 시도해 주세요.';
      case 'SERVER_ERROR':
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      default:
        return message || '결제 처리 중 오류가 발생했습니다.';
    }
  };

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
          <p className={styles.failureReason}>
            {getUserFriendlyErrorMessage(searchParams.get("code"), searchParams.get("message"))}
          </p>
          
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
