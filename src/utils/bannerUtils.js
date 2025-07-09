// 배너 높이 조절 유틸리티 함수들

/**
 * 뷰포트 크기에 따른 동적 높이 계산
 * @param {number} percentage - 뷰포트 높이의 퍼센트 (0-100)
 * @param {number} minHeight - 최소 높이 (px)
 * @param {number} maxHeight - 최대 높이 (px)
 * @returns {string} 계산된 높이 값
 */
export const calculateViewportHeight = (percentage, minHeight = 150, maxHeight = 500) => {
  const viewportHeight = window.innerHeight;
  const calculatedHeight = (viewportHeight * percentage) / 100;
  
  if (calculatedHeight < minHeight) return `${minHeight}px`;
  if (calculatedHeight > maxHeight) return `${maxHeight}px`;
  
  return `${calculatedHeight}px`;
};

/**
 * 화면 크기에 따른 반응형 높이 설정
 * @param {Object} breakpoints - 브레이크포인트별 높이 설정
 * @returns {Object} 현재 화면 크기에 맞는 높이 설정
 */
export const getResponsiveHeight = (breakpoints = {}) => {
  const defaultBreakpoints = {
    mobile: { height: "200px", minHeight: "150px", maxHeight: "300px" },
    tablet: { height: "250px", minHeight: "200px", maxHeight: "400px" },
    desktop: { height: "300px", minHeight: "250px", maxHeight: "500px" },
    ...breakpoints
  };

  const width = window.innerWidth;
  
  if (width < 768) {
    return defaultBreakpoints.mobile;
  } else if (width < 1024) {
    return defaultBreakpoints.tablet;
  } else {
    return defaultBreakpoints.desktop;
  }
};

/**
 * 비디오 비율에 따른 높이 계산
 * @param {string} aspectRatio - 비율 (예: "16/9", "4/3")
 * @param {number} width - 컨테이너 너비
 * @returns {number} 계산된 높이
 */
export const calculateAspectRatioHeight = (aspectRatio, width) => {
  const [w, h] = aspectRatio.split('/').map(Number);
  return (width * h) / w;
};

/**
 * 배너 높이 설정을 문자열로 변환
 * @param {Object} heightConfig - 높이 설정 객체
 * @returns {string} CSS 스타일 문자열
 */
export const heightConfigToStyle = (heightConfig) => {
  const { height, minHeight, maxHeight, aspectRatio } = heightConfig;
  
  return `
    height: ${height || 'auto'};
    min-height: ${minHeight || '150px'};
    max-height: ${maxHeight || 'none'};
    ${aspectRatio ? `aspect-ratio: ${aspectRatio};` : ''}
  `;
};

/**
 * 배너 높이 프리셋 생성
 * @param {string} type - 프리셋 타입
 * @param {Object} customSettings - 커스텀 설정
 * @returns {Object} 높이 설정 객체
 */
export const createHeightPreset = (type, customSettings = {}) => {
  const presets = {
    compact: {
      height: "120px",
      minHeight: "100px",
      maxHeight: "150px"
    },
    standard: {
      height: "200px",
      minHeight: "150px",
      maxHeight: "300px"
    },
    prominent: {
      height: "300px",
      minHeight: "250px",
      maxHeight: "500px"
    },
    fullscreen: {
      height: "100vh",
      minHeight: "400px",
      maxHeight: "100vh"
    },
    auto: {
      height: "auto",
      aspectRatio: "16/9",
      minHeight: "150px"
    }
  };

  return { ...presets[type], ...customSettings };
};

/**
 * 배너 높이 최적화 (성능 고려)
 * @param {Object} heightConfig - 원본 높이 설정
 * @param {boolean} isMobile - 모바일 여부
 * @returns {Object} 최적화된 높이 설정
 */
export const optimizeBannerHeight = (heightConfig, isMobile = false) => {
  const optimized = { ...heightConfig };
  
  if (isMobile) {
    // 모바일에서는 높이를 줄여서 성능 향상
    if (optimized.height && optimized.height.includes('px')) {
      const heightValue = parseInt(optimized.height);
      optimized.height = `${Math.min(heightValue, 200)}px`;
    }
    
    if (optimized.maxHeight && optimized.maxHeight !== 'none') {
      const maxHeightValue = parseInt(optimized.maxHeight);
      optimized.maxHeight = `${Math.min(maxHeightValue, 300)}px`;
    }
  }
  
  return optimized;
}; 
