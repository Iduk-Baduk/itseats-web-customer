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

  useEffect(() => {
    if (!keyword || !window.kakao?.maps?.services?.Places) {
      setResults([]);
      return;
    }

    try {
      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(keyword, (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setResults(data);
        } else {
          console.warn('Kakao search failed:', status);
          setResults([]);
        }
      });
    } catch (error) {
      console.error('Kakao API error:', error);
      setResults([]);
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
    <>
      <Header
        title={"주소 검색"}
        leftIcon="back"
        leftButtonAction={() => navigate(-1)}
      />
      <div className={styles.container}>
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
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
        </div>

        <ul className={styles.resultList}>
          {results.length > 0 ? (
            results.map((result) => (
              <li
                key={result.id}
                className={styles.resultItem}
                onClick={() => handleSelectAddress(result)}
              >
                <div className={styles.addressName}>{result.address_name}</div>
                {result.road_address_name && (
                  <div className={styles.roadAddressContainer}>
                    <span className={styles.roadAddressLabel}>도로명</span>
                    <span className={styles.roadAddressName}>
                      {result.road_address_name}
                    </span>
                  </div>
                )}
              </li>
            ))
          ) : (
            keyword && <div className={styles.noResults}>검색 결과가 없습니다.</div>
          )}
        </ul>
      </div>
    </>
  );
}
