import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./MenuGrid.module.css";
import { useNavigate } from "react-router-dom";

const items = [
  {
    id: 1,
    name: "한식",
    iconUrl: "/icons/category/비빔밥.png",
    category: "korean",
  },
  {
    id: 2,
    name: "중식",
    iconUrl: "/icons/category/짜장면.png",
    category: "chinese",
  },
  {
    id: 3,
    name: "피자",
    iconUrl: "/icons/category/피자.png",
    category: "pizza",
  },
  {
    id: 4,
    name: "찜/탕",
    iconUrl: "/icons/category/순대국밥.png",
    category: "stew",
  },
  {
    id: 5,
    name: "치킨",
    iconUrl: "/icons/category/치킨.png",
    category: "chicken",
  },
  {
    id: 6,
    name: "분식",
    iconUrl: "/icons/category/떡볶이.png",
    category: "bunsik",
  },
  {
    id: 7,
    name: "돈까스",
    iconUrl: "/icons/category/돈가스.png",
    category: "porkcutlet",
  },
  {
    id: 8,
    name: "족발/보쌈",
    iconUrl: "/icons/category/보쌈.png",
    category: "pigfeet",
  },
  {
    id: 9,
    name: "구이",
    iconUrl: "/icons/category/구이.png",
    category: "grill",
  },
  {
    id: 10,
    name: "일식",
    iconUrl: "/icons/category/스시.png",
    category: "japanese",
  },
  {
    id: 11,
    name: "회/해물",
    iconUrl: "/icons/category/오징어회.png",
    category: "seafood",
  },
  {
    id: 12,
    name: "양식",
    iconUrl: "/icons/category/스파게티.png",
    category: "western",
  },
  {
    id: 13,
    name: "커피/차",
    iconUrl: "/icons/category/커피.png",
    category: "cafe",
  },
  {
    id: 14,
    name: "디저트",
    iconUrl: "/icons/category/케이크.png",
    category: "dessert",
  },
  {
    id: 15,
    name: "간식",
    iconUrl: "/icons/category/핫도그.png",
    category: "snack",
  },
  {
    id: 16,
    name: "아시안",
    iconUrl: "/icons/category/베트남쌀국수.png",
    category: "asian",
  },
  {
    id: 17,
    name: "샌드위치",
    iconUrl: "/icons/category/샌드위치.png",
    category: "sandwich",
  },
  {
    id: 18,
    name: "샐러드",
    iconUrl: "/icons/category/샐러드.png",
    category: "salad",
  },
  {
    id: 19,
    name: "버거",
    iconUrl: "/icons/category/햄버거.png",
    category: "burger",
  },
  {
    id: 20,
    name: "멕시칸",
    iconUrl: "/icons/category/타코.png",
    category: "mexican",
  },
  {
    id: 21,
    name: "도시락",
    iconUrl: "/icons/category/도시락.png",
    category: "lunchbox",
  },
  {
    id: 22,
    name: "죽",
    iconUrl: "/icons/category/야채죽.png",
    category: "porridge",
  },
  {
    id: 23,
    name: "포장",
    iconUrl: "/icons/category/종이가방.png",
    category: "takeout",
  },
  {
    id: 24,
    name: "1인분",
    iconUrl: "/icons/category/1인분.png",
    category: "single",
  },
];

export default function MenuGrid() {
  const navigate = useNavigate();
  const LIST_URL = "/stores?category=";

  const [expanded, setExpanded] = useState(false);
  const defaultVisibleCount = 10;

  const toggleItem = {
    id: -1,
    name: expanded ? "접기" : "더보기",
    iconUrl: "/icons/expand-more.svg",
  };

  // 닫힌 상태: 메뉴 1~9 + 토글 버튼
  const fixedItemsCollapsed = [
    ...items.slice(0, defaultVisibleCount - 1),
    toggleItem,
  ];

  // 열린 상태: 메뉴 1~25 + 접기 버튼 (맨 마지막)
  const allItemsExpanded = [...items, toggleItem];

  return (
    <div className={styles.container}>
      {/* 고정 1~9 + 더보기 OR 1~10 (열림) */}
      <div className={styles.grid}>
        {(expanded
          ? items.slice(0, defaultVisibleCount)
          : fixedItemsCollapsed
        ).map((item) => (
          <button
            key={item.id}
            className={styles.menuItem}
            onClick={() => {
              if (item.id === -1) setExpanded((prev) => !prev);
              else navigate(LIST_URL + item.category);
            }}
          >
            <img
              src={item.iconUrl}
              alt={item.name}
              className={styles.menuIcon}
            />
            <span className={styles.menuName}>{item.name}</span>
          </button>
        ))}
      </div>

      {/* 펼쳐지는 부분 */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className={`${styles.grid} ${styles.expandedGrid}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {allItemsExpanded.slice(defaultVisibleCount).map((item) => (
              <button
                key={item.id}
                className={styles.menuItem}
                onClick={() => {
                  if (item.id === -1) setExpanded(false);
                  else navigate(LIST_URL + item.category);
                }}
              >
                <img
                  src={item.iconUrl}
                  alt={item.name}
                  className={styles.menuIcon}
                  style={{ rotate: item.id === -1 ? "180deg" : "0deg" }}
                />
                <span className={styles.menuName}>{item.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
