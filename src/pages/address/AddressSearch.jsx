// src/pages/AddressSearch.jsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import styles from "./AddressSearch.module.css";
import { 
  getIconByLabel, 
  ensureKakaoAPIReady, 
  searchPlacesByKeyword 
} from "../../utils/addressUtils";

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
    if (!keyword) {
      setResults([]);
      setError(null);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 카카오 API 준비 상태 확인 및 워밍업
        const isAPIReady = await ensureKakaoAPIReady();
        
        if (!isAPIReady) {
          throw new Error("주소 검색 서비스를 초기화할 수 없습니다. 잠시 후 다시 시도해주세요.");
        }

        // Promise 기반 검색 함수 사용
        const data = await searchPlacesByKeyword(keyword);
        setResults(data);
        setError(null);
        
      } catch (error) {
        console.error('주소 검색 오류:', error);
        setResults([]);
        
        // 에러 메시지 개선
        if (error.message.includes('초기화')) {
          setError("주소 검색 서비스를 준비 중입니다. 잠시 후 다시 시도해주세요.");
        } else if (error.message.includes('검색에 실패')) {
          setError("검색 결과를 찾을 수 없습니다. 다른 키워드로 검색해보세요.");
        } else {
          setError("검색 중 오류가 발생했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
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
