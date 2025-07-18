import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../components/common/Header";
import styles from "./AddressCurrentLocation.module.css";

export default function AddressCurrentLocation() {
  const navigate = useNavigate();
  const location = useLocation();
  const addType = location.state?.addType || "home";

  // 카카오맵이 이미 App.jsx에서 전역적으로 로드되므로 별도 로더 불필요

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [addressInfo, setAddressInfo] = useState({
    address: "",
    roadAddress: "",
  });

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentPosition(pos);
        setSelectedPosition(pos);
        initializeMap(pos);
        setIsLoading(false);
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
        setError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  // 카카오맵 초기화
  const initializeMap = (position) => {
    // 카카오맵 API 로딩 대기 (App.jsx에서 전역 로딩 완료 후)
    const waitForKakao = (retries = 30) => {
      if (window.kakao?.maps?.services?.Geocoder) {
        setError(null);
        createMap(position);
      } else if (retries > 0) {
        setTimeout(() => waitForKakao(retries - 1), 200);
      } else {
        setError("카카오맵을 불러올 수 없습니다. 페이지를 새로고침해주세요.");
      }
    };

    waitForKakao();
  };

  // 실제 지도 생성 함수
  const createMap = (position) => {

    const mapContainer = mapRef.current;
    const mapOption = {
      center: new window.kakao.maps.LatLng(position.lat, position.lng),
      level: 3,
    };

    const map = new window.kakao.maps.Map(mapContainer, mapOption);
    mapInstanceRef.current = map;

    // 지도 이동 이벤트 (마커는 화면 중앙에 고정)
    const dragEndListener = () => {
      const center = map.getCenter();
      const newPosition = {
        lat: center.getLat(),
        lng: center.getLng(),
      };
      setSelectedPosition(newPosition);
      getAddressFromCoords(newPosition);
    };

    // 지도 줌 이벤트 (마커는 화면 중앙에 고정)
    const zoomChangedListener = () => {
      const center = map.getCenter();
      const newPosition = {
        lat: center.getLat(),
        lng: center.getLng(),
      };
      setSelectedPosition(newPosition);
      getAddressFromCoords(newPosition);
    };

    window.kakao.maps.event.addListener(map, "dragend", dragEndListener);
    window.kakao.maps.event.addListener(map, "zoom_changed", zoomChangedListener);

    // 리스너 정리를 위한 참조 저장
    mapInstanceRef.current.dragEndListener = dragEndListener;
    mapInstanceRef.current.zoomChangedListener = zoomChangedListener;

    // 초기 주소 정보 가져오기
    getAddressFromCoords(position);
  };

  // 좌표로 주소 가져오기
  const getAddressFromCoords = (position) => {
    if (!window.kakao?.maps?.services?.Geocoder) {
      setAddressInfo({
        address: "카카오맵 서비스를 불러올 수 없습니다.",
        roadAddress: "",
      });
      return;
    }

    const geocoder = new window.kakao.maps.services.Geocoder();
    const coord = new window.kakao.maps.LatLng(position.lat, position.lng);

    geocoder.coord2Address(coord.getLng(), coord.getLat(), (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const address = result[0].address.address_name;
        const roadAddress = result[0].road_address?.address_name || "";
        
        setAddressInfo({
          address,
          roadAddress,
        });
      } else {
        console.error('주소 검색에 실패했습니다:', status);
        setAddressInfo({
          address: "주소 정보를 가져올 수 없습니다.",
          roadAddress: "",
        });
      }
    });
  };

  // 현재 위치로 이동
  const moveToCurrentLocation = () => {
    if (currentPosition && mapInstanceRef.current) {
      const moveLatLon = new window.kakao.maps.LatLng(
        currentPosition.lat,
        currentPosition.lng
      );
      mapInstanceRef.current.panTo(moveLatLon);
      
      setSelectedPosition(currentPosition);
      getAddressFromCoords(currentPosition);
    }
  };

  // 주소 저장 - AddressNew 페이지로 이동
  const handleSaveAddress = () => {
    if (!selectedPosition) return;

    let label = "기타";
    if (addType === "home") label = "집";
    if (addType === "company") label = "회사";

    // AddressNew 페이지로 이동하면서 선택된 주소 정보 전달
    navigate("/address/new", {
      replace: true,
      state: {
        selectedAddress: {
          address: addressInfo.address,
          roadAddress: addressInfo.roadAddress,
          lat: selectedPosition.lat,
          lng: selectedPosition.lng,
        },
        label,
      },
    });
  };

  useEffect(() => {
    // 카카오맵이 전역적으로 로드된 후 현재 위치 가져오기
    const initializeWhenReady = () => {
      if (window.kakao?.maps?.services?.Geocoder) {
        getCurrentLocation();
      } else {
        // 카카오맵이 아직 로드되지 않았으면 잠시 후 재시도
        setTimeout(initializeWhenReady, 500);
      }
    };
    
    initializeWhenReady();
    
    return () => {
      if (mapInstanceRef.current) {
        // 이벤트 리스너 정리
        if (mapInstanceRef.current.dragEndListener) {
          window.kakao?.maps?.event?.removeListener(
            mapInstanceRef.current, 
            "dragend", 
            mapInstanceRef.current.dragEndListener
          );
        }
        if (mapInstanceRef.current.zoomChangedListener) {
          window.kakao?.maps?.event?.removeListener(
            mapInstanceRef.current, 
            "zoom_changed", 
            mapInstanceRef.current.zoomChangedListener
          );
        }
        mapInstanceRef.current = null;
      }
    };
  }, []); // 컴포넌트 마운트 시에만 실행

  return (
    <>
      <Header
        title="현재 위치로 주소 찾기"
        leftIcon="back"
        rightIcon={null}
        leftButtonAction={() => navigate(-1)}
      />
      
      <div className={styles.container}>
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}></div>
            <p>현재 위치를 확인 중입니다...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
            <button onClick={getCurrentLocation} className={styles.retryButton}>
              다시 시도
            </button>
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.mapWrapper}>
            <div 
              ref={mapRef} 
              className={styles.mapContainer}
              style={{ width: "100%", height: "400px" }}
            >
              <div className={styles.fixedMarker}></div>
            </div>
          </div>

          <button 
            className={styles.currentLocationButton}
            onClick={moveToCurrentLocation}
            disabled={!currentPosition}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5"
              />
            </svg>
          </button>
        </div>

        <div className={styles.addressInfo}>
          <div className={styles.addressText}>
            <h3>선택된 위치</h3>
            <p className={styles.primaryAddress}>{addressInfo.roadAddress || addressInfo.address}</p>
            {(addressInfo.roadAddress) && (
              <p className={styles.secondaryAddress}>{addressInfo.address}</p>
            )}
          </div>
          
          <div className={styles.instructions}>
            <p>지도를 움직여서 정확한 위치를 설정하세요</p>
          </div>
        </div>

        <button 
          className={styles.saveButton}
          onClick={handleSaveAddress}
          disabled={!selectedPosition || isLoading}
        >
          이 위치로 주소 저장
        </button>
      </div>
    </>
  );
} 
