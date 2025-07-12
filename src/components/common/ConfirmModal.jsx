// src/components/ConfirmModal.jsx
import React from "react";
import { ConfirmModal as NewConfirmModal } from "./Modal";

/**
 * @deprecated 기존 ConfirmModal은 통합 Modal 시스템으로 대체되었습니다.
 * import { ConfirmModal } from "./Modal"을 사용하세요.
 */
export default function ConfirmModal({ 
  message, 
  onCancel, 
  onConfirm, 
  confirmText = "확인", 
  cancelText = "취소" 
}) {
  return (
    <NewConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
    />
  );
}
