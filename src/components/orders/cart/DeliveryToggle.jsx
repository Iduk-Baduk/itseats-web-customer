import styles from "./DeliveryToggle.module.css";
import { useState } from "react";

export default function DeliveryToggle({ onChange }) {
  const [selected, setSelected] = useState("delivery");

  const handleClick = (type) => {
    setSelected(type);
    onChange?.(type);
  };

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.button} ${
          selected === "delivery" ? styles.active : ""
        }`}
        onClick={() => handleClick("delivery")}
      >
        배달
      </button>
      <button
        className={`${styles.button} ${
          selected === "takeout" ? styles.active : ""
        }`}
        onClick={() => handleClick("takeout")}
      >
        포장
      </button>
    </div>
  );
}