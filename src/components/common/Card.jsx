import React from 'react';
import PropTypes from 'prop-types';
import styles from './Card.module.css';

/**
 * 통합 카드 컴포넌트
 * @param {Object} props
 * @param {React.ReactNode} props.children - 카드 내용
 * @param {string} props.variant - 카드 변형 ('default', 'outlined', 'elevated', 'flat')
 * @param {string} props.size - 카드 크기 ('small', 'medium', 'large')
 * @param {boolean} props.interactive - 상호작용 가능 여부 (호버 효과)
 * @param {boolean} props.loading - 로딩 상태
 * @param {function} props.onClick - 클릭 핸들러
 * @param {string} props.className - 추가 CSS 클래스
 */
export default function Card({
  children,
  variant = 'default', // default, outlined, elevated, flat
  size = 'medium', // small, medium, large
  interactive = false,
  loading = false,
  onClick,
  className = '',
  ...props
}) {
  const cardClasses = [
    styles.card,
    styles[variant],
    styles[size],
    interactive && styles.interactive,
    loading && styles.loading,
    onClick && styles.clickable,
    className
  ].filter(Boolean).join(' ');

  const CardElement = onClick ? 'button' : 'div';

  return (
    <CardElement 
      className={cardClasses}
      onClick={onClick}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.skeleton}></div>
        </div>
      ) : (
        children
      )}
    </CardElement>
  );
}

Card.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'outlined', 'elevated', 'flat']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  interactive: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string
};

// 특화된 카드 컴포넌트들
export function ImageCard({
  image,
  title,
  description,
  badge,
  actions,
  imageAlt = '',
  ...props
}) {
  return (
    <Card {...props}>
      <div className={styles.imageCardContent}>
        {image && (
          <div className={styles.imageContainer}>
            <img 
              src={image} 
              alt={imageAlt}
              className={styles.cardImage}
              loading="lazy"
            />
            {badge && (
              <div className={styles.badge}>
                {badge}
              </div>
            )}
          </div>
        )}
        <div className={styles.cardBody}>
          {title && <h3 className={styles.cardTitle}>{title}</h3>}
          {description && <p className={styles.cardDescription}>{description}</p>}
          {actions && (
            <div className={styles.cardActions}>
              {actions}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function InfoCard({
  icon,
  title,
  value,
  description,
  trend,
  ...props
}) {
  return (
    <Card {...props}>
      <div className={styles.infoCardContent}>
        <div className={styles.infoHeader}>
          {icon && <div className={styles.cardIcon}>{icon}</div>}
          <div className={styles.infoText}>
            {title && <h4 className={styles.infoTitle}>{title}</h4>}
            {value && <div className={styles.infoValue}>{value}</div>}
          </div>
          {trend && <div className={styles.trend}>{trend}</div>}
        </div>
        {description && (
          <p className={styles.infoDescription}>{description}</p>
        )}
      </div>
    </Card>
  );
}

export function ListCard({
  items = [],
  renderItem,
  showDividers = true,
  emptyMessage = "항목이 없습니다",
  ...props
}) {
  return (
    <Card {...props}>
      <div className={styles.listCardContent}>
        {items.length > 0 ? (
          <ul className={styles.cardList}>
            {items.map((item, index) => (
              <li 
                key={index} 
                className={`${styles.listItem} ${
                  showDividers && index !== items.length - 1 ? styles.withDivider : ''
                }`}
              >
                {renderItem ? renderItem(item, index) : item}
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>{emptyMessage}</p>
          </div>
        )}
      </div>
    </Card>
  );
} 
