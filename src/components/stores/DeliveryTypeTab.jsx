import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DeliveryTypeTab.module.css";

export default function DeliveryTypeTab({
  storeId = 2, // 존재하는 매장 ID로 변경
  defaultTime = 0,
  takeoutTime = 0,
  minimumOrderPrice = 0,
  deliveryFeeMin = 0,
  deliveryFeeMax = 0,
  address = "",
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("delivery");

  return (
    <div className={styles.container} id="delivery-type-tab">
      <div className={styles.tabHeader}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "delivery" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("delivery")}
        >
          배달 <span>{defaultTime}분</span>
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "takeout" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("takeout")}
        >
          포장 <span>{takeoutTime}분</span>
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === "delivery" && (
          <div>
            <div className={styles.deliveryInfo}>
              <p>도착까지 약 {defaultTime}분</p>
              <InfoButton onClick={() => navigate(`/stores/${storeId}/info`)} />
            </div>
            <div className={styles.deliveryDetails}>
              <div className={styles.row}>
                <span className={styles.label}>최소주문금액</span>
                <span>{minimumOrderPrice.toLocaleString()}원</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>배달비</span>
                <span>
                  {deliveryFeeMin.toLocaleString()}원 ~ {deliveryFeeMax.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        )}
        {activeTab === "takeout" && (
          <div>
            <div className={styles.deliveryInfo}>
              <p>포장까지 약 {takeoutTime}분</p>
              <InfoButton onClick={() => navigate(`/stores/${storeId}/info`)} />
            </div>
            <div className={styles.deliveryDetails}>
              <div className={styles.row}>
                <span className={styles.label}>매장주소</span>
                <span>{address}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoButton({ onClick }) {
  return (
    <button className={styles.infoButton} onClick={onClick}>
      매장·원산지정보
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
      >
        <path fill="currentColor" d="M12.6 12L8 7.4L9.4 6l6 6l-6 6L8 16.6z" />
      </svg>
    </button>
  );
}
