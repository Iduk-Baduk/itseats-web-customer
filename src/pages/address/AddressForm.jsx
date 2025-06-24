import React, { useState, useEffect, useRef } from "react";
import { getIconByLabel } from "../../utils/addressUtils";
import styles from "./AddressEdit.module.css";

export default function AddressForm({
  address,
  currentLabel,
  detailAddress,
  guideMessage,
  onChangeDetail,
  onChangeGuide,
  onChangeLabel,
  onSubmit,
  onAddressChange,
  customLabel,
  onChangeCustomLabel,
}) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  const [currentAddress, setCurrentAddress] = useState(address);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  // 좌표로 주소 정보 가져오기
  const getAddressFromCoords = (position) => {
    if (!window.kakao?.maps?.services?.Geocoder) {
      return;
    }

    const geocoder = new window.kakao.maps.services.Geocoder();
    const coord = new window.kakao.maps.LatLng(position.lat, position.lng);

    geocoder.coord2Address(coord.getLng(), coord.getLat(), (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const address = result[0].address.address_name;
        const roadAddress = result[0].road_address?.address_name || "";
        
        const newAddress = {
          ...currentAddress,
          address,
          roadAddress,
          lat: position.lat,
          lng: position.lng,
        };
        
        setCurrentAddress(newAddress);
        if (onAddressChange) {
          onAddressChange(newAddress);
        }
      }
    });
  };

  // 카카오맵 초기화
  const initializeMap = () => {
    if (!window.kakao?.maps || isMapInitialized) return;

    const mapContainer = mapRef.current;
    const mapOption = {
      center: new window.kakao.maps.LatLng(address.lat || 37.5665, address.lng || 126.978),
      level: 3,
    };

    const map = new window.kakao.maps.Map(mapContainer, mapOption);
    mapInstanceRef.current = map;

    // 지도 이동 이벤트 (마커는 화면 중앙에 고정)
    window.kakao.maps.event.addListener(map, "dragend", () => {
      const center = map.getCenter();
      const newPosition = {
        lat: center.getLat(),
        lng: center.getLng(),
      };
      getAddressFromCoords(newPosition);
    });

    // 지도 줌 이벤트 (마커는 화면 중앙에 고정)
    window.kakao.maps.event.addListener(map, "zoom_changed", () => {
      const center = map.getCenter();
      const newPosition = {
        lat: center.getLat(),
        lng: center.getLng(),
      };
      getAddressFromCoords(newPosition);
    });

    setIsMapInitialized(true);
  };

  useEffect(() => {
    initializeMap();
  }, []);

  // 핀 조정 버튼 클릭 시 지도 중앙으로 이동
  const handlePinAdjust = () => {
    if (mapInstanceRef.current && markerRef.current) {
      const markerPosition = markerRef.current.getPosition();
      mapInstanceRef.current.panTo(markerPosition);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.mapContainer}>
        <div ref={mapRef} className={styles.map}></div>
        <button className={styles.pinButton} onClick={handlePinAdjust}>
          핀 조정하기
        </button>
      </div>
      
      {currentAddress && (
        <div className={styles.iconWithContent}>
          <img
            src={"/icons/location/mapmarkerIcon.svg"}
            alt="address-icon"
            className={styles.labelIcon}
          />
          <div className={styles.addressTextGroup}>
            <p className={styles.primaryAddress}>{currentAddress.address}</p>
            <p className={styles.secondaryAddress}>{currentAddress.roadAddress}</p>
            {currentAddress.wowZone && (
              <div className={styles.wowArea}>
                <span className={styles.wow}>WOW</span>
                <span className={styles.wowText}>무료배달 가능 지역</span>
              </div>
            )}
          </div>
        </div>
      )}

      <input
        className={styles.detailInput}
        value={detailAddress}
        onChange={onChangeDetail}
        placeholder="상세주소 (아파트/동/호)"
      />

      <input
        className={styles.detailInput}
        value={guideMessage}
        onChange={onChangeGuide}
        placeholder="길 안내 (예: 1층에 올리브영이 있는 오피스텔)"
      />

      <div className={styles.labelButtonGroup}>
        {["집", "회사", "기타"].map((label) => (
          <button 
            key={label}
            className={`${styles.labelButton} ${
              currentLabel === label ? styles.selected : ""
            }`}
            onClick={() => onChangeLabel(label)}
          >
            <img
              src={getIconByLabel(label)}
              alt={`${label}-icon`}
              className={styles.labelIcon}
            />
            {label}
          </button>
        ))}
      </div>

      {/* 기타 라벨 선택 시 별칭 설정 입력창 */}
      {currentLabel === "기타" && (
        <input
          className={styles.detailInput}
          value={customLabel || ""}
          onChange={onChangeCustomLabel}
          placeholder="별칭 설정 (예: 학교, 친구집)"
        />
      )}

      <button className={styles.submitButton} onClick={onSubmit}>
        완료
      </button>
    </div>
  );
}
