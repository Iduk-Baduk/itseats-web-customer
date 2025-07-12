// src/pages/Payments/AddPaymentMethod.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import styles from "./AddPaymentMethod.module.css";

export default function AddPaymentMethod() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <Header
        title="결제수단 선택"
        leftButtonAction={() => {
          navigate(-1);
        }}
        rightIcon=""
      />

      <div
        className={styles.option}
        onClick={() => navigate("/payments/add/account")}
      >
        <img
          src="/icons/logos/account.svg"
          alt="은행계좌"
          className={styles.icon}
        />
        <span>은행계좌</span>
        <p className={styles.arr}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M12.6 12L8 7.4L9.4 6l6 6l-6 6L8 16.6z"
            />
          </svg>
        </p>
      </div>

      <div
        className={styles.option}
        onClick={() => navigate("/payments/add/card")}
      >
        <img
          src="/icons/logos/credit.svg"
          alt="카드등록"
          className={styles.icon}
        />
        <span>신용/체크 카드</span>
        <p className={styles.arr}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M12.6 12L8 7.4L9.4 6l6 6l-6 6L8 16.6z"
            />
          </svg>
        </p>
      </div>
    </div>
  );
}
