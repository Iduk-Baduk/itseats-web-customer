// src/App.jsx
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import Root from "./Root";
import { saveCart, saveCount } from "./store/localStorage"; // 경로는 실제 위치에 맞게 조정
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
    const removeInitialSpinner = () => {
      try {
        const initialSpinner = document.querySelector('.initial-loading');
        if (initialSpinner) {
          if (import.meta.env.DEV) {
            console.log('🔄 초기 로딩 스피너 제거 중...');
          }
          initialSpinner.remove(); // 더 현대적인 방법
          if (import.meta.env.DEV) {
            console.log('✅ 초기 로딩 스피너 제거 완료');
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('초기 스피너 제거 중 오류:', error);
        }
      }
    };

    // React 컴포넌트가 마운트되자마자 즉시 실행
    removeInitialSpinner();
    
    // 추가 안전장치: 약간의 지연 후 다시 한 번 확인
    const timeoutId = setTimeout(removeInitialSpinner, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

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
