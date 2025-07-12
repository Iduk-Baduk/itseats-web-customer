import React from 'react';
import PropTypes from 'prop-types';
import styles from './EmptyState.module.css';

const EmptyState = ({
  icon,
  title,
  description,
  actionText = "",
  onAction = null,
  variant = "default", // default, search, order, favorite
  className = ""
}) => {
  // 변형별 기본 설정
  const getVariantConfig = () => {
    switch (variant) {
      case 'search':
        return {
          icon: "🔍",
          title: "검색 결과가 없습니다",
          description: "다른 키워드로 검색해보세요"
        };
      case 'order':
        return {
          icon: "📋",
          title: "주문 내역이 없습니다",
          description: "첫 주문을 시작해보세요"
        };
      case 'favorite':
        return {
          icon: "❤️",
          title: "즐겨찾기가 없습니다",
          description: "관심있는 매장을 추가해보세요"
        };
      case 'cart':
        return {
          icon: "🛒",
          title: "장바구니가 비어있습니다",
          description: "맛있는 메뉴를 담아보세요"
        };
      default:
        return { 
          icon: "📦", 
          title: "데이터가 없습니다", 
          description: "" 
        };
    }
  };

  const config = getVariantConfig();
  
  // 명시적으로 전달된 props가 있으면 우선 사용, 없으면 variant 설정 사용
  const displayIcon = icon !== undefined ? icon : config.icon;
  const displayTitle = title !== undefined ? title : config.title;
  const displayDescription = description !== undefined ? description : config.description;

  return (
    <div className={`${styles.container} ${styles[variant]} ${className}`}>
      <div className={styles.content}>
        <div className={styles.icon} role="img" aria-label="빈 상태 아이콘">
          {displayIcon}
        </div>
        <h3 className={styles.title}>{displayTitle}</h3>
        {displayDescription && (
          <p className={styles.description}>{displayDescription}</p>
        )}
        {actionText && onAction && (
          <button 
            className={styles.actionButton}
            onClick={onAction}
            type="button"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  actionText: PropTypes.string,
  onAction: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'search', 'order', 'favorite', 'cart']),
  className: PropTypes.string
};

export default EmptyState; 
