import React from "react";
import SearchInput from "../components/common/SearchInput";
import styles from "./Search.module.css";

export default function Search() {
  return (
    <div className="search-page">
      <div className={styles.container}>
        <button className={styles.backBtn}>←</button>
        <SearchInput className={styles.searchInput} />
        <button className={styles.searchBtn}>🔍</button>
      </div>

      <div className="section popular">
        <div className="section-title">
          <span>인기 검색어</span>
          <span className="update-time">오후 4:10 업데이트</span>
        </div>
        <div className="popular-keywords">
          {/* 좌우 2열 */}
          <div className="column">
            <div>1. 메가커피</div>
            <div>2. 맥도날드</div>
            <div>3. 롯데리아</div>
            <div>4. 냉면</div>
            <div>5. 교촌치킨</div>
          </div>
          <div className="column">
            <div>6. 맘스터치</div>
            <div>7. 김밥</div>
            <div>8. 서브웨이</div>
            <div>9. 마라탕</div>
            <div>10. 햄버거</div>
          </div>
        </div>
      </div>

      <div className="section recent">
        <div className="section-title">
          <span>최근 검색어</span>
          <button className="clear-all">전체삭제</button>
        </div>
        <ul className="recent-list">
          <li>
            삼겹살 <span className="date">06.01</span> <button>✕</button>
          </li>
          <li>
            햄버거 <span className="date">05.31</span> <button>✕</button>
          </li>
        </ul>
      </div>

      <div className="bottom-nav">
        <button>홈</button>
        <button>검색</button>
        <button>즐겨찾기</button>
        <button>주문내역</button>
        <button>My 이츠</button>
      </div>
    </div>
  );
}
