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

  // React 마운트 후 초기 로딩 스피너 제거
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // console.log('🔄 초기 로딩 스피너 제거 중...');
        const spinner = document.getElementById('initial-loading-spinner');
        if (spinner) {
          spinner.remove();
          // console.log('✅ 초기 로딩 스피너 제거 완료');
        }
      } catch {
        // console.warn('초기 스피너 제거 중 오류:', error);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 앱 시작 시 데이터 마이그레이션 확인
  useEffect(() => {
    try {
      // console.log('🚀 App 시작 - 데이터 마이그레이션 확인 완료');
      
      // 마이그레이션 적용 로그 (한 번만 출력)
      const migratedData = loadAndMigrateCartData();
      if (migratedData._migratedAt) {
        // console.log('✅ 장바구니 데이터 마이그레이션이 적용되었습니다:', {
        //   version: migratedData._version,
        //   migratedAt: new Date(migratedData._migratedAt).toLocaleString(),
        //   menuCount: migratedData.orderMenus?.length || 0
        // });
      }
      
      // 실제 사용자 환경에서만 성능 측정 시작
      if (import.meta.env.PROD) {
        setTimeout(() => {
          try {
            // 운영 환경에서 성능 리포트 관련 기능은 별도 구현 필요
            console.log('성능 모니터링 시작 (운영 환경)');
          } catch (err) {
            console.warn('성능 리포트 생성 실패:', err);
          }
        }, 2000);
      }
    } catch (err) {
      // 에러가 발생해도 앱 동작에는 지장이 없도록 처리
      console.warn('데이터 마이그레이션 중 오류:', err);
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
    if (import.meta.env.DEV) {
      let timeoutId;
      // 페이지 로드 완료 후 성능 리포트 생성
      const handleLoad = async () => {
        // 조금 지연시켜 모든 리소스 로딩 완료 후 측정
        timeoutId = setTimeout(async () => {
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
        return () => {
          window.removeEventListener('load', handleLoad);
          if (timeoutId) clearTimeout(timeoutId);
        };
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
