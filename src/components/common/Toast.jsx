// src/components/common/Toast.jsx
import { useEffect, useState } from 'react';
import styles from './Toast.module.css';

export default function Toast({ message, duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={styles.toastContainer}>
      <div className={styles.toast}>
        {message}
      </div>
    </div>
  );
}
