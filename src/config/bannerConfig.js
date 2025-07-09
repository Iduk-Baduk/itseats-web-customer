// 배너 설정 관리
export const bannerConfig = {
  // 홈 화면 배너 설정
  home: {
    // 동영상 배너 사용 여부
    useVideo: true,
    
    // 동영상 설정
    video: {
      // 단일 src 사용 (기본값)
      src: "/samples/banner-video.mp4",
      // 또는 여러 포맷 지원을 위한 sources 배열 사용
      // sources: [
      //   { src: "/samples/banner-video.mp4", type: "video/mp4" },
      //   { src: "/samples/banner-video.webm", type: "video/webm" },
      //   { src: "/samples/banner-video.ogg", type: "video/ogg" }
      // ],
      poster: "/samples/banner.jpg",
      fallbackImage: "/samples/banner.jpg",
      autoPlay: true,
      loop: true,
      muted: true,
      controls: false,
      alt: "홈 페이지 배너 동영상",
      ariaLabel: "구름톤 DEEP DIVE로 이동 (새 탭에서 열림)",
      // 높이 설정
      height: "auto", // "auto", "200px", "300px" 등
      minHeight: "150px",
      maxHeight: "none", // "400px", "50vh" 등
      aspectRatio: "16/9" // "16/9", "4/3", "21/9" 등
    },
    
    // 이미지 배너 설정 (동영상이 지원되지 않을 때 사용)
    image: {
      src: "/samples/banner.jpg",
      alt: "홈 페이지 배너 이미지",
      width: 350,
      height: 200
    },
    
    // 클릭 액션 설정
    onClick: {
      enabled: true,
      action: "external", // "navigate", "modal", "external"
      target: "https://deepdive.goorm.io/", // 구름톤 DEEP DIVE 링크
      analytics: {
        event: "banner_click",
        category: "home_banner",
        label: "goorm_deepdive"
      }
    }
  },
  

};

// 높이 설정 예시
export const heightPresets = {
  // 고정 높이
  small: { height: "150px", minHeight: "120px", maxHeight: "180px" },
  medium: { height: "200px", minHeight: "180px", maxHeight: "250px" },
  large: { height: "300px", minHeight: "250px", maxHeight: "400px" },
  
  // 반응형 높이 (뷰포트 기준)
  viewportSmall: { height: "25vh", minHeight: "150px", maxHeight: "300px" },
  viewportMedium: { height: "40vh", minHeight: "200px", maxHeight: "500px" },
  viewportLarge: { height: "60vh", minHeight: "300px", maxHeight: "800px" },
  
  // 자동 높이 (비율 기준)
  autoWide: { height: "auto", aspectRatio: "21/9", minHeight: "150px" },
  autoStandard: { height: "auto", aspectRatio: "16/9", minHeight: "150px" },
  autoSquare: { height: "auto", aspectRatio: "1/1", minHeight: "200px" },
  autoPortrait: { height: "auto", aspectRatio: "4/5", minHeight: "250px" }
};

/**
 * 배너 클릭 핸들러 생성
 * @param {Object} onClick - 클릭 설정 객체
 * @returns {Function|undefined} 클릭 핸들러 함수 또는 undefined
 */
const handleBannerClick = (onClick) => {
  // 입력 유효성 검증
  if (!onClick || typeof onClick !== 'object') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('handleBannerClick: onClick 설정이 유효하지 않습니다');
    }
    return undefined;
  }
  
  if (!onClick.enabled) return undefined;
  
  // 필수 필드 검증
  if (!onClick.action || !onClick.target) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('handleBannerClick: action 또는 target이 누락되었습니다', onClick);
    }
    return undefined;
  }
  
  return () => {
    try {
      // 클릭 액션 처리
      if (onClick.action === 'navigate') {
        // 네비게이션 처리
        if (process.env.NODE_ENV === 'development') {
          console.log(`배너 클릭: ${onClick.target}`);
        }
        // TODO: 실제 네비게이션 로직 구현
      } else if (onClick.action === 'external') {
        // 외부 링크 처리
        handleExternalLink(onClick.target);
      } else if (process.env.NODE_ENV === 'development') {
        console.warn(`지원하지 않는 액션: ${onClick.action}`);
      }
      
      // 분석 이벤트 전송
      handleAnalytics(onClick.analytics);
    } catch (error) {
      console.error('배너 클릭 처리 중 오류 발생:', error);
    }
  };
};

/**
 * 외부 링크 처리
 * @param {string} target - 대상 URL
 */
const handleExternalLink = (target) => {
  try {
    const url = new URL(target);
    const newWindow = window.open(url.href, '_blank', 'noopener,noreferrer');
    
    if (!newWindow) {
      console.warn('팝업이 차단되었습니다. 현재 탭에서 열기로 폴백합니다.');
      window.location.href = target;
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`외부 링크 열기 성공: ${url.href}`);
    }
  } catch (error) {
    console.error('외부 링크 열기 실패:', error);
    window.location.href = target;
  }
};

/**
 * 분석 이벤트 처리
 * @param {Object} analytics - 분석 설정
 */
const handleAnalytics = (analytics) => {
  if (!analytics) return;
  
  try {
    if (window.gtag) {
      window.gtag('event', analytics.event, {
        event_category: analytics.category,
        event_label: analytics.label
      });
    } else if (process.env.NODE_ENV === 'development') {
      console.log('Analytics event:', analytics);
    }
  } catch (error) {
    console.error('분석 이벤트 전송 실패:', error);
  }
};

// 배너 타입별 컴포넌트 렌더링 함수
export const renderBanner = (type = 'home', customProps = {}) => {
  // 입력 유효성 검증
  if (typeof type !== 'string' || !type.trim()) {
    console.warn('배너 타입은 유효한 문자열이어야 합니다');
    return null;
  }
  
  if (typeof customProps !== 'object' || customProps === null) {
    console.warn('customProps는 객체여야 합니다');
    customProps = {};
  }
  
  const config = bannerConfig[type];
  
  if (!config) {
    console.warn(`배너 설정을 찾을 수 없습니다: ${type}`);
    return null;
  }
  
  const { useVideo, video, image, onClick } = config;
  
  // config 구조 유효성 검증
  if (typeof useVideo !== 'boolean') {
    console.warn(`배너 설정 '${type}'의 useVideo는 boolean 값이어야 합니다`);
    return null;
  }
  
  if (useVideo && (!video || typeof video !== 'object')) {
    console.warn(`배너 설정 '${type}'에서 useVideo가 true이지만 video 설정이 유효하지 않습니다`);
    return null;
  }
  
  if (!useVideo && (!image || typeof image !== 'object')) {
    console.warn(`배너 설정 '${type}'에서 useVideo가 false이지만 image 설정이 유효하지 않습니다`);
    return null;
  }
  
  if (useVideo) {
    return {
      component: 'VideoBanner',
      props: {
        ...video,
        ...customProps,
        onVideoClick: handleBannerClick(onClick)
      }
    };
  } else {
    return {
      component: 'OptimizedImage',
      props: {
        ...image,
        ...customProps,
        priority: true,
        className: 'bannerImage',
        onClick: handleBannerClick(onClick)
      }
    };
  }
}; 
