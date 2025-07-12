import PropTypes from 'prop-types';
import styles from "./Button.module.css";

/**
 * 통합 버튼 컴포넌트
 * @param {Object} props
 * @param {string} props.variant - 버튼 스타일 변형 ('primary', 'secondary', 'line', 'submit')
 * @param {string} props.size - 버튼 크기 ('small', 'medium', 'large')
 * @param {boolean} props.disabled - 비활성화 상태
 * @param {boolean} props.loading - 로딩 상태
 * @param {string} props.loadingText - 로딩 중 표시할 텍스트
 * @param {string} props.className - 추가 CSS 클래스
 * @param {function} props.onClick - 클릭 핸들러
 * @param {React.ReactNode} props.children - 버튼 내용
 */
export default function Button({ 
  children, 
  onClick, 
  className = "", 
  disabled = false,
  variant = "primary", // primary, secondary, line, submit
  size = "medium", // small, medium, large
  loading = false,
  loadingText = "처리 중...",
  type = "button",
  ...props 
}) {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    loading && styles.loading,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={buttonClasses} 
      onClick={onClick} 
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? (
        <span className={styles.loadingContainer}>
          <span className={styles.spinner} aria-hidden="true"></span>
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'secondary', 'line', 'submit']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  type: PropTypes.string
};
