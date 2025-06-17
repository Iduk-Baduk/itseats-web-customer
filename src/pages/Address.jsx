import { useNavigate } from "react-router-dom";
import useAddressManager, { getIconByLabel } from "../hooks/useAddressManager";
import Header from "../components/common/Header";
import styles from "./Address.module.css";

export default function Address() {
  const navigate = useNavigate();
  const {
    addressList,
    selectedId,
    selectAddress,
    selectedAddress,
    keyword,
    setKeyword,
    handleSearch,
  } = useAddressManager();

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

      <button
        className={`${styles.locationBtn}`}
        onClick={() => selectAddress(0)}
      >
        <img
          src={getIconByLabel("GPS")}
          alt="gps-icon"
          className={styles.gpsIcon}
        />
        현재 위치로 주소 찾기
      </button>

      <div className={styles.addressList}>
        {addressList.map((addr, index) => (
          <div key={addr.id}>
            <div
              className={`${styles.addressBox} ${
                selectedId === addr.id ? styles.selected : ""
              }`}
              onClick={() => selectAddress(addr.id)}
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
                <button className={styles.editBtn}>
                  <img
                    src={getIconByLabel("수정")}
                    alt="edit-icon"
                    className={styles.icon}
                  />
                </button>
              </div>
            </div>

            {index === 0 && (
              <div
                className={styles.companyAdd}
                onClick={() => navigate("/address/company-add")}
                style={{ cursor: "pointer" }} // 커서 손모양 추가
              >
                <div className={styles.iconWithContent}>
                  <img
                    src={getIconByLabel("회사")}
                    alt="company-icon"
                    className={styles.icon}
                  />
                  <span className={styles.companyAddText}>회사 추가</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
