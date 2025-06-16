import React, { useState } from "react";
import SearchInput from "../components/common/SearchInput";
import styles from "./Search.module.css";

export default function Search() {
  // 최근 검색어
  const [recentKeywords, setRecentKeywords] = useState([
    {keyword: "삽겹살", date: "06.01"},
    {keyword: "햄버거", date: "05.31"},
  ]);

  const [keyword, setKeyword] = useState();

  // 최근 검색어 추가
  const handleAddKeyword = (text) => {
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

  // 최근 검색어 삭제
  const handleRemoveKeyword = (keyword) => {
    const filtered = recentKeywords.filter((item) => item.keyword !== keyword);
    setRecentKeywords(filtered);
  }
  
  return (
    // 상단 검색 바
    <div>
      <div className={styles.container}>
        <button className={styles.backBtn}>←</button>
        <SearchInput 
          className={styles.searchInput}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button 
          className={styles.searchBtn}
          onClick={() => handleAddKeyword(keyword)}>🔍
        </button>
      </div>

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
                    <span className={styles.clockIcon}>🕑</span>
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
