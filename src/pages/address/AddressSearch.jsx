// src/pages/AddressSearch.jsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "../../components/common/Header";
import styles from "./AddressSearch.module.css";

export default function AddressSearch() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("keyword");
  const navigate = useNavigate();

  const [results, setResults] = useState([]);

  // ✅ 검색어로 주소 리스트를 불러오는 가짜 fetch 함수 (실제론 API로 대체)
  useEffect(() => {
    if (keyword) {
      const dummyResults = [
        {
          id: Date.now(),
          address: `경기도 성남시 분당구 ${keyword}로 123`,
          label: "기타",
          wowZone: true,
        },
        {
          id: Date.now() + 1,
          address: `서울시 강남구 ${keyword}로 456`,
          label: "기타",
          wowZone: false,
        },
      ];
      setResults(dummyResults);
    }
  }, [keyword]);

  const handleSelect = (selectedAddress) => {
    // 👉 주소 데이터를 넘기면서 /address/new 로 이동
    navigate("/address/new", {
      state: {
        address: selectedAddress,
      },
      replace: true,
    });
  };

  return (
    <div className={styles.container}>
      <Header
        title={`"${keyword}" 주소 검색 결과`}
        leftIcon="back"
        rightIcon={null}
        leftButtonAction={() => {
          navigate(-1);
        }}
      />
      <ul className={styles.resultList}>
        {results.map((addr) => (
          <li
            key={addr.id}
            className={styles.item}
            onClick={() => handleSelect(addr)}
          >
            <div className={styles.addressText}>{addr.address}</div>
            {addr.wowZone && (
              <span className={styles.wow}>WOW 배달 가능 지역</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
