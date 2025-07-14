// 카카오맵 API 키가 설정되어 있는지 확인하는 공통 함수
export const isKakaoApiKeySet = () => {
  return !!import.meta.env.VITE_APP_KAKAOMAP_KEY;
}; 
