import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/basic/Button';
import styles from './NotFound.module.css';

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToStores = () => {
    navigate('/stores');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 404 아이콘 및 메시지 */}
        <div className={styles.errorSection}>
          <div className={styles.errorIcon}>🍽️</div>
          <h1 className={styles.errorCode}>404</h1>
          <h2 className={styles.errorTitle}>페이지를 찾을 수 없습니다</h2>
          <p className={styles.errorMessage}>
            요청하신 페이지가 존재하지 않거나<br />
            이동되었을 수 있습니다.
          </p>
        </div>

        {/* 추천 액션 */}
        <div className={styles.suggestions}>
          <h3>다음 중 하나를 시도해보세요:</h3>
          <ul className={styles.suggestionList}>
            <li>🏠 홈페이지에서 다시 시작하기</li>
            <li>🔙 이전 페이지로 돌아가기</li>
            <li>🏪 매장 목록에서 음식 찾기</li>
            <li>🔍 검색으로 원하는 메뉴 찾기</li>
          </ul>
        </div>

        {/* 액션 버튼들 */}
        <div className={styles.actionButtons}>
          <Button
            onClick={handleGoHome}
            variant="primary"
            size="large"
            className={styles.primaryButton}
          >
            홈으로 가기
          </Button>
          
          <div className={styles.secondaryButtons}>
            <Button
              onClick={handleGoBack}
              variant="outline"
              size="medium"
            >
              이전 페이지
            </Button>
            
            <Button
              onClick={handleGoToStores}
              variant="outline"
              size="medium"
            >
              매장 목록
            </Button>
          </div>
        </div>

        {/* 도움말 */}
        <div className={styles.helpInfo}>
          <p>계속해서 문제가 발생한다면</p>
          <p>고객센터로 문의해 주세요: <strong>1588-1234</strong></p>
        </div>
      </div>
    </div>
  );
} 
