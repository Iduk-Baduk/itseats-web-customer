import React, { useState } from "react";
import styles from "../pages/Address.module.css";

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

const AddressManager = () => {
  const [selectedId, setSelectedId] = useState(1);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>주소관리</h1>

      <input
        type="text"
        placeholder="도로명, 건물명 또는 지번으로 검색"
        className={styles.searchInput}
      />

      <button className={styles.locationBtn}>현재 위치로 주소 찾기</button>

      <div className={styles.addressList}>
        {dummyAddresses.map((addr) => (
          <div
            key={addr.id}
            className={`${styles.addressBox} ${selectedId === addr.id ? styles.selected : ""}`}
            onClick={() => setSelectedId(addr.id)}
          >
            <div className={styles.addressHeader}>
              <div>
                <div className={styles.label}>{addr.label}</div>
                <div className={styles.address}>{addr.address}</div>
                {addr.wowZone && <div className={styles.wow}>WOW 무료배송 가능 지역</div>}
              </div>
              <button className={styles.editBtn}>✏️</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.companyAdd}>회사 추가</div>
    </div>
  );
};

export default AddressManager;
