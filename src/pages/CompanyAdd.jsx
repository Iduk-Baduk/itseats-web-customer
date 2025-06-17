import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Address.module.css";
import useAddressManager, { getIconByLabel } from "../hooks/useAddressManager";

export default function CompanyAdd() {
  const navigate = useNavigate();
  const {
    addressList,
    selectedId,
    selectAddress,
    setAddressLabel, // ✅ 추가
    keyword,
    setKeyword,
    handleSearchKeyDown,
  } = useAddressManager();

  // ✅ 주소 클릭 시 label을 '회사'로 바꾸고 이동
  const handleCompanySelect = (addrId) => {
    setAddressLabel(addrId, "회사");
    selectAddress(addrId);
    navigate("/address");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>회사 주소 선택</h1>

      {/* 🔍 검색창 */}
      <div className={styles.searchBox}>
        <img
          src={getIconByLabel("검색")}
          alt="search-icon"
          className={styles.icon}
        />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="도로명, 건물명 또는 지번으로 검색"
          className={styles.searchInput}
        />
      </div>

      {/* 📦 주소 리스트 */}
      <div className={styles.addressList}>
        {addressList.map((addr) => (
          <div
            key={addr.id}
            className={`${styles.addressBox} ${
              selectedId === addr.id ? styles.selected : ""
            }`}
            onClick={() => handleCompanySelect(addr.id)} // ✅ 여기 연결
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
                      <span className={styles.wowText}>무료배송 가능 지역</span>
                    </div>
                  )}
                </div>
              </div>
              <button className={styles.editBtn}>
                <img
                  src={getIconByLabel("수정")}
                  alt="edit-icon"
                  className={styles.icon}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
