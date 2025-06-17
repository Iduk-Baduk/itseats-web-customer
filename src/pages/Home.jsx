import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchInput from "../components/common/SearchInput";
import MenuGrid from "../components/common/MenuGrid";
import styles from "./Home.module.css";
import StoreListItem from "../components/stores/StoreListItem";

function HomeHeader() {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <button
        className={styles.addressButton}
        aria-label="주소 관리"
        onClick={() => navigate("/address")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M12 21.325q-.35 0-.7-.125t-.625-.375Q9.05 19.325 7.8 17.9t-2.087-2.762t-1.275-2.575T4 10.2q0-3.75 2.413-5.975T12 2t5.588 2.225T20 10.2q0 1.125-.437 2.363t-1.275 2.575T16.2 17.9t-2.875 2.925q-.275.25-.625.375t-.7.125M12 12q.825 0 1.413-.587T14 10t-.587-1.412T12 8t-1.412.588T10 10t.588 1.413T12 12"
          />
        </svg>
        <span>집</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M15.88 9.29L12 13.17L8.12 9.29a.996.996 0 1 0-1.41 1.41l4.59 4.59c.39.39 1.02.39 1.41 0l4.59-4.59a.996.996 0 0 0 0-1.41c-.39-.38-1.03-.39-1.42 0"
          />
        </svg>
      </button>
    </header>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  return (
    <>
      <HomeHeader />
      <div className={styles.container}>
        <SearchInput
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          showIcon={true}
        />
        <MenuGrid />
        <div className={styles.bannerContainer}>
          <img src="/samples/banner.jpg" alt="배너 이미지" />
        </div>
      </div>
      <div className={styles.section}>
          <h2>골라먹는 맛집</h2>
          <StoreListItem
            store={{ name: "버거킹 구름점", review: 4.9, reviewCount: 1742 }}
            onClick={() => {
              navigate("/stores/1");
            }}
          />
          <StoreListItem
            store={{ name: "맘스터치 구름점", review: 4.8, reviewCount: 52 }}
            onClick={() => {
              navigate("/stores/1");
            }}
          />
          <StoreListItem
            store={{ name: "청년닭발 구름점", review: 3.1, reviewCount: 124 }}
            onClick={() => {
              navigate("/stores/2");
            }}
          />
          <StoreListItem
            store={{ name: "피자헛 구름점", review: 4.2, reviewCount: 172 }}
            onClick={() => {
              navigate("/stores/4");
            }}
          />
          <StoreListItem
            store={{ name: "청룡각 구름점", review: 4.9, reviewCount: 742 }}
            onClick={() => {
              navigate("/stores/5");
            }}
          />
        </div>
    </>
  );
}
