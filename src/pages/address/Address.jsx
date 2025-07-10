import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAddressRedux from "../../hooks/useAddressRedux";
import { getIconByLabel } from "../../utils/addressUtils";
import Header from "../../components/common/Header";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import styles from "./Address.module.css";

export default function Address() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addresses, selectedAddressId, selectAddress, isLoading, error, refreshAddresses } = useAddressRedux();
  const [keyword, setKeyword] = useState("");

  const handleSearch = () => {
    if (keyword.trim() === "") return;
    navigate(`/address/search?keyword=${encodeURIComponent(keyword)}`, { replace: true });
  };

  const handleAddressSelect = (addressId) => {
    selectAddress(addressId);
    // 주소 선택 후 카트에서 진입한 경우 카트로, 아니면 홈으로 이동
    if (location.state && location.state.from === 'cart') {
      navigate('/cart', { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  const hasHomeAddress = addresses.some((addr) => addr.label === "집");
  const hasCompanyAddress = addresses.some((addr) => addr.label === "회사");
  const hasTemporaryAddresses = addresses.some((addr) => addr.isTemporary);

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
          navigate("/address/current-location", { replace: true });
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

      {/* 임시 주소 알림 */}
      {hasTemporaryAddresses && (
        <div className={styles.temporaryNotice}>
          <p>⚠️ 일부 주소가 서버 연결 오류로 로컬에 임시 저장되었습니다.</p>
          <button onClick={refreshAddresses} className={styles.retryButton}>
            다시 시도
          </button>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
          <p>주소 목록을 불러오는 중...</p>
        </div>
      )}

      {/* 에러 상태 */}
      {error && !isLoading && (
        <div className={styles.errorContainer}>
          <p>주소 목록을 불러오는데 실패했습니다.</p>
          <button onClick={refreshAddresses} className={styles.retryButton}>
            다시 시도
          </button>
        </div>
      )}

      {/* 📦 주소 리스트 */}
      {!isLoading && !error && (
        <div className={styles.addressList}>
          {sortedAddresses.map((addr, index) => (
            <div key={addr.id}>
              <div
                className={`${styles.addressBox} ${
                  selectedAddressId === addr.id ? styles.selected : ""
                } ${addr.isTemporary ? styles.temporary : ""}`}
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
                      <div className={styles.label}>
                        {addr.label}
                        {addr.isTemporary && (
                          <span className={styles.temporaryBadge}>임시</span>
                        )}
                      </div>
                      <div className={styles.address}>{addr.address}</div>
                      {addr.isTemporary && (
                        <div className={styles.temporaryMessage}>
                          서버 연결 오류로 로컬에 저장됨
                        </div>
                      )}
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
      )}
    </div>
  );
}
