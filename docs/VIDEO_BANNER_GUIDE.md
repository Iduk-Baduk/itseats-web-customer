# 동영상 배너 사용 가이드

## 개요

ITSeats 웹 애플리케이션에서 동영상 배너를 사용하는 방법을 설명합니다.

## 기본 사용법

### 1. 간단한 동영상 배너

```jsx
import VideoBanner from '../components/common/VideoBanner';

<VideoBanner
  src="/samples/banner-video.mp4"
  poster="/samples/banner.jpg"
  alt="배너 동영상"
/>
```

### 2. 높이 설정이 포함된 동영상 배너

```jsx
<VideoBanner
  src="/samples/banner-video.mp4"
  poster="/samples/banner.jpg"
  alt="배너 동영상"
  height="300px"
  minHeight="200px"
  maxHeight="500px"
  aspectRatio="16/9"
/>
```

## 높이 설정 옵션

### 고정 높이
```jsx
// 픽셀 단위
height="200px"
height="300px"

// 뷰포트 단위
height="50vh"
height="25vw"
```

### 자동 높이 (비율 기반)
```jsx
height="auto"
aspectRatio="16/9"  // 16:9 비율
aspectRatio="4/3"   // 4:3 비율
aspectRatio="21/9"  // 21:9 비율 (울트라와이드)
aspectRatio="1/1"   // 정사각형
```

### 최소/최대 높이 제한
```jsx
minHeight="150px"
maxHeight="400px"
```

## 프리셋 사용법

### 1. 기본 프리셋

```jsx
import { heightPresets } from '../config/bannerConfig';

// 작은 크기
<VideoBanner {...heightPresets.small} />

// 중간 크기
<VideoBanner {...heightPresets.medium} />

// 큰 크기
<VideoBanner {...heightPresets.large} />
```

### 2. 뷰포트 기반 프리셋

```jsx
// 뷰포트 높이의 25%
<VideoBanner {...heightPresets.viewportSmall} />

// 뷰포트 높이의 40%
<VideoBanner {...heightPresets.viewportMedium} />

// 뷰포트 높이의 60%
<VideoBanner {...heightPresets.viewportLarge} />
```

### 3. 비율 기반 프리셋

```jsx
// 와이드 스크린 (21:9)
<VideoBanner {...heightPresets.autoWide} />

// 표준 스크린 (16:9)
<VideoBanner {...heightPresets.autoStandard} />

// 정사각형 (1:1)
<VideoBanner {...heightPresets.autoSquare} />

// 세로형 (4:5)
<VideoBanner {...heightPresets.autoPortrait} />
```

## 설정 파일을 통한 관리

### bannerConfig.js 수정

```javascript
// src/config/bannerConfig.js
export const bannerConfig = {
  home: {
    useVideo: true,
    video: {
      src: "/samples/banner-video.mp4",
      poster: "/samples/banner.jpg",
      // 높이 설정
      height: "auto",
      minHeight: "150px",
      maxHeight: "none",
      aspectRatio: "16/9"
    }
  }
};
```

### 다양한 높이 설정 예시

```javascript
// 컴팩트한 배너
video: {
  height: "150px",
  minHeight: "120px",
  maxHeight: "180px"
}

// 반응형 배너
video: {
  height: "40vh",
  minHeight: "200px",
  maxHeight: "500px"
}

// 풀스크린 배너
video: {
  height: "100vh",
  minHeight: "400px",
  maxHeight: "100vh"
}
```

## 유틸리티 함수 사용

### 동적 높이 계산

```jsx
import { calculateViewportHeight, getResponsiveHeight } from '../utils/bannerUtils';

// 뷰포트 높이의 30%로 설정
const dynamicHeight = calculateViewportHeight(30, 150, 500);

// 반응형 높이 설정
const responsiveHeight = getResponsiveHeight({
  mobile: { height: "180px" },
  tablet: { height: "250px" },
  desktop: { height: "350px" }
});
```

### 커스텀 프리셋 생성

```jsx
import { createHeightPreset } from '../utils/bannerUtils';

const customPreset = createHeightPreset('standard', {
  height: "280px",
  maxHeight: "450px"
});
```

## 성능 최적화

### 모바일 최적화

```jsx
import { optimizeBannerHeight } from '../utils/bannerUtils';

const isMobile = window.innerWidth < 768;
const optimizedHeight = optimizeBannerHeight(heightConfig, isMobile);
```

### 지연 로딩

```jsx
<VideoBanner
  src="/samples/banner-video.mp4"
  poster="/samples/banner.jpg"
  loading="lazy"  // 지연 로딩
  preload="metadata"  // 메타데이터만 미리 로드
/>
```

## 접근성 고려사항

### 대체 콘텐츠 제공

```jsx
<VideoBanner
  src="/samples/banner-video.mp4"
  poster="/samples/banner.jpg"
  fallbackImage="/samples/banner-fallback.jpg"
  alt="배너 동영상 - 맛있는 음식 소개"
/>
```

### 키보드 네비게이션

```jsx
<VideoBanner
  src="/samples/banner-video.mp4"
  onVideoClick={() => navigate('/events')}
  tabIndex={0}
  role="button"
  aria-label="이벤트 페이지로 이동"
/>
```

## 브라우저 호환성

### 지원되는 비디오 포맷
- MP4 (H.264) - 주요 포맷

### 대체 이미지 제공
동영상이 지원되지 않는 브라우저에서는 자동으로 대체 이미지가 표시됩니다. 브라우저의 기본 fallback 메커니즘을 활용합니다.

## 문제 해결

### 동영상이 재생되지 않는 경우
1. 파일 경로 확인
2. 비디오 포맷 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 높이가 적용되지 않는 경우
1. CSS 우선순위 확인
2. 부모 요소의 높이 설정 확인
3. `object-fit: cover` 속성 확인

### 성능 이슈
1. 비디오 파일 크기 최적화
2. 모바일에서는 높이 제한
3. 지연 로딩 사용 
