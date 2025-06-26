// src/App.jsx
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import Root from "./Root";
import { saveCart, saveCount } from "./store/localStorage"; // 경로는 실제 위치에 맞게 조정
import { loadAndMigrateCartData } from "./utils/dataMigration";
import DataMigrationNotice from "./components/common/DataMigrationNotice";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { generatePerformanceReport } from "./utils/performance";

export default function App() {
  const cart = useSelector((state) => state.cart.orderMenus);
  const count = useSelector((state) => state.counter.count);
  const showDataMigrationNotice = useSelector(
    (state) => state.showDataMigrationNotice
  );

  // 앱 시작 시 데이터 마이그레이션 확인
  useEffect(() => {
    console.log('🚀 App 시작 - 데이터 마이그레이션 확인 완료');
    
    try {
      const rawData = localStorage.getItem('itseats-cart');
      const cartData = rawData ? JSON.parse(rawData) : null;
      
      if (cartData && (cartData._migrated || cartData._migratedAt)) {
        console.log('✅ 장바구니 데이터 마이그레이션이 적용되었습니다:', {
          version: cartData._version,
          migratedAt: cartData._migratedAt,
          itemCount: cartData.orderMenus?.length || 0
        });
      }
    } catch (error) {
      console.error('마이그레이션 상태 확인 실패:', error);
    }
  }, []);

  // 장바구니 상태가 변경될 때 localStorage에 저장
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  // 카운터 값 변경 시 localStorage에 저장
  useEffect(() => {
    saveCount(count);
  }, [count]);

  // 성능 모니터링 (개발 환경에서만)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // 페이지 로드 완료 후 성능 리포트 생성
      const handleLoad = async () => {
        // 조금 지연시켜 모든 리소스 로딩 완료 후 측정
        setTimeout(async () => {
          try {
            await generatePerformanceReport();
          } catch (error) {
            console.warn('성능 리포트 생성 실패:', error);
          }
        }, 1000);
      };

      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad);
        return () => window.removeEventListener('load', handleLoad);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <Root />
        {showDataMigrationNotice && <DataMigrationNotice />}
      </Router>
    </ErrorBoundary>
  );
}
