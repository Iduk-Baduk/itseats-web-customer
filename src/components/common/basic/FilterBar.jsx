import styles from "./FilterBar.module.css";

// 화살표 아이콘
const ArrowDownIcon = ({className}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24"
      className={className}
    >
      <path 
        fill="currentColor" 
        d="M16.59 8.59L12 13.17L7.41 8.59L6 10l6 6l6-6z"
      />
    </svg>
  );
}

// 필터 아이콘
const FilterIcon = ({className}) => {
  return (
    <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24"
    className={className}
    >
      <path 
        fill="currentColor" 
        d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45       1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0 0 18.95 4H5.04c-.83 0-1.3.95-.79 1.61"
      />
    </svg>
  );
}

export default function FilterBar() {
  return (
    <div className={styles.filterBar}>
      <button className={styles.sortBtn}>
        <ArrowDownIcon className={styles.icon}/>
          추천순
      </button>
    
      <button className={styles.filterBtn}>
        <FilterIcon className={styles.icon}/>
          필터
        </button>
      </div>
  );
}