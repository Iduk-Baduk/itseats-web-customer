// src/App.jsx
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import Root from "./Root";
import { saveCart, saveCount } from "./store/localStorage"; // 경로는 실제 위치에 맞게 조정
import { loadAndMigrateCartData } from "./utils/dataMigration"; // 실제 경로에 맞게 수정
import DataMigrationNotice from "./components/common/DataMigrationNotice";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { generatePerformanceReport } from "./utils/performance";

export default function App() {
  const cart = useSelector((state) => state.cart.orderMenus);
  const count = useSelector((state) => state.counter.count);
  const showDataMigrationNotice = useSelector(
    (state) => state.showDataMigrationNotice
  );

  // 초기화 및 설정
  useEffect(() => {
    // 초기 로딩 스피너 제거
    const removeSpinner = () => {
      try {
        const spinner = document.getElementById('initial-loading-spinner');
        if (spinner) {
          spinner.remove();
        }
      } catch (error) {
        console.warn('초기 스피너 제거 중 오류:', error);
      }
    };

    // 데이터 마이그레이션 수행
    const performDataMigration = () => {
      try {
        loadAndMigrateCartData();
      } catch (error) {
        console.warn('데이터 마이그레이션 중 오류:', error);
      }
    };

    // 개발 환경에서만 성능 모니터링
    const initPerformanceMonitoring = () => {
      if (import.meta.env.DEV) {
        const timeoutId = setTimeout(async () => {
          try {
            await generatePerformanceReport();
          } catch (error) {
            console.warn('성능 리포트 생성 실패:', error);
          }
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    };

    // 1초 후 초기화 작업 수행
    const timer = setTimeout(() => {
      removeSpinner();
      performDataMigration();
    }, 1000);

    // 성능 모니터링 정리 함수
    const cleanupPerformance = initPerformanceMonitoring();

    return () => {
      clearTimeout(timer);
      if (cleanupPerformance) cleanupPerformance();
    };
  }, []);

  // 상태 변경 감지 및 저장
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  useEffect(() => {
    saveCount(count);
  }, [count]);

  return (
    <ErrorBoundary>
      <Router>
        <Root />
        {showDataMigrationNotice && <DataMigrationNotice />}
      </Router>
    </ErrorBoundary>
  );
}
