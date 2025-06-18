import { useState } from "react";
import styles from "./OrderTab.module.css";

export default function OrderTab() {
  const [selectedTab, setSelectedTab] = useState("past");

  return (
    <div className={styles.tabWrapper}>
      <button
        className={`${styles.tab} ${selectedTab === "past" ? styles.active : ""}`}
        onClick={() => setSelectedTab("past")}
      >
        과거 주문 내역
      </button>
      <button
        className={`${styles.tab} ${selectedTab === "preparing" ? styles.active : ""}`}
        onClick={() => setSelectedTab("preparing")}
      >
        준비중
      </button>
    </div>
  );
}
