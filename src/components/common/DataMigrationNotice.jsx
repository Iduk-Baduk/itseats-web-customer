import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styles from './DataMigrationNotice.module.css';

export default function DataMigrationNotice() {
  const [showNotice, setShowNotice] = useState(false);
  const [migrationInfo, setMigrationInfo] = useState(null);
  const cartVersion = useSelector(state => state.cart._version);
  const cartMigratedAt = useSelector(state => state.cart._migratedAt);

  useEffect(() => {
    // 마이그레이션 정보 확인
    const checkMigration = () => {
      try {
        const cartData = JSON.parse(localStorage.getItem('itseats-cart') || '{}');
        
        // 최근 24시간 내에 마이그레이션된 경우만 알림 표시
        if (cartData._migratedAt) {
          const migrationTime = new Date(cartData._migratedAt);
          const now = new Date();
          const hoursDiff = (now - migrationTime) / (1000 * 60 * 60);
          
          if (hoursDiff < 24 && !sessionStorage.getItem('migration-notice-seen')) {
            setMigrationInfo({
              version: cartData._version,
              migratedAt: migrationTime.toLocaleString(),
              itemCount: cartData.orderMenus?.length || 0,
              legacyVersion: cartData._legacyVersion
            });
            setShowNotice(true);
          }
        }
      } catch (error) {
        console.warn('Migration notice check failed:', error);
      }
    };

    checkMigration();
  }, [cartVersion, cartMigratedAt]);

  const handleClose = () => {
    setShowNotice(false);
    sessionStorage.setItem('migration-notice-seen', 'true');
  };

  if (!showNotice || !migrationInfo) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.notice}>
        <div className={styles.header}>
          <h3>🔄 데이터 업데이트 완료</h3>
          <button onClick={handleClose} className={styles.closeButton}>
            ×
          </button>
        </div>
        
        <div className={styles.content}>
          <p>
            장바구니 데이터가 새로운 형식으로 업데이트되었습니다.
          </p>
          
          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span className={styles.label}>업데이트 시간:</span>
              <span className={styles.value}>{migrationInfo.migratedAt}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.label}>저장된 메뉴:</span>
              <span className={styles.value}>{migrationInfo.itemCount}개</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.label}>데이터 버전:</span>
              <span className={styles.value}>
                {migrationInfo.legacyVersion} → {migrationInfo.version}
              </span>
            </div>
          </div>
          
          <div className={styles.benefits}>
            <h4>개선사항:</h4>
            <ul>
              <li>✅ 주문 처리 속도 향상</li>
              <li>✅ 메뉴 옵션 관리 개선</li>
              <li>✅ 다중 쿠폰 사용 지원</li>
              <li>✅ 서버 연동 안정성 향상</li>
            </ul>
          </div>
          
          <p className={styles.footer}>
            기존 장바구니 내용은 그대로 유지됩니다.
          </p>
        </div>
        
        <div className={styles.actions}>
          <button onClick={handleClose} className={styles.confirmButton}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
} 
