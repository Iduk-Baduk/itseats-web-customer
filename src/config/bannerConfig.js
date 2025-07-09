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
        onVideoClick: onClick.enabled ? () => {
          // 클릭 액션 처리
          if (onClick.action === 'navigate') {
            // 네비게이션 처리
            console.log(`배너 클릭: ${onClick.target}`);
          } else if (onClick.action === 'external') {
            // 외부 링크 처리 - 보안 및 사용자 경험 개선
            try {
              const url = new URL(onClick.target);
              // 새 탭에서 열기 (noopener, noreferrer로 보안 강화)
              const newWindow = window.open(url.href, '_blank', 'noopener,noreferrer');
              
              // 팝업 차단 확인
              if (!newWindow) {
                console.warn('팝업이 차단되었습니다. 현재 탭에서 열기로 폴백합니다.');
                window.location.href = onClick.target;
                return;
              }
              
              // 성공적으로 열렸는지 확인
              console.log(`외부 링크 열기 성공: ${url.href}`);
            } catch (error) {
              console.error('외부 링크 열기 실패:', error);
              // 폴백: 현재 탭에서 열기
              window.location.href = onClick.target;
            }
          }
          
          // 분석 이벤트 전송
          if (onClick.analytics) {
            console.log('Analytics event:', onClick.analytics);
            // 실제 분석 서비스 연동 시 여기에 코드 추가
          }
        } : undefined
      }
    };
  } else {
    return {
      component: 'OptimizedImage',
      props: {
        ...image,
        ...customProps,
        priority: true,
        className: 'bannerImage'
      }
    };
  }
}; 
