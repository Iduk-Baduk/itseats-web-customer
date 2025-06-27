import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import Button from '../../components/common/basic/Button';
import Card from '../../components/common/Card';
import styles from './PaymentFailure.module.css';

export default function PaymentFailure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorInfo, setErrorInfo] = useState(null);

  // URL 파라미터에서 에러 정보 추출
  const errorCode = searchParams.get('error');
  const errorMessage = searchParams.get('message');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    // 에러 코드에 따른 메시지 설정
    const getErrorInfo = (code) => {
      switch (code) {
        case 'insufficient_funds':
          return {
            title: '잔액이 부족합니다',
            message: '선택하신 결제수단의 잔액이 부족합니다.\n다른 결제수단을 선택하거나 잔액을 충전해 주세요.',
            icon: '💳',
            canRetry: true
          };
        case 'card_declined':
          return {
            title: '카드 결제가 거절되었습니다',
            message: '카드사에서 결제를 거절했습니다.\n카드 정보를 확인하거나 다른 카드로 시도해 주세요.',
            icon: '❌',
            canRetry: true
          };
        case 'network_error':
          return {
            title: '네트워크 오류가 발생했습니다',
            message: '인터넷 연결을 확인하고 다시 시도해 주세요.',
            icon: '🌐',
            canRetry: true
          };
        case 'timeout':
          return {
            title: '결제 시간이 초과되었습니다',
            message: '결제 처리 시간이 초과되었습니다.\n다시 시도해 주세요.',
            icon: '⏰',
            canRetry: true
          };
        case 'invalid_card':
          return {
            title: '유효하지 않은 카드입니다',
            message: '입력하신 카드 정보가 올바르지 않습니다.\n카드 정보를 다시 확인해 주세요.',
            icon: '🚫',
            canRetry: true
          };
        case 'processing_failed':
          return {
            title: '결제 처리 중 오류가 발생했습니다',
            message: '시스템 오류로 결제 처리에 실패했습니다.\n잠시 후 다시 시도해 주세요.',
            icon: '⚠️',
            canRetry: true
          };
        case 'cancelled':
          return {
            title: '결제가 취소되었습니다',
            message: '사용자에 의해 결제가 취소되었습니다.',
            icon: '✋',
            canRetry: true
          };
        default:
          return {
            title: '결제에 실패했습니다',
            message: errorMessage || '알 수 없는 오류가 발생했습니다.\n고객센터로 문의해 주세요.',
            icon: '❌',
            canRetry: false
          };
      }
    };

    setErrorInfo(getErrorInfo(errorCode));
  }, [errorCode, errorMessage]);

  const handleRetryPayment = () => {
    // 장바구니로 돌아가서 다시 결제
    navigate('/cart');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleContactSupport = () => {
    // 고객센터 연결 (향후 구현)
    alert('고객센터: 1588-1234\n운영시간: 평일 09:00-18:00');
  };

  const handleGoToOrders = () => {
    navigate('/orders');
  };

  if (!errorInfo) {
    return (
      <div className={styles.container}>
        <Header title="결제 실패" />
        <div className={styles.loadingContainer}>
          <p>오류 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header title="결제 실패" />
      
      <div className={styles.content}>
        {/* 실패 아이콘 및 메시지 */}
        <div className={styles.failureSection}>
          <div className={styles.failureIcon}>{errorInfo.icon}</div>
          <h1 className={styles.failureTitle}>{errorInfo.title}</h1>
          <p className={styles.failureMessage}>
            {errorInfo.message.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < errorInfo.message.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        </div>

        {/* 오류 정보 카드 */}
        <Card className={styles.errorInfoCard}>
          <div className={styles.cardHeader}>
            <h3>오류 정보</h3>
          </div>
          
          <div className={styles.errorDetails}>
            <div className={styles.errorRow}>
              <span className={styles.label}>오류 코드</span>
              <span className={styles.value}>{errorCode || 'UNKNOWN'}</span>
            </div>
            
            {orderId && (
              <div className={styles.errorRow}>
                <span className={styles.label}>주문 번호</span>
                <span className={styles.value}>{orderId}</span>
              </div>
            )}
            
            <div className={styles.errorRow}>
              <span className={styles.label}>발생 시간</span>
              <span className={styles.value}>
                {new Date().toLocaleString('ko-KR')}
              </span>
            </div>
          </div>
        </Card>

        {/* 해결 방법 안내 */}
        <Card className={styles.solutionCard}>
          <div className={styles.cardHeader}>
            <h3>해결 방법</h3>
          </div>
          
          <div className={styles.solutionList}>
            <div className={styles.solutionItem}>
              <span className={styles.solutionIcon}>1️⃣</span>
              <div>
                <h4>결제 정보 확인</h4>
                <p>카드 번호, 유효기간, CVC 번호를 다시 확인해 주세요.</p>
              </div>
            </div>
            
            <div className={styles.solutionItem}>
              <span className={styles.solutionIcon}>2️⃣</span>
              <div>
                <h4>다른 결제수단 이용</h4>
                <p>다른 카드나 계좌로 결제를 시도해 보세요.</p>
              </div>
            </div>
            
            <div className={styles.solutionItem}>
              <span className={styles.solutionIcon}>3️⃣</span>
              <div>
                <h4>잠시 후 재시도</h4>
                <p>일시적인 오류일 수 있으니 잠시 후 다시 시도해 주세요.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* 액션 버튼들 */}
        <div className={styles.actionButtons}>
          {errorInfo.canRetry && (
            <Button
              onClick={handleRetryPayment}
              variant="primary"
              size="large"
              className={styles.primaryButton}
            >
              다시 결제하기
            </Button>
          )}
          
          <div className={styles.secondaryButtons}>
            <Button
              onClick={handleGoToOrders}
              variant="outline"
              size="medium"
            >
              주문 내역
            </Button>
            
            <Button
              onClick={handleContactSupport}
              variant="outline"
              size="medium"
            >
              고객센터
            </Button>
            
            <Button
              onClick={handleGoHome}
              variant="text"
              size="medium"
            >
              홈으로
            </Button>
          </div>
        </div>

        {/* 추가 안내 */}
        <div className={styles.additionalInfo}>
          <p>• 결제 관련 문의는 고객센터로 연락해 주세요</p>
          <p>• 카드사 문제인 경우 해당 카드사에 직접 문의하세요</p>
          <p>• 주문 상품은 장바구니에 그대로 보관됩니다</p>
        </div>
      </div>
    </div>
  );
} 
