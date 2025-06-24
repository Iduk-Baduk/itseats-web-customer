export const getIconByLabel = (label) => {
  switch (label) {
    case "집":
      return "/icons/location/homeIcon.svg";
    case "회사":
      return "/icons/location/companyIcon.svg";
    case "수정":
      return "/icons/location/pencilIcon.svg";
    case "GPS":
      return "/icons/location/gpsIcon.svg";
    case "검색":
      return "/icons/location/searchIcon.svg";
    default:
      return "/icons/location/mapmarkerIcon.svg";
  }
};

// 카카오맵 API 로드 상태 확인
export const isKakaoMapLoaded = () => {
  return typeof window !== 'undefined' && window.kakao && window.kakao.maps;
};

// GPS 권한 확인
export const checkGPSPermission = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("이 브라우저에서는 위치 정보를 지원하지 않습니다."));
      return;
    }

    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      resolve(result.state);
    }).catch(() => {
      // permissions API를 지원하지 않는 경우
      resolve('prompt');
    });
  });
};

// 카카오맵 서비스 상태 확인
export const checkKakaoMapServices = () => {
  if (!isKakaoMapLoaded()) {
    return {
      geocoder: false,
      places: false,
      message: "카카오맵을 불러올 수 없습니다."
    };
  }

  const services = {
    geocoder: !!window.kakao.maps.services?.Geocoder,
    places: !!window.kakao.maps.services?.Places,
  };

  const missingServices = [];
  if (!services.geocoder) missingServices.push("주소 검색");
  if (!services.places) missingServices.push("장소 검색");

  return {
    ...services,
    message: missingServices.length > 0 
      ? `${missingServices.join(", ")} 서비스를 사용할 수 없습니다.`
      : null
  };
};

// 좌표로 주소 가져오기 (Promise 기반)
export const getAddressFromCoords = (lat, lng) => {
  return new Promise((resolve, reject) => {
    if (!window.kakao?.maps?.services?.Geocoder) {
      reject(new Error("카카오맵 서비스를 불러올 수 없습니다."));
      return;
    }

    const geocoder = new window.kakao.maps.services.Geocoder();
    const coord = new window.kakao.maps.LatLng(lat, lng);

    geocoder.coord2Address(coord.getLng(), coord.getLat(), (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const address = result[0].address.address_name;
        const roadAddress = result[0].road_address?.address_name || "";
        resolve({ address, roadAddress });
      } else {
        reject(new Error(`주소 검색에 실패했습니다: ${status}`));
      }
    });
  });
};

// 키워드로 장소 검색 (Promise 기반)
export const searchPlacesByKeyword = (keyword) => {
  return new Promise((resolve, reject) => {
    if (!window.kakao?.maps?.services?.Places) {
      reject(new Error("카카오맵 서비스를 불러올 수 없습니다."));
      return;
    }

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        resolve(data);
      } else {
        reject(new Error(`장소 검색에 실패했습니다: ${status}`));
      }
    });
  });
};

// 현재 위치 가져오기 (Promise 기반)
export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("이 브라우저에서는 위치 정보를 지원하지 않습니다."));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let errorMessage = "위치 정보를 가져올 수 없습니다.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "위치 정보 접근 권한이 거부되었습니다.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "위치 정보를 사용할 수 없습니다.";
            break;
          case error.TIMEOUT:
            errorMessage = "위치 정보 요청 시간이 초과되었습니다.";
            break;
        }
        reject(new Error(errorMessage));
      },
      { ...defaultOptions, ...options }
    );
  });
}; 
