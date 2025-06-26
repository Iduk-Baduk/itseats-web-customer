import React from 'react';
import PropTypes from 'prop-types';
import styles from './ErrorState.module.css';

const ErrorState = ({
  icon = "⚠️",
  title = "오류가 발생했습니다",
  description = "잠시 후 다시 시도해주세요",
  primaryActionText = "다시 시도",
  secondaryActionText = "이전 페이지",
  onPrimaryAction = null,
  onSecondaryAction = null,
  variant = "default", // default, network, server, notFound
  className = "",
  showActions = true
}) => {
  // 변형별 기본 설정
  const getVariantConfig = () => {
    switch (variant) {
      case 'network':
        return {
          icon: "📡",
          title: "네트워크 오류",
          description: "인터넷 연결을 확인하고 다시 시도해주세요"
        };
      case 'server':
        return {
          icon: "🔧",
          title: "서버 오류",
          description: "일시적인 서버 문제가 발생했습니다"
        };
      case 'notFound':
        return {
          icon: "🔍",
          title: "페이지를 찾을 수 없습니다",
          description: "요청하신 페이지가 존재하지 않습니다"
        };
      case 'unauthorized':
        return {
          icon: "🔐",
          title: "접근 권한이 없습니다",
          description: "로그인이 필요하거나 권한이 부족합니다"
        };
      default:
        return { icon, title, description };
    }
  };

  const config = getVariantConfig();
  const displayIcon = icon !== "⚠️" ? icon : config.icon;
  const displayTitle = title !== "오류가 발생했습니다" ? title : config.title;
  const displayDescription = description !== "잠시 후 다시 시도해주세요" ? description : config.description;

  const handlePrimaryAction = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
    } else {
      // 기본 동작: 페이지 새로고침
      window.location.reload();
    }
  };

  const handleSecondaryAction = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    } else {
      // 기본 동작: 이전 페이지로
      window.history.back();
    }
  };

  return (
    <div className={`${styles.container} ${styles[variant]} ${className}`}>
      <div className={styles.content}>
        <div className={styles.icon} role="img" aria-label="에러 아이콘">
          {displayIcon}
        </div>
        <h3 className={styles.title}>{displayTitle}</h3>
        <p className={styles.description}>{displayDescription}</p>
        
        {showActions && (
          <div className={styles.actions}>
            <button 
              className={styles.primaryButton}
              onClick={handlePrimaryAction}
              type="button"
            >
              {primaryActionText}
            </button>
            <button 
              className={styles.secondaryButton}
              onClick={handleSecondaryAction}
              type="button"
            >
              {secondaryActionText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

ErrorState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  primaryActionText: PropTypes.string,
  secondaryActionText: PropTypes.string,
  onPrimaryAction: PropTypes.func,
  onSecondaryAction: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'network', 'server', 'notFound', 'unauthorized']),
  className: PropTypes.string,
  showActions: PropTypes.bool
};

export default ErrorState; 
