import { useState } from "react";
import styles from "./OrderTab.module.css";

export default function OrderTab({ onTabChange }) {
  const [selectedTab, setSelectedTab] = useState("past");

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    onTabChange(tab);
  };

  return (
    <div className={styles.tabWrapper}>
      <button
        className={`${styles.tab} ${selectedTab === "past" ? styles.active : ""}`}
        onClick={() => handleTabChange("past")}
      >
        과거 주문 내역
      </button>
      <button
        className={`${styles.tab} ${selectedTab === "preparing" ? styles.active : ""}`}
        onClick={() => handleTabChange("preparing")}
      >
        준비중
      </button>
    </div>
  );
}
