// src/components/common/Toast.jsx
import React, { useEffect } from "react";
import styles from "./Toast.module.css";

export default function Toast({ message, onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={styles.toast}>
      {message}
    </div>
  );
}
