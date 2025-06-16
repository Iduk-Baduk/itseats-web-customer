import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Address.module.css";

const getIconByLabel = (label) => {
  switch (label) {
    case "집":
      return "../icons/location/homeIcon.svg";
    case "회사":
      return "../icons/location/companyIcon.svg";
    default:
      return "../icons/location/mapmarkerIcon.svg";
  }
};

const dummyAddresses = [
  {
    id: 1,
    label: "집",
    address: "경기 성남시 판교로 242\nPDC A동 902호",
    wowZone: true,
  },
  {
    id: 2,
    label: "네이버",
    address: "경기도 성남시 분당구 정자일로 95 2004호",
    wowZone: true,
  },
  {
    id: 3,
    label: "쿠팡",
    address: "서울특별시 송파구 송파대로 570 1703호",
    wowZone: true,
  },
];

export default function Address() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(1);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>주소관리</h1>

      <input
        type="text"
        placeholder="도로명, 건물명 또는 지번으로 검색"
        className={styles.searchInput}
      />

      <button
        className={`${styles.locationBtn} ${
          selectedId === 0 ? styles.selected : ""
        }`}
        onClick={() => setSelectedId(0)}
      >
        현재 위치로 주소 찾기
      </button>

      <div className={styles.addressList}>
        {dummyAddresses.map((addr, index) => (
          <div key={addr.id}>
            <div
              className={`${styles.addressBox} ${
                selectedId === addr.id ? styles.selected : ""
              }`}
              onClick={() => setSelectedId(addr.id)}
            >
              <div className={styles.addressHeader}>
                <div className={styles.iconWithContent}>
                  <img
                    src={getIconByLabel(addr.label)}
                    alt="address-type-icon"
                    className={styles.icon}
                  />
                  <div>
                    <div className={styles.label}>{addr.label}</div>
                    <div className={styles.address}>{addr.address}</div>
                    {addr.wowZone && (
                      <div>
                        <span className={styles.wow}>WOW</span>
                        <span className={styles.wowText}>
                          무료배송 가능 지역
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button className={styles.editBtn}>✏️</button>
              </div>
            </div>

            {/* 👇 첫 번째 주소 바로 뒤에 "회사 추가" 삽입 */}
            {index === 0 && <div className={styles.companyAdd}><img
                    src={getIconByLabel("회사")}
                    alt="address-type-icon"
                    className={styles.icon}
                  />회사 추가</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
