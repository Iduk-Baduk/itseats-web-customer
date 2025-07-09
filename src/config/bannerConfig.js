// 배너 설정 관리
export const bannerConfig = {
  // 홈 화면 배너 설정
  home: {
    // 동영상 배너 사용 여부
    useVideo: true,
    
    // 동영상 설정
    video: {
      src: "/samples/banner-video.mp4",
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
      enabled: false
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
  const config = bannerConfig[type];
  
  if (!config) {
    console.warn(`배너 설정을 찾을 수 없습니다: ${type}`);
    return null;
  }
  
  const { useVideo, video, image, onClick } = config;
  
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
            // 외부 링크 처리
            window.open(onClick.target, '_blank');
          }
          
          // 분석 이벤트 전송
          if (onClick.analytics) {
            console.log('Analytics event:', onClick.analytics);
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
