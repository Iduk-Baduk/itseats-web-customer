// src/pages/AddressSearch.jsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import styles from "./AddressSearch.module.css";
import { getIconByLabel } from "../../utils/addressUtils";

export default function AddressSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const keyword = searchParams.get("keyword");
  const addType = searchParams.get("add"); // 'home' or 'company'

  const [inputValue, setInputValue] = useState(keyword || "");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!keyword || !window.kakao?.maps?.services?.Places) {
      setResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(keyword, (data, status) => {
        setIsLoading(false);
        if (status === window.kakao.maps.services.Status.OK) {
          setResults(data);
          setError(null);
        } else {
          console.warn('Kakao search failed:', status);
          setResults([]);
          setError("검색 결과를 찾을 수 없습니다. 다른 키워드로 검색해보세요.");
        }
      });
    } catch (error) {
      console.error('Kakao API error:', error);
      setIsLoading(false);
      setResults([]);
      setError("검색 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }, [keyword]);

  const handleSearch = () => {
    if (inputValue.trim() === "") return;
    setSearchParams({ keyword: inputValue, add: addType || "" });
  };

  const handleSelectAddress = (result) => {
    let label = "기타";
    if (addType === "home") label = "집";
    if (addType === "company") label = "회사";

    navigate("/address/new", {
      replace: true,
      state: {
        selectedAddress: {
          address: result.address_name,
          roadAddress: result.road_address_name,
          lat: parseFloat(result.y),
          lng: parseFloat(result.x),
        },
        label,
      },
    });
  };

  return (
    <div className={styles.container}>
      <Header
        title="주소 검색"
        leftIcon="back"
        rightIcon={null}
        leftButtonAction={() => navigate(-1)}
      />

      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <img
            src={getIconByLabel("검색")}
            alt="search-icon"
            className={styles.searchIcon}
          />
          <input
            type="text"
            placeholder="도로명, 건물명 또는 지번으로 검색"
            className={styles.searchInput}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <button className={styles.searchButton} onClick={handleSearch}>
            검색
          </button>
        </div>
      </div>

      {isLoading && (
        <div className={styles.loadingMessage}>
          <p>검색 중...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}

      <div className={styles.resultsContainer}>
        {results.map((result, index) => (
          <div
            key={index}
            className={styles.resultItem}
            onClick={() => handleSelectAddress(result)}
          >
            <div className={styles.resultContent}>
              <h3 className={styles.placeName}>{result.place_name}</h3>
              <p className={styles.address}>{result.address_name}</p>
              {result.road_address_name && (
                <p className={styles.roadAddress}>{result.road_address_name}</p>
              )}
            </div>
            <img
              src="/icons/location/mapmarkerIcon.svg"
              alt="location-icon"
              className={styles.locationIcon}
            />
          </div>
        ))}
      </div>

      {!isLoading && !error && results.length === 0 && keyword && (
        <div className={styles.noResults}>
          <p>검색 결과가 없습니다.</p>
          <p>다른 키워드로 검색해보세요.</p>
        </div>
      )}
    </div>
  );
}
