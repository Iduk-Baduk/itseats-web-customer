import { useEffect, useRef, useState } from "react";
import styles from "./AutoScrollTabs.module.css";

const categories = [
  { id: "korean", label: "한식" },
  { id: "snack", label: "분식" },
  { id: "western", label: "양식" },
  { id: "cafe", label: "카페" },
  { id: "dessert", label: "디저트" },
  { id: "etc", label: "기타" },
  { id: "alcohol", label: "주류" },
  { id: "delivery", label: "배달" },
  { id: "takeout", label: "포장" },
    { id: "chinese", label: "중식" },
  { id: "japanese", label: "일식" },
  { id: "pickup", label: "픽업" },
  { id: "reservation", label: "예약" },
  { id: "event", label: "이벤트" },
  { id: "new", label: "신규" },
  { id: "popular", label: "인기" },
];

export default function AutoScrollTabs({ fixed = false }) {
  const [activeTab, setActiveTab] = useState(categories[0].id);
  const sectionRefs = useRef({});
  const tabRefs = useRef({});

  // 탭 클릭 → 해당 섹션 스크롤
  const handleTabClick = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "auto", block: "start" });
    tabRefs.current[id]?.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
    setActiveTab(id);
  };

  // 스크롤 → 보이는 섹션 기준으로 탭 활성화
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) {
          setActiveTab(visibleEntry.target.dataset.id);
          tabRefs.current[visibleEntry.target.dataset.id]?.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
        }
      },
      {
        root: null,
        threshold: 0.5, // 화면의 50% 이상 보일 때
      }
    );

    categories.forEach(({ id }) => {
      const section = sectionRefs.current[id];
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabBar} style={{ position: fixed ? "fixed" : "relative" }}>
        {categories.map(({ id, label }) => (
          <button
            key={id}
            ref={(el) => (tabRefs.current[id] = el)}
            className={`${styles.tab} ${activeTab === id ? styles.active : ""}`}
            onClick={() => handleTabClick(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.fixedSpacer} />
      {fixed && <div className={styles.fixedSpacer} />}

      <div className={styles.content}>
        {categories.map(({ id, label }) => (
          <section
            key={id}
            ref={(el) => (sectionRefs.current[id] = el)}
            data-id={id}
            className={styles.section}
          >
            <h2 className={styles.subHeader}>{label}</h2>
            <ul className={styles.menuList}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <li key={idx} className={styles.menuItem}>
                  {label} 메뉴 {idx + 1}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}