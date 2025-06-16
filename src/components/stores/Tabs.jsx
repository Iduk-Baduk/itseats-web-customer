import { useState, useRef, useEffect } from "react";
import styles from "./Tabs.module.css";
import { CATEGORIES } from "../../utils/categoryUtils";
import { useSearchParams } from "react-router-dom";

export default function Tabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category");

  const [activeTab, setActiveTab] = useState(category || "korean");
  const tabRefs = useRef({});
  const scrollRef = useRef(null);

  // 마우스 휠로 좌우 스크롤
  useEffect(() => {
    // 최초 렌더링시 선택된 탭을 가운데로 스크롤
    const initialTab = tabRefs.current[category];
    if (initialTab) {
      initialTab.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }

    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (e.deltaY === 0) return;
      // 탭 아이템 위에 있어도 스크롤 가능하게
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const handleTabClick = (category) => {
    setActiveTab(category);
    setSearchParams({ category }, { replace: true });

    // 선택된 탭을 가운데로 스크롤
    const el = tabRefs.current[category];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  };

  return (
    <div className={styles.tabsWrapper} ref={scrollRef}>
      <div className={styles.tabsContainer}>
        {CATEGORIES.map((tab) => (
          <div
            key={tab.category}
            ref={(el) => (tabRefs.current[tab.category] = el)} // 탭별 DOM 저장
            className={`${styles.tabItem} ${
              activeTab === tab.category ? styles.active : ""
            }`}
            onClick={() => handleTabClick(tab.category)}
          >
            {tab.name}
          </div>
        ))}
      </div>
    </div>
  );
}
