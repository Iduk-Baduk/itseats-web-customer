import { useEffect, useRef, useState } from "react";
import MenuItem from "./MenuItem";
import styles from "./AutoScrollTabs.module.css";

export default function AutoScrollTabs({ storeId, menus, fixed = false }) {
  const menuGroups = menus
    .map((menu) => menu.groupName)
    .filter((group, index, self) => self.indexOf(group) === index);

  const [activeTab, setActiveTab] = useState(menuGroups[0]);
  const sectionRefs = useRef({});
  const tabRefs = useRef({});

  // 탭 클릭 → 해당 섹션 스크롤
  const handleTabClick = (id) => {
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "auto",
      block: "start",
    });
    tabRefs.current[id]?.scrollIntoView({
      behavior: "auto",
      inline: "center",
      block: "nearest",
    });
    setActiveTab(id);
  };

  // 스크롤 → 보이는 섹션 기준으로 탭 활성화
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) {
          setActiveTab(visibleEntry.target.dataset.id);
          tabRefs.current[visibleEntry.target.dataset.id]?.scrollIntoView({
            behavior: "auto",
            inline: "center",
            block: "nearest",
          });
        }
      },
      {
        root: null,
        threshold: 0.5, // 화면의 50% 이상 보일 때
      }
    );

    menuGroups.forEach((group) => {
      const section = sectionRefs.current[group];
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [menus]);

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.tabBar}
        style={{ position: fixed ? "fixed" : "relative" }}
      >
        {menuGroups.map((group) => (
          <button
            key={group}
            ref={(el) => (tabRefs.current[group] = el)}
            className={`${styles.tab} ${
              activeTab === group ? styles.active : ""
            }`}
            onClick={() => handleTabClick(group)}
          >
            {group}
          </button>
        ))}
      </div>
      <div className={styles.fixedSpacer} />
      {fixed && <div className={styles.fixedSpacer} />}

      <div className={styles.content}>
        {menuGroups.map((group) => (
          <section
            key={group}
            ref={(el) => (sectionRefs.current[group] = el)}
            data-id={group}
            className={styles.section}
          >
            <h2 className={styles.subHeader}>{group}</h2>
            {menus
              .filter((menu) => menu.groupName === group)
              .map((menu) => (
                <MenuItem key={menu.menuId} storeId={storeId} menu={menu} />
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}
