import React, { useState } from "react";
import styles from "./Search.module.css";
import SearchHeaderBar from "../components/common/SearchHeaderBar";
import { useNavigate } from "react-router-dom";

const watchIcon = (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24"
    height="24"
    viewBox="0 0 24 24"
  >
    <path 
      fill="currentColor" 
      d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m.5-13H11v6l5.2 3.2l.8-1.3l-4.5-2.7z"/>
  </svg>
);

export default function Search() {
  const navigate = useNavigate();

  // 최근 검색어
  const [recentKeywords, setRecentKeywords] = useState([
    {keyword: "삽겹살", date: "06.01"},
    {keyword: "햄버거", date: "05.31"},
  ]);

  const [keyword, setKeyword] = useState();

  // 최근 검색어 추가
  const handleAddKeyword = (text) => {
    console.log(text);
    if (text === undefined || text === "") {
      return;
    }

    const today = new Date();
    const date = `${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

    const newKeyword = { keyword: text, date: date };

    setRecentKeywords((prev) => {
      // 중복 제거
      const filtered = prev.filter((item) => item.keyword !== text);
      return [newKeyword, ...filtered];
    });
  };

  const handleSearch = () => {
    if (!keyword) {
      return;
    }
    // 키워드 저장
    handleAddKeyword(keyword);
    navigate(`/search-result?keyword=${encodeURIComponent(keyword)}`);
  }

  // 최근 검색어 삭제
  const handleRemoveKeyword = (keyword) => {
    const filtered = recentKeywords.filter((item) => item.keyword !== keyword);
    setRecentKeywords(filtered);
  }
  
  return (
    // 상단 검색창
    <div>
      <SearchHeaderBar
        keyword={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onSearch={() => handleSearch(keyword)}
        onBack={() => navigate(-1)}
      />
      
      {/* 인기 검색어 및 날짜 */}
      <div>
        <div className={styles.keywordHeader}>
          <span className={styles.title}>인기 검색어</span>
          <span className={styles.subTextRight}>오후 4:10 업데이트</span>
        </div>
      </div>

      <hr/>

      {/* 최근 검색어 */}
      <div>
        <div className={styles.keywordHeader}>
          <span className={styles.title}>최근 검색어</span>
          <button className={styles.subTextRight}>전체삭제</button>
        </div>
        
          <ul className={styles.recentList}>
            <ul className={styles.recentList}>
              {recentKeywords.map((item, index) => (
                <li key={index} className={styles.recentItem}>
                  <div className={styles.left}>
                    <span className={styles.clockIcon}>{watchIcon}</span>
                    <span>{item.keyword}</span>
                  </div>
                  <div className={styles.right}>
                    <span className={styles.date}>{item.date}</span>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => handleRemoveKeyword(item.keyword)}
                    >✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </ul>
        
      </div>
    </div>
  );
}
