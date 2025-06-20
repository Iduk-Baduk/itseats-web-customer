// src/pages/Payments/AddPaymentMethod.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AddPaymentMethod.module.css";

export default function AddPaymentMethod() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>결제수단 선택</h2>

      <div className={styles.option} onClick={() => navigate("/add-account")}>
        <img
          src="/icons/logos/account.svg"
          alt="은행계좌"
          className={styles.icon}
        />
        <span>은행계좌</span>
        <p className={styles.arr}>&gt;</p>
      </div>

      <div className={styles.option} onClick={() => navigate("/add-card")}>
        <img
          src="/icons/logos/credit.svg"
          alt="카드등록"
          className={styles.icon}
        />
        <span>신용/체크 카드</span>
        <p className={styles.arr}>&gt;</p>
      </div>
    </div>
  );
}
