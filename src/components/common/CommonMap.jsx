import { Map as KakaoMap, MapMarker, Polyline, useKakaoLoader } from "react-kakao-maps-sdk";

/*
 * lat: 위도
 * lng: 경도
 *
 * markers: 마커 배열 [{ lat, lng, label }] <- 여러개의 마커를 표시 할 수 있습니다.
 * height: 맵 높이 (기본값: "300px")
 * level: 맵 레벨 (기본값: 3)
 *  target: "store" | "user" | null
 */
export default function CommonMap({ lat, lng, markers = [], height = "300px", level = 3 }) {
  // API 키 확인 및 디버깅
  const apiKey = import.meta.env.VITE_APP_KAKAOMAP_KEY;
  
  // 개발 환경에서만 디버깅 로그 출력
  if (import.meta.env.DEV) {
    console.log('카카오맵 환경변수 디버깅:', {
      apiKey: apiKey ? `설정됨 (${apiKey.substring(0, 8)}...)` : '미설정',
      fullApiKey: apiKey, // 전체 키도 출력하여 확인
      nodeEnv: import.meta.env.NODE_ENV,
      mode: import.meta.env.MODE,
      allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
    });
  }
  
  if (!apiKey) {
    console.error('카카오맵 API 키가 설정되지 않았습니다. .env 파일에 VITE_APP_KAKAOMAP_KEY를 설정해주세요.');
    return (
      <div style={{ width: "100%", height, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" }}>
        <p>지도 설정이 필요합니다.</p>
      </div>
    );
  }

  // 카카오 맵 SDK 로더 사용
  const [loading, error] = useKakaoLoader({
    appkey: apiKey,
    libraries: ["services", "clusterer"],
  });

  // 로딩 중이면 로딩 표시
  if (loading) {
    return (
      <div style={{ width: "100%", height, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" }}>
        <p>지도를 불러오는 중입니다...</p>
      </div>
    );
  }

  // 에러가 발생하면 에러 표시
  if (error) {
    console.error('카카오 맵 로드 오류:', error);
    return (
      <div style={{ width: "100%", height, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" }}>
        <p>지도를 불러오는 데 실패했습니다.</p>
      </div>
    );
  }

  // 좌표 유효성 검사
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return (
      <div style={{ width: "100%", height, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" }}>
        <p>위치 정보를 확인할 수 없습니다.</p>
      </div>
    );
  }

  try {
    return (
      <KakaoMap center={{ lat, lng }} style={{ width: "100%", height }} level={level}>
        {markers.map((marker, index) => {
        const markerImageSrc =
          marker.type === "store"
            ? storeSvgDataUrl
            : marker.type === "user"
            ? userSvgDataUrl
            : null;

        return (
          <MapMarker
            key={index}
            position={{ lat: marker.lat, lng: marker.lng }}
            image={
              markerImageSrc
                ? {
                    src: markerImageSrc,
                    size: { width: 32, height: 36 },
                    options: {
                      offset: {
                        x: 16,
                        y: 36,
                      },
                    },
                  }
                : undefined
            }
          />
        );
      })}

      {markers.length >= 2 && (
        <Polyline
          path={markers.map(({ lat, lng }) => ({ lat, lng }))}
          strokeWeight={2.5}
          strokeColor="#000000"
          strokeOpacity={0.8}
          strokeStyle="dash"
        />
        )}
      </KakaoMap>
    );
  } catch (error) {
    console.error('카카오맵 렌더링 오류:', error);
    return (
      <div style={{ width: "100%", height, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" }}>
        <p>지도를 불러오는 데 문제가 발생했습니다.</p>
      </div>
    );
  }
}

// 마커 아이콘
const storeSvg = `
    <svg width="32" height="36" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 1C24.2843 1 31 7.71573 31 16C31 23.2641 25.8363 29.3212 18.9795 30.7031L16.5 35L14.123 30.8828C6.72471 29.9592 1 23.6486 1 16C1 7.71573 7.71573 1 16 1Z"
        fill="#01AFFF"
      />
      <path
        d="M16 1V0.7V1ZM31 16H31.3H31ZM18.9795 30.7031L18.9202 30.409C18.8358 30.4261 18.7627 30.4786 18.7197 30.5532L18.9795 30.7031ZM16.5 35L16.2402 35.15C16.2938 35.2428 16.3928 35.3 16.5 35.3C16.6072 35.3 16.7063 35.2428 16.7598 35.1499L16.5 35ZM14.123 30.8828L14.3829 30.7328C14.3359 30.6514 14.2535 30.5968 14.1602 30.5851L14.123 30.8828ZM1 16H0.7H1ZM16 1V1.3C24.1186 1.3 30.7 7.88141 30.7 16H31H31.3C31.3 7.55004 24.45 0.7 16 0.7V1ZM31 16H30.7C30.7 23.1184 25.6398 29.0548 18.9202 30.409L18.9795 30.7031L19.0388 30.9972C26.0328 29.5876 31.3 23.4097 31.3 16H31ZM18.9795 30.7031L18.7197 30.5532L16.2402 34.8501L16.5 35L16.7598 35.1499L19.2393 30.8531L18.9795 30.7031ZM16.5 35L16.7598 34.85L14.3829 30.7328L14.123 30.8828L13.8632 31.0328L16.2402 35.15L16.5 35ZM14.123 30.8828L14.1602 30.5851C6.91012 29.68 1.3 23.4953 1.3 16H1H0.7C0.7 23.8018 6.5393 30.2384 14.0859 31.1805L14.123 30.8828ZM1 16H1.3C1.3 7.88141 7.88141 1.3 16 1.3V1V0.7C7.55004 0.7 0.7 7.55004 0.7 16H1Z"
        fill="white"
      />
      <path
        d="M9 9V11C9 11.7956 9.31607 12.5587 9.87868 13.1213C10.4413 13.6839 11.2044 14 12 14M12 14V9M12 14V25M12 14C12.7956 14 13.5587 13.6839 14.1213 13.1213C14.6839 12.5587 15 11.7956 15 11V9M20 17V9C23 11 23 13 23 17H20ZM20 17V25"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>`;

const userMarker = `
  <svg width="32" height="36" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 1C24.2843 1 31 7.71573 31 16C31 23.2641 25.8363 29.3212 18.9795 30.7031L16.5 35L14.123 30.8828C6.72471 29.9592 1 23.6486 1 16C1 7.71573 7.71573 1 16 1Z"
      fill="#212B36"
    />
    <path
      d="M16 1V0.7V1ZM31 16H31.3H31ZM18.9795 30.7031L18.9202 30.409C18.8358 30.4261 18.7627 30.4786 18.7197 30.5532L18.9795 30.7031ZM16.5 35L16.2402 35.15C16.2938 35.2428 16.3928 35.3 16.5 35.3C16.6072 35.3 16.7063 35.2428 16.7598 35.1499L16.5 35ZM14.123 30.8828L14.3829 30.7328C14.3359 30.6514 14.2535 30.5968 14.1602 30.5851L14.123 30.8828ZM1 16H0.7H1ZM16 1V1.3C24.1186 1.3 30.7 7.88141 30.7 16H31H31.3C31.3 7.55004 24.45 0.7 16 0.7V1ZM31 16H30.7C30.7 23.1184 25.6398 29.0548 18.9202 30.409L18.9795 30.7031L19.0388 30.9972C26.0328 29.5876 31.3 23.4097 31.3 16H31ZM18.9795 30.7031L18.7197 30.5532L16.2402 34.8501L16.5 35L16.7598 35.1499L19.2393 30.8531L18.9795 30.7031ZM16.5 35L16.7598 34.85L14.3829 30.7328L14.123 30.8828L13.8632 31.0328L16.2402 35.15L16.5 35ZM14.123 30.8828L14.1602 30.5851C6.91012 29.68 1.3 23.4953 1.3 16H1H0.7C0.7 23.8018 6.5393 30.2384 14.0859 31.1805L14.123 30.8828ZM1 16H1.3C1.3 7.88141 7.88141 1.3 16 1.3V1V0.7C7.55004 0.7 0.7 7.55004 0.7 16H1Z"
      fill="white"
    />
    <path
      d="M22 23V21.75C22 19.679 20.081 18 17.714 18H14.286C11.919 18 10 19.679 10 21.75V23M19 12C19 12.7956 18.6839 13.5587 18.1213 14.1213C17.5587 14.6839 16.7956 15 16 15C15.2044 15 14.4413 14.6839 13.8787 14.1213C13.3161 13.5587 13 12.7956 13 12C13 11.2044 13.3161 10.4413 13.8787 9.87868C14.4413 9.31607 15.2044 9 16 9C16.7956 9 17.5587 9.31607 18.1213 9.87868C18.6839 10.4413 19 11.2044 19 12Z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>`;

const storeSvgDataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(storeSvg)}`;
const userSvgDataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(userMarker)}`;
