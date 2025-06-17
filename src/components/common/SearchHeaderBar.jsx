import { s } from "motion/react-client";
import styles from "./SearchHeaderBar.module.css";
import SearchInput from "./SearchInput";

const BackIcon = ({className}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
    >
      <path 
        fill="currentColor"
        d="M20 11H7.83l5.59-5.59L12 4l-8 8l8 8l1.41-1.41L7.83 13H20z"/>
    </svg>
  );
}

const SearchIcon = ({className}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24"
      className={className}
    >
      <path 
        fill="currentColor"
        d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14"
      />
    </svg>
  );
}

export default function SearchHeaderBar({ keyword, onChange, onSearch, onBack }) {
  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={onBack}>
        <BackIcon className={styles.icon}/>
      </button>
      <SearchInput
        className={styles.searchInput}
        value={keyword}
        onChange={onChange}
      />
      <button className={styles.searchBtn} onClick={onSearch}>
        <SearchIcon className={styles.icon}/>
      </button>
    </div>
  );
}