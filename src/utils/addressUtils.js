export const getIconByLabel = (label) => {
  const iconMapping = {
    집: "/icons/location/homeIcon.svg",
    회사: "/icons/location/companyIcon.svg",
    기타: "/icons/location/mapmarkerIcon.svg",
    검색: "/icons/location/searchIcon.svg",
    GPS: "/icons/location/gpsIcon.svg",
    수정: "/icons/location/pencilIcon.svg",
    취소: "/icons/location/cancelIcon.svg",
  };
  return iconMapping[label] || "/icons/location/mapmarkerIcon.svg";
};

// 카카오맵 로딩 상태 확인
export const isKakaoMapLoaded = () => {
  return !!(window.kakao && window.kakao.maps);
};

// 카카오맵 API 키 확인
import { isKakaoApiKeySet } from './kakaoApiKey';

// GPS 권한 체크
export const checkGPSPermission = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ supported: false, permission: "denied" });
      return;
    }

    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        resolve({ supported: true, permission: result.state });
      })
      .catch(() => {
        resolve({ supported: true, permission: "unknown" });
      });
  });
};

// 카카오맵 서비스 상태 확인 (간단화)
export const checkKakaoMapServices = () => {
  const hasKakao = window.kakao && window.kakao.maps;
  const hasServices = hasKakao && window.kakao.maps.services;
  
  return {
    geocoder: !!(hasServices && window.kakao.maps.services.Geocoder),
    places: !!(hasServices && window.kakao.maps.services.Places),
    loaded: hasKakao
  };
};

// 카카오맵 API 키 확인
const checkApiKey = () => {
  const apiKey = import.meta.env.VITE_APP_KAKAOMAP_KEY;
  if (!apiKey) {
    console.warn('⚠️ 카카오맵 API 키가 설정되지 않았습니다.');
    return false;
  }
  return true;
};

// fallback 결과를 표준 형식으로 변환하는 헬퍼 함수
const transformFallbackResult = (addr) => ({
  place_name: addr.address_name.split(' ').slice(-2).join(' '),
  address_name: addr.address_name,
  road_address_name: addr.road_address_name,
  x: addr.x,
  y: addr.y,
  category_name: "주소",
  id: `fallback_${Date.now()}_${addr.x}_${addr.y}`
});

// Fallback 주소 검색 (목업 데이터)
const fallbackAddressSearch = (query) => {
  console.info('🔄 Fallback 주소 검색 사용 중:', query);
  
  const mockAddresses = [
    {
      address_name: "서울특별시 강남구 삼성동 159",
      road_address_name: "서울특별시 강남구 테헤란로 521",
      x: "127.0635735",
      y: "37.5080644"
    },
    {
      address_name: "서울특별시 종로구 종로1가 1",
      road_address_name: "서울특별시 종로구 종로 1",
      x: "126.9779451",
      y: "37.5700917"
    },
    {
      address_name: "서울특별시 마포구 상암동 1600",
      road_address_name: "서울특별시 마포구 월드컵북로 400",
      x: "126.8896035",
      y: "37.5791035"
    },
    {
      address_name: "부산광역시 해운대구 해운대동 1411-1",
      road_address_name: "부산광역시 해운대구 해운대해변로 264",
      x: "129.1603038",
      y: "35.1587014"
    },
    {
      address_name: "대구광역시 중구 동인동2가 146",
      road_address_name: "대구광역시 중구 중앙대로 390",
      x: "128.5973384",
      y: "35.8722133"
    }
  ];
  
  // 검색어와 유사한 주소 찾기
  const results = mockAddresses.filter(addr => 
    addr.address_name.toLowerCase().includes(query.toLowerCase()) ||
    addr.road_address_name.toLowerCase().includes(query.toLowerCase()) ||
    query.split(' ').some(word => 
      addr.address_name.toLowerCase().includes(word.toLowerCase())
    )
  );
  
  if (results.length === 0) {
    return mockAddresses.slice(0, 3);
  }
  
  return results;
};

// 간단한 카카오맵 API 준비 상태 확인
export const ensureKakaoAPIReady = async () => {
  // API 키가 없으면 fallback 모드
  if (!checkApiKey()) {
    return { success: true, usingFallback: true };
  }
  
  // 카카오맵 서비스 확인
  const services = checkKakaoMapServices();
  if (services.geocoder && services.places) {
    return { success: true, usingFallback: false };
  }
  
  // 카카오맵이 로드되지 않은 경우 fallback
  return { success: true, usingFallback: true };
};

// 좌표로 주소 변환 (카카오맵 API 또는 fallback)
export const getAddressFromCoords = async (lat, lng, useKakao = true) => {
  try {
    const apiStatus = await ensureKakaoAPIReady();
    
    // fallback 모드인 경우
    if (apiStatus.usingFallback || !useKakao) {
      return {
        address: `위도 ${lat.toFixed(6)}, 경도 ${lng.toFixed(6)}`,
        roadAddress: "주소 정보를 불러올 수 없습니다."
      };
    }
    
    // 카카오맵 API 사용
    const geocoder = new window.kakao.maps.services.Geocoder();
    const coord = new window.kakao.maps.LatLng(lat, lng);
    
    return new Promise((resolve) => {
      geocoder.coord2Address(coord.getLng(), coord.getLat(), (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const address = result[0].address.address_name;
          const roadAddress = result[0].road_address?.address_name || "";
          resolve({ address, roadAddress });
        } else {
          resolve({
            address: `위도 ${lat.toFixed(6)}, 경도 ${lng.toFixed(6)}`,
            roadAddress: "주소 정보를 불러올 수 없습니다."
          });
        }
      });
    });
    
  } catch (error) {
    return {
      address: `위도 ${lat.toFixed(6)}, 경도 ${lng.toFixed(6)}`,
      roadAddress: "주소 정보를 불러올 수 없습니다."
    };
  }
};

// 키워드로 장소 검색 (카카오맵 API 또는 fallback)
export const searchPlacesByKeyword = async (keyword, useKakao = true) => {
  try {
    const apiStatus = await ensureKakaoAPIReady();
    
    // fallback 모드인 경우
    if (apiStatus.usingFallback || !useKakao) {
      console.info('🔄 Fallback 장소 검색 사용 중:', keyword);
      return fallbackAddressSearch(keyword).map(transformFallbackResult);
    }
    
    // 카카오맵 API 사용
    return new Promise((resolve) => {
      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(keyword, (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          resolve(data);
        } else {
          console.warn('카카오 장소 검색 실패, fallback 사용');
          const fallbackResults = fallbackAddressSearch(keyword).map(transformFallbackResult);
          resolve(fallbackResults);
        }
      });
    });
    
  } catch (error) {
    console.warn('장소 검색 오류, fallback 사용:', error.message);
    return fallbackAddressSearch(keyword).map(transformFallbackResult);
  }
};

 
