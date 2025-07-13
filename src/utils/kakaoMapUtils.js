// 카카오맵 관련 유틸리티 함수들

import { isKakaoApiKeySet } from './kakaoApiKey';

/**
 * 카카오맵이 로드되었는지 확인
 */
export const isKakaoMapLoaded = () => {
  return !!(window.kakao && window.kakao.maps);
};

/**
 * 카카오맵 서비스가 사용 가능한지 확인
 */
export const isKakaoServicesAvailable = () => {
  return !!(window.kakao?.maps?.services);
};

/**
 * 카카오맵 로딩 상태를 확인하고 상세 정보를 반환
 */
export const getKakaoMapStatus = () => {
  const apiKeySet = isKakaoApiKeySet();
  const mapLoaded = isKakaoMapLoaded();
  const servicesAvailable = isKakaoServicesAvailable();
  
  return {
    apiKeySet,
    mapLoaded,
    servicesAvailable,
    ready: apiKeySet && mapLoaded && servicesAvailable,
    status: apiKeySet && mapLoaded && servicesAvailable ? 'ready' : 'loading'
  };
};

/**
 * 카카오맵 로딩을 기다리는 함수
 */
export const waitForKakaoMap = (timeout = 10000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkKakaoMap = () => {
      const status = getKakaoMapStatus();
      
      if (status.ready) {
        resolve(status);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error('카카오맵 로딩 시간 초과'));
        return;
      }
      
      setTimeout(checkKakaoMap, 100);
    };
    
    checkKakaoMap();
  });
};

/**
 * 카카오맵 에러 메시지를 사용자 친화적으로 변환
 */
export const getKakaoMapErrorMessage = (error) => {
  if (!isKakaoApiKeySet()) {
    return '카카오맵 API 키가 설정되지 않았습니다.';
  }
  
  if (error?.message) {
    if (error.message.includes('API_KEY')) {
      return '카카오맵 API 키가 유효하지 않습니다.';
    }
    if (error.message.includes('NETWORK')) {
      return '네트워크 연결을 확인해주세요.';
    }
    if (error.message.includes('TIMEOUT')) {
      return '카카오맵 로딩 시간이 초과되었습니다.';
    }
  }
  
  return '카카오맵을 불러오는 중 오류가 발생했습니다.';
};

/**
 * 카카오맵 디버그 정보를 콘솔에 출력 (개발 환경에서만)
 */
export const logKakaoMapDebugInfo = () => {
  if (!import.meta.env.DEV) return;
  
  const status = getKakaoMapStatus();
  console.group('🗺️ 카카오맵 디버그 정보');
  console.log('API 키 설정:', status.apiKeySet);
  console.log('맵 로드됨:', status.mapLoaded);
  console.log('서비스 사용 가능:', status.servicesAvailable);
  console.log('전체 상태:', status.status);
  console.log('API 키 (마스킹):', import.meta.env.VITE_APP_KAKAOMAP_KEY ? 
    `${import.meta.env.VITE_APP_KAKAOMAP_KEY.substring(0, 8)}...` : '없음');
  console.groupEnd();
}; 
