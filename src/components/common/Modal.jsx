import React from "react";
import { createPortal } from "react-dom";
import PropTypes from 'prop-types';
import Button from "./basic/Button";
import styles from "./Modal.module.css";

/**
 * 통합 모달 컴포넌트
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {function} props.onClose - 모달 닫기 핸들러
 * @param {string} props.title - 모달 제목 (선택사항)
 * @param {React.ReactNode} props.children - 모달 내용
 * @param {string} props.variant - 모달 변형 ('default', 'confirm', 'alert', 'form')
 * @param {string} props.size - 모달 크기 ('small', 'medium', 'large')
 * @param {boolean} props.showCloseButton - 닫기 버튼 표시 여부
 * @param {boolean} props.closeOnOverlayClick - 오버레이 클릭 시 닫기 여부
 * @param {Object} props.actions - 액션 버튼들 설정
 * @param {string} props.className - 추가 CSS 클래스
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  variant = "default", // default, confirm, alert, form
  size = "medium", // small, medium, large
  showCloseButton = true,
  closeOnOverlayClick = true,
  actions = null,
  className = "",
  ...props
}) {
  // ESC 키로 닫기
  React.useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 모달이 열려있을 때 body 스크롤 방지
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose?.();
    }
  };

  const modalClasses = [
    styles.modal,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ');

  return createPortal(
    <div className={styles.overlay} onClick={handleOverlayClick} {...props}>
      <div className={modalClasses} role="dialog" aria-modal="true">
        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className={styles.header}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {showCloseButton && (
              <button 
                className={styles.closeButton}
                onClick={onClose}
                aria-label="모달 닫기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {/* 콘텐츠 */}
        <div className={styles.content}>
          {children}
        </div>

        {/* 액션 버튼들 */}
        {actions && (
          <div className={styles.actions}>
            {actions}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'confirm', 'alert', 'form']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  showCloseButton: PropTypes.bool,
  closeOnOverlayClick: PropTypes.bool,
  actions: PropTypes.node,
  className: PropTypes.string
};

// 편의를 위한 특화된 모달 컴포넌트들
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "확인",
  message,
  confirmText = "확인",
  cancelText = "취소",
  loading = false,
  ...props
}) {
  const actions = (
    <>
      <Button 
        variant="secondary" 
        onClick={onClose}
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button 
        variant="primary" 
        onClick={onConfirm}
        loading={loading}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="confirm"
      size="small"
      closeOnOverlayClick={!loading}
      actions={actions}
      {...props}
    >
      <p className={styles.message}>{message}</p>
    </Modal>
  );
}

export function AlertModal({
  isOpen,
  onClose,
  title = "알림",
  message,
  confirmText = "확인",
  ...props
}) {
  const actions = (
    <Button variant="primary" onClick={onClose}>
      {confirmText}
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="alert"
      size="small"
      actions={actions}
      {...props}
    >
      <p className={styles.message}>{message}</p>
    </Modal>
  );
} 
