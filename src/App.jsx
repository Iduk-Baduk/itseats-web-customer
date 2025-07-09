// src/App.jsx
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { useKakaoLoader } from "react-kakao-maps-sdk";
import Root from "./Root";
import { saveCart, saveCount } from "./store/localStorage"; // 경로는 실제 위치에 맞게 조정
import { loadAndMigrateCartData } from "./utils/dataMigration"; // 실제 경로에 맞게 수정
import DataMigrationNotice from "./components/common/DataMigrationNotice";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { generatePerformanceReport } from "./utils/performance";
import { checkStorageSize, clearLocalStorage } from "./utils/storageUtils";
import { logger } from "./utils/logger";
import { useTokenManagement } from "./hooks/useTokenManagement";

export default function App() {
  const cart = useSelector((state) => state.cart.orderMenus);
  const count = useSelector((state) => state.counter.count);
  const showDataMigrationNotice = useSelector(
    (state) => state.showDataMigrationNotice
  );

  // 토큰 관리 초기화
  const { tokenInfo } = useTokenManagement({
    checkInterval: 30 * 1000, // 30초마다 확인
    warningMinutes: 5, // 5분 전 경고
    autoRefresh: true,
    autoLogout: true
  });

  // 카카오맵 전역 로딩 (앱 시작 시 미리 로드)
  const [kakaoLoading, kakaoError] = useKakaoLoader({
    appkey: import.meta.env.VITE_APP_KAKAOMAP_KEY,
    libraries: ["services", "clusterer"],
  });

  // 카카오맵 로딩 상태 로그 (개발 환경에서만)
  useEffect(() => {
    if (import.meta.env.DEV) {
      if (kakaoLoading) {
        console.log("🔄 카카오맵 전역 로딩 중...");
      } else if (kakaoError) {
        console.error("❌ 카카오맵 로딩 오류:", kakaoError);
      } else {
        console.log("✅ 카카오맵 전역 로딩 완료");
      }
    }
  }, [kakaoLoading, kakaoError]);

  // 토큰 상태 로그 (개발 환경에서만)
  useEffect(() => {
    if (import.meta.env.DEV && tokenInfo) {
      logger.log("🔐 토큰 상태:", tokenInfo);
    }
  }, [tokenInfo]);

  // 초기화 및 설정
  useEffect(() => {
    // 초기 로딩 스피너 제거
    const removeSpinner = () => {
      try {
        const spinner = document.getElementById("initial-loading-spinner");
        if (spinner) {
          spinner.remove();
        }
      } catch (error) {
        console.warn("초기 스피너 제거 중 오류:", error);
      }
    };

    // 데이터 마이그레이션 수행
    const performDataMigration = () => {
      try {
        loadAndMigrateCartData();
      } catch (error) {
        console.warn("데이터 마이그레이션 중 오류:", error);
      }
    };

    // 카카오 API는 useKakaoLoader로 이미 전역 로딩 중이므로 별도 워밍업 불필요

    // 개발 환경에서만 성능 모니터링
    const initPerformanceMonitoring = () => {
      if (import.meta.env.DEV) {
        const timeoutId = setTimeout(async () => {
          try {
            await generatePerformanceReport();
          } catch (error) {
            console.warn("성능 리포트 생성 실패:", error);
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

  // 앱 시작 시 로컬스토리지 정리
  useEffect(() => {
    const cleanupStorage = () => {
      try {
        // 로컬스토리지 용량 체크
        const { size, needsCleanup } = checkStorageSize();

        if (needsCleanup) {
          logger.warn(
            `⚠️ 로컬스토리지 과부하 감지 (${size}MB), 긴급 정리 실행`
          );

          // 사용자에게 알림
          if (
            window.confirm(
              "앱 성능 향상을 위해 저장된 데이터를 정리하시겠습니까?"
            )
          ) {
            clearLocalStorage();
            alert("데이터 정리가 완료되었습니다. 페이지를 새로고침합니다.");
            window.location.reload();
          }
        } else {
          logger.log(`✅ 로컬스토리지 상태 양호 (${size}MB)`);
        }

        // 주문 개수 체크 (100개 이상이면 강제 정리)
        const orders = JSON.parse(localStorage.getItem("orders") || "[]");
        if (orders.length > 100) {
          logger.warn(
            `⚠️ 주문 데이터 과다 (${orders.length}개), 강제 정리 실행`
          );
          // 선택적 정리 (최근 50개만 유지)
          const recentOrders = orders.slice(-50);
          localStorage.setItem("orders", JSON.stringify(recentOrders));
          logger.log(
            `✅ 주문 데이터 정리 완료: ${orders.length}개 → ${recentOrders.length}개`
          );
        }
      } catch (error) {
        logger.error("❌ 로컬스토리지 정리 중 오류:", error);
        // 오류 발생 시 강제 정리
        try {
          localStorage.clear();
          alert("데이터 오류가 발생하여 저장된 데이터를 모두 정리했습니다.");
          window.location.reload();
        } catch (clearError) {
          logger.error("❌ 강제 정리도 실패:", clearError);
        }
      }
    };

    // 앱 시작 시 한 번만 실행
    cleanupStorage();
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
