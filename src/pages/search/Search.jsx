import React, { useState } from "react";
import styles from "../search/Search.module.css";
import SearchHeaderBar from "../../components/common/SearchHeaderBar";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { addKeyword, removeKeyword, clearKeywords } from "../../store/searchSlice";

const watchIcon = (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20"
    height="20"
    viewBox="0 0 24 24"
  >
    <path 
      fill="currentColor"
      d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m.5-13H11v6l5.2 3.2l.8-1.3l-4.5-2.7z"/>
  </svg>
);

export default function Search() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 최근 검색어
  const recentKeywords = useSelector(state => state.search?.keywords || []);

  const [keyword, setKeyword] = useState("");

  const handleSearch = (text) => {
    if (!text || text === "") {
      return;
    }
    navigate(`/search-result?keyword=${encodeURIComponent(text)}`);
  }

  // 최근 검색어 삭제
  const handleRemoveKeyword = (keyword) => {
    dispatch(removeKeyword(keyword));
  }

  // 최근 검색어 전체 삭제
  const handleClearKeyword = () => {
    dispatch(clearKeywords());
  }

  // 최근 검색어 눌렀을때
  const handleClickRecentKeyword = (text) => {
    setKeyword(text);
    handleSearch(text);
  };
  
  return (
    <div>
      {/* 상단 검색창 */}
      <SearchHeaderBar
        keyword={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onSearch={() => handleSearch(keyword)}
        onBack={() => navigate("/")}
      />
      
      {/* 인기 검색어 및 날짜 */}
      <div>
        <div className={styles.keywordHeader}>
          <span className={styles.title}>인기 검색어</span>
          <span className={styles.subTextRight}>오후 4:10 업데이트</span>
        </div>
        <div style={{ height: "160px" }}></div>
      </div>

      <hr className={styles.separator}/>

      {/* 최근 검색어 */}
      <div>
        <div className={styles.keywordHeader}>
          <span className={styles.title}>최근 검색어</span>
          <button className={styles.subTextRight} onClick={handleClearKeyword}>전체삭제</button>
        </div>
          <ul className={styles.recentList}>
            <ul className={styles.recentList}>
              {recentKeywords && recentKeywords.map((item, index) => (
                <li key={index} className={styles.recentItem} onClick={() => handleClickRecentKeyword(item.keyword)}>
                  <div className={styles.left}>
                    <span className={styles.clockIcon}>{watchIcon}</span>
                    <span>{item.keyword}</span>
                  </div>
                  <div className={styles.right}>
                    <span className={styles.date}>{item.date}</span>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveKeyword(item.keyword)
                      }}
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
