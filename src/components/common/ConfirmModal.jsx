// src/components/ConfirmModal.jsx
import React from "react";
import styles from "./ConfirmModal.module.css";

export default function ConfirmModal({ 
  message, 
  onCancel, 
  onConfirm, 
  confirmText = "확인", 
  cancelText = "취소" 
}) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttonGroup}>
          <button className={styles.cancelButton} onClick={onCancel}>
            {cancelText}
          </button>
          <button className={styles.confirmButton} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
