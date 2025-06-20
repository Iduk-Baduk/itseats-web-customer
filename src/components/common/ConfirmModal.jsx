// src/components/ConfirmModal.jsx
import React from "react";
import styles from "./ConfirmModal.module.css";

export default function ConfirmModal({ message, onCancel, onConfirm }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttonGroup}>
          <button className={styles.cancelButton} onClick={onCancel}>
            취소
          </button>
          <button className={styles.confirmButton} onClick={onConfirm}>
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
