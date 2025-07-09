import React from 'react';
import Button from './basic/Button';
import { logger } from '../../utils/logger';
import styles from './ApiErrorHandler.module.css';

/**
 * API 에러 처리 컴포넌트
 * @param {Object} props
 * @param {Error} props.error - 발생한 에러 객체
 * @param {Function} props.onRetry - 재시도 함수
 * @param {Function} props.onGoHome - 홈으로 이동 함수
 * @param {Function} props.onGoCart - 장바구니로 이동 함수
 * @param {string} props.customMessage - 커스텀 에러 메시지
 * @param {boolean} props.showRetry - 재시도 버튼 표시 여부
 * @param {boolean} props.showCart - 장바구니 버튼 표시 여부
 */
export default function ApiErrorHandler({ 
  error, 
  onRetry, 
  onGoHome, 
  onGoCart,
  customMessage,
  showRetry = true,
  showCart = false
}) {
  // 에러 타입별 메시지 매핑
  const getErrorMessage = (error) => {
    if (customMessage) return customMessage;
    
    if (!error) return '알 수 없는 오류가 발생했습니다.';
    
    // 네트워크 에러 (apiClient에서 래핑된 에러 구조 반영)
    if (error.type === 'NETWORK_ERROR' || !error.originalError?.response) {
      return '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.';
    }
    
    // HTTP 상태 코드별 메시지
    switch (error.statusCode) {
      case 400:
        return '잘못된 요청입니다. 입력 정보를 확인해주세요.';
      case 401:
        return '로그인이 필요합니다.';
      case 403:
        return '접근 권한이 없습니다.';
      case 404:
        return '요청한 정보를 찾을 수 없습니다.';
      case 500:
        return '서버 일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      case 502:
      case 503:
      case 504:
        return '서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
      default:
        return error.message || '알 수 없는 오류가 발생했습니다.';
    }
  };

  const handleRetry = () => {
    logger.log('사용자가 재시도를 요청했습니다.');
    if (onRetry) {
      onRetry();
    }
  };

  const handleGoHome = () => {
    logger.log('사용자가 홈으로 이동을 요청했습니다.');
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleGoCart = () => {
    logger.log('사용자가 장바구니로 이동을 요청했습니다.');
    if (onGoCart) {
      onGoCart();
    } else {
      window.location.href = '/cart';
    }
  };

  const errorMessage = getErrorMessage(error);

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        ⚠️
      </div>
      
      <h2 className={styles.title}>
        오류가 발생했습니다
      </h2>
      
      <p className={styles.message}>
        {errorMessage}
      </p>
      
      <div className={styles.buttonContainer}>
        {showRetry && onRetry && (
          <Button
            onClick={handleRetry}
            variant="primary"
            size="medium"
          >
            다시 시도
          </Button>
        )}
        
        {showCart && (
          <Button
            onClick={handleGoCart}
            variant="primary"
            size="medium"
          >
            장바구니로 이동
          </Button>
        )}
        
        <Button
          onClick={handleGoHome}
          variant="secondary"
          size="medium"
        >
          홈으로 이동
        </Button>
      </div>
      
      {/* 개발 환경에서만 상세 에러 정보 표시 */}
      {import.meta.env.DEV && error && (
        <details className={styles.devDetails}>
          <summary className={styles.devSummary}>
            개발자 정보 (클릭하여 확장)
          </summary>
          <pre className={styles.devContent}>
            {JSON.stringify({
              message: error.message,
              statusCode: error.statusCode,
              type: error.type,
              // stack은 보안상 제외
              timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
} 
