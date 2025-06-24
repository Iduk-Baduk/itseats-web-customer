import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAddressRedux from "../../hooks/useAddressRedux";
import { getIconByLabel } from "../../utils/addressUtils";
import Header from "../../components/common/Header";
import styles from "./Address.module.css";

export default function Address() {
  const navigate = useNavigate();
  const { addresses, selectedAddressId, selectAddress } = useAddressRedux();
  const [keyword, setKeyword] = useState("");

  const handleSearch = () => {
    if (keyword.trim() === "") return;
    navigate(`/address/search?keyword=${encodeURIComponent(keyword)}`, { replace: true });
  };

  const handleAddressSelect = (addressId) => {
    selectAddress(addressId);
    // 주소 선택 후 홈 화면으로 이동
    navigate("/", { replace: true });
  };

  const hasHomeAddress = addresses.some((addr) => addr.label === "집");
  const hasCompanyAddress = addresses.some((addr) => addr.label === "회사");

  const sortedAddresses = [...addresses].sort((a, b) => {
    const order = { 집: 1, 회사: 2 };
    const aOrder = order[a.label] || 3;
    const bOrder = order[b.label] || 3;
    return aOrder - bOrder;
  });

  return (
    <div className={styles.container}>
      <Header
        title={"주소 관리"}
        leftIcon="close"
        rightIcon={null}
        leftButtonAction={() => {
          navigate(-1);
        }}
      />

      {/* 🔍 검색창 */}
      <div className={styles.searchBox}>
        <img
          src={getIconByLabel("검색")}
          alt="search-icon"
          className={styles.icon}
        />
        <input
          type="text"
          placeholder="도로명, 건물명 또는 지번으로 검색"
          className={styles.searchInput}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
      </div>

      {/* 📍 현재 위치 버튼 */}
      <button
        className={`${styles.locationBtn}`}
        onClick={() => {
          /* 현재 위치로 주소 찾는 기능 구현 필요 */
          navigate("/address/new?current=true", { replace: true });
        }}
      >
        <img
          src={getIconByLabel("GPS")}
          alt="gps-icon"
          className={styles.icon}
        />
        현재 위치로 주소 찾기
      </button>

      {/* 🏠 집/회사 추가 버튼 */}
      <div className={styles.addButtonsContainer}>
        {!hasHomeAddress && (
          <button
            className={styles.addAddressBtn}
            onClick={() => navigate("/address/search?add=home", { replace: true })}
          >
            <img src={getIconByLabel("집")} alt="home-icon" />집 추가
          </button>
        )}
        {!hasCompanyAddress && (
          <button
            className={styles.addAddressBtn}
            onClick={() => navigate("/address/search?add=company", { replace: true })}
          >
            <img src={getIconByLabel("회사")} alt="company-icon" />
            회사 추가
          </button>
        )}
      </div>

      {/* 📦 주소 리스트 */}
      <div className={styles.addressList}>
        {sortedAddresses.map((addr, index) => (
          <div key={addr.id}>
            <div
              className={`${styles.addressBox} ${
                selectedAddressId === addr.id ? styles.selected : ""
              }`}
              onClick={() => handleAddressSelect(addr.id)}
            >
              <div className={styles.addressHeader}>
                <div className={styles.iconWithContent}>
                  <img
                    src={getIconByLabel(addr.label)}
                    alt="type-icon"
                    className={styles.icon}
                  />
                  <div>
                    <div className={styles.label}>{addr.label}</div>
                    <div className={styles.address}>{addr.address}</div>
                    {addr.wowZone && (
                      <div>
                        <span className={styles.wow}>WOW</span>
                        <span className={styles.wowText}>
                          무료배달 가능 지역
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className={styles.editBtn}
                  onClick={(e) => {
                    e.stopPropagation(); // 부모 요소의 onClick 이벤트 방지
                    navigate(`/address/edit/${addr.id}`, { replace: true });
                  }}
                >
                  <img
                    src={getIconByLabel("수정")}
                    alt="edit-icon"
                    className={styles.icon}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
