// ===== 성능 모니터링 유틸리티 =====

/**
 * 페이지 로딩 성능 측정
 */
export const measurePageLoad = () => {
  if (!window.performance) return null;

  // Navigation Timing API v2 사용
  const perfEntries = performance.getEntriesByType('navigation');
  if (perfEntries.length === 0) {
    // 폴백: 기존 API 사용 (지원되는 경우)
    if (window.performance.timing) {
      const perfData = window.performance.timing;
      const loadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domReady = perfData.domContentLoadedEventEnd - perfData.navigationStart;
      const firstPaint = perfData.responseStart - perfData.navigationStart;
      
      return {
        loadTime,
        domReady,
        firstPaint,
        timestamp: Date.now(),
        apiVersion: 'v1-fallback'
      };
    }
    return null;
  }
  
  const navTiming = perfEntries[0];
  const loadTime = navTiming.loadEventEnd - navTiming.fetchStart;
  const domReady = navTiming.domContentLoadedEventEnd - navTiming.fetchStart;
  const firstPaint = navTiming.responseStart - navTiming.fetchStart;

  return {
    loadTime,
    domReady,
    firstPaint,
    timestamp: Date.now(),
    apiVersion: 'v2'
  };
};

/**
 * 컴포넌트 렌더링 성능 측정
 */
export const measureComponentRender = (componentName, renderFn) => {
  const startTime = performance.now();
  const result = renderFn();
  const endTime = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${componentName} 렌더링 시간: ${(endTime - startTime).toFixed(2)}ms`);
  }
  
  return result;
};

/**
 * 메모리 사용량 측정 (Chrome DevTools API)
 */
export const measureMemoryUsage = () => {
  if (!window.performance || !window.performance.memory) {
    return null;
  }

  const memory = window.performance.memory;
  return {
    usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
    totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
    jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
    timestamp: Date.now()
  };
};

/**
 * 네트워크 상태 감지
 */
export const getNetworkInfo = () => {
  if (!navigator.connection && !navigator.mozConnection && !navigator.webkitConnection) {
    return { type: 'unknown', effectiveType: 'unknown' };
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return {
    type: connection.type || 'unknown',
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: connection.saveData || false
  };
};

/**
 * 이미지 로딩 성능 측정
 */
export const measureImageLoad = (imageSrc) => {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const img = new Image();
    
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      resolve({
        src: imageSrc,
        loadTime: Math.round(loadTime),
        success: true,
        timestamp: Date.now()
      });
    };
    
    img.onerror = () => {
      const loadTime = performance.now() - startTime;
      resolve({
        src: imageSrc,
        loadTime: Math.round(loadTime),
        success: false,
        timestamp: Date.now()
      });
    };
    
    img.src = imageSrc;
  });
};

/**
 * Core Web Vitals 측정
 */
export const measureCoreWebVitals = () => {
  if (!window.performance || !window.PerformanceObserver) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const vitals = {
      LCP: null, // Largest Contentful Paint
      FID: null, // First Input Delay
      CLS: null  // Cumulative Layout Shift
    };

    let completedCount = 0;
    let clsObserver = null;

    function checkComplete() {
      completedCount++;
      if (completedCount >= 3) { // LCP, FID, CLS 완료 시
        resolve(vitals);
      }
    }

    // LCP 측정
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      vitals.LCP = Math.round(lastEntry.startTime);
      lcpObserver.disconnect();
      checkComplete();
    });
    
    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      vitals.LCP = 'not-supported';
      checkComplete();
    }

    // FID 측정
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        vitals.FID = Math.round(entry.processingStart - entry.startTime);
      });
      fidObserver.disconnect();
      checkComplete();
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      vitals.FID = 'not-supported';
      checkComplete();
    }

    // CLS 측정
    let clsValue = 0;
    clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      vitals.CLS = Math.round(clsValue * 1000) / 1000;
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      vitals.CLS = 'not-supported';
      checkComplete();
      return;
    }

    // 5초 후 CLS 측정 완료
    setTimeout(() => {
      if (clsObserver) {
        clsObserver.disconnect();
      }
      vitals.CLS = vitals.CLS || Math.round(clsValue * 1000) / 1000;
      checkComplete();
    }, 5000);
  });
};

/**
 * 성능 리포트 생성
 */
export const generatePerformanceReport = async () => {
  const pageLoad = measurePageLoad();
  const memory = measureMemoryUsage();
  const network = getNetworkInfo();
  const webVitals = await measureCoreWebVitals();

  const report = {
    timestamp: new Date().toISOString(),
    pageLoad,
    memory,
    network,
    webVitals,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };

  if (process.env.NODE_ENV === 'development') {
    console.group('🚀 성능 리포트');
    console.table(report.pageLoad);
    console.table(report.memory);
    console.table(report.network);
    console.table(report.webVitals);
    console.groupEnd();
  }

  return report;
};

/**
 * 성능 데이터를 서버로 전송 (옵션)
 */
export const sendPerformanceData = async (report) => {
  if (process.env.NODE_ENV !== 'production') return;

  try {
    // 실제 환경에서는 적절한 API 엔드포인트로 변경
    await fetch('/api/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(report)
    });
  } catch (error) {
    console.warn('성능 데이터 전송 실패:', error);
  }
}; 