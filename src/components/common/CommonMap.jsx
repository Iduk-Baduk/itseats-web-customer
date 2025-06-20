import { Map, MapMarker } from "react-kakao-maps-sdk";

/*
 * lat: 위도
 * lng: 경도
 *
 * markers: 마커 배열 [{ lat, lng, label }] <- 여러개의 마커를 표시 할 수 있습니다.
 * height: 맵 높이 (기본값: "300px")
 * level: 맵 레벨 (기본값: 3)
 */
export default function CommonMap({ lat, lng, markers = [], height = "200px", level = 3 }) {
  return (
    <Map center={{ lat, lng }} style={{ width: "100%", height }} level={level}>
      {markers.map((marker, index) => (
        <MapMarker key={index} position={{ lat: marker.lat, lng: marker.lng }}>
          {marker.label && <div>{marker.label}</div>}
        </MapMarker>
      ))}
    </Map>
  );
}
