import React from 'react';
import PropTypes from 'prop-types';
import styles from './Tag.module.css';

/**
 * 통합 태그/배지 컴포넌트
 * @param {Object} props
 * @param {React.ReactNode} props.children - 태그 내용
 * @param {string} props.variant - 태그 변형 ('default', 'primary', 'success', 'warning', 'error', 'info')
 * @param {string} props.size - 태그 크기 ('small', 'medium', 'large')
 * @param {boolean} props.outlined - 외곽선 스타일 여부
 * @param {boolean} props.rounded - 둥근 모서리 여부
 * @param {function} props.onRemove - 제거 기능 핸들러
 * @param {React.ReactNode} props.icon - 아이콘
 * @param {string} props.className - 추가 CSS 클래스
 */
export default function Tag({
  children,
  variant = 'default', // default, primary, success, warning, error, info
  size = 'medium', // small, medium, large
  outlined = false,
  rounded = false,
  onRemove,
  icon,
  className = '',
  ...props
}) {
  const tagClasses = [
    styles.tag,
    styles[variant],
    styles[size],
    outlined && styles.outlined,
    rounded && styles.rounded,
    onRemove && styles.removable,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={tagClasses} {...props}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.content}>{children}</span>
      {onRemove && (
        <button 
          className={styles.removeButton}
          onClick={onRemove}
          aria-label="태그 제거"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"/>
          </svg>
        </button>
      )}
    </span>
  );
}

Tag.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'primary', 'success', 'warning', 'error', 'info']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  outlined: PropTypes.bool,
  rounded: PropTypes.bool,
  onRemove: PropTypes.func,
  icon: PropTypes.node,
  className: PropTypes.string
};

// 특화된 태그 컴포넌트들
export function StatusTag({ status, ...props }) {
  const statusConfig = {
    active: { variant: 'success', children: '활성' },
    inactive: { variant: 'default', children: '비활성' },
    pending: { variant: 'warning', children: '대기중' },
    error: { variant: 'error', children: '오류' },
    completed: { variant: 'success', children: '완료' },
    cancelled: { variant: 'error', children: '취소됨' }
  };

  const config = statusConfig[status] || statusConfig.inactive;
  
  return <Tag {...config} {...props} />;
}

export function CountTag({ count, max, ...props }) {
  const displayCount = max && count > max ? `${max}+` : count;
  const isOverMax = max && count > max;
  
  return (
    <Tag 
      variant={isOverMax ? 'error' : 'primary'} 
      size="small" 
      rounded
      {...props}
    >
      {displayCount}
    </Tag>
  );
}

export function PriceTag({ 
  price, 
  originalPrice, 
  currency = '원',
  showDiscount = false,
  ...props 
}) {
  const discount = originalPrice && price < originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className={styles.priceTagContainer}>
      {showDiscount && discount > 0 && (
        <Tag variant="error" size="small" className={styles.discountTag}>
          {discount}% 할인
        </Tag>
      )}
      <Tag variant="primary" {...props}>
        {price.toLocaleString()}{currency}
      </Tag>
      {originalPrice && discount > 0 && (
        <span className={styles.originalPrice}>
          {originalPrice.toLocaleString()}{currency}
        </span>
      )}
    </div>
  );
} 
