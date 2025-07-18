import React from "react";
import styles from "./OrderSearch.module.css";

const SearchIcon = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0s.41-1.08 0-1.49zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14"
      />
    </svg>
  );
};

export default function OrderSearch({ className, onClick }) {
  const [inputText, setInputText] = React.useState("");

  return (
    <div className={`${styles.searchContainer} ${className || ""}`}>
      <input
        className={styles.searchInput}
        type="text"
        placeholder="주문한 메뉴/매장을 찾아보세요"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onClick(inputText)}
      />
      <button className={styles.iconButton} onClick={() => onClick(inputText)}>
        <SearchIcon className={styles.icon} />
      </button>
    </div>
  );
}
