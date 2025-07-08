import React from 'react';
import Button from './basic/Button';
import { logger } from '../../utils/logger';

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
    
    // 네트워크 에러
    if (error.type === 'NETWORK_ERROR' || !error.response) {
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      minHeight: '300px'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '20px',
        color: '#666'
      }}>
        ⚠️
      </div>
      
      <h2 style={{
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '12px',
        color: '#333'
      }}>
        오류가 발생했습니다
      </h2>
      
      <p style={{
        fontSize: '14px',
        color: '#666',
        marginBottom: '30px',
        lineHeight: '1.5',
        maxWidth: '400px'
      }}>
        {errorMessage}
      </p>
      
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
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
        <details style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          fontSize: '12px',
          textAlign: 'left',
          maxWidth: '500px',
          width: '100%'
        }}>
          <summary style={{ cursor: 'pointer', fontWeight: '600' }}>
            개발자 정보 (클릭하여 확장)
          </summary>
          <pre style={{
            marginTop: '10px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '11px',
            color: '#666'
          }}>
            {JSON.stringify({
              message: error.message,
              statusCode: error.statusCode,
              type: error.type,
              stack: error.stack
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
} 
