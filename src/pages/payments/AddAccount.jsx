// src/pages/Payments/AddAccount.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addAccountAsync } from "../../store/paymentSlice";
import useCurrentUser from "../../hooks/useCurrentUser";

import Header from "../../components/common/Header";
import styles from "./AddAccount.module.css";

const banks = [
  { id: "kb", name: "국민은행", logo: "/icons/logos/kbbank.jpg" },
  { id: "shinhan", name: "신한은행", logo: "/icons/logos/shinhan.png" },
  { id: "kakao", name: "카카오뱅크", logo: "/icons/logos/kakao.png" },
  { id: "woori", name: "우리은행", logo: "/icons/logos/woori.png" },
  { id: "nh", name: "농협", logo: "/icons/logos/nh.jpg" },
  { id: "ibk", name: "기업은행", logo: "/icons/logos/ibk.svg" },
];

export default function AddAccount() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: currentUser, loading: userLoading } = useCurrentUser();

  // 사용자 정보가 로딩 중이거나 없으면 기본값 사용
  const user = currentUser || { name: "사용자" };

  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [popup, setPopup] = useState(null);

  const accountNumberValid = /^[0-9]{10,20}$/.test(accountNumber);
  const isValid = selectedBank && accountNumberValid;

  const handleSubmit = async () => {
    // 계좌번호 마스킹 처리 (앞 3자리, 뒤 4자리만 표시)
    const maskedAccountNumber = accountNumber.length > 7 
      ? `${accountNumber.slice(0, 3)}-***-****${accountNumber.slice(-4)}`
      : accountNumber;

    const payload = {
      bankName: selectedBank.name,
      bankId: selectedBank.id,
      accountNumber: maskedAccountNumber,
      accountName: user.name,
      last4: accountNumber.slice(-4),
      image: selectedBank.logo,
      isDefault: false,
    };

    try {
      // ✅ Axios 기반 API 서비스 사용
      dispatch(addAccountAsync(payload))
        .unwrap() // unwrap으로 실제 결과값 추출
        .then(() => {
          setPopup("success");
        })
        .catch((error) => {
          console.error("계좌 등록 실패:", error);
          setPopup("error");
        });
    } catch (error) {
      console.error("계좌 등록 실패:", error);
      setPopup("error");
    }
  };

  return (
    <div className={styles.container}>
      <Header
        title="계좌 등록"
        leftButtonAction={() => navigate(-1)}
        rightIcon=""
      />
      <p className={styles.subtitle}>본인 명의의 계좌만 등록 가능합니다.</p>

      {!selectedBank ? (
        <div className={styles.grid}>
          {banks.map((bank) => (
            <div
              key={bank.id}
              className={styles.bankBox}
              onClick={() => setSelectedBank(bank)}
            >
              <img src={bank.logo} alt={bank.name} className={styles.logo} />
              <span className={styles.bankName}>{bank.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className={styles.selectedBank}>
            <img
              src={selectedBank.logo}
              alt={selectedBank.name}
              className={styles.logo}
            />
            <span className={styles.bankName}>{selectedBank.name}</span>
          </div>

          <div
            className={`${styles.inputBox} ${
              !accountNumberValid && accountNumber ? styles.invalid : ""
            }`}
          >
            <span className={styles.inputLabel}>계좌번호</span>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))
              }
              className={styles.input}
            />
            {!accountNumberValid && accountNumber && (
              <p className={styles.warningText}>
                하이픈(-)을 제외한 숫자만 입력해주세요. (10~20자리)
              </p>
            )}
          </div>

          <div className={styles.inputBox}>
            <span className={styles.inputLabel}>예금주명</span>
            <input
              type="text"
              value={user.name}
              disabled
              className={styles.input}
            />
          </div>

          <button
            className={isValid ? styles.active : styles.disabled}
            disabled={!isValid}
            onClick={handleSubmit}
          >
            등록하기
          </button>
        </>
      )}

      {popup && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <p className={styles.modalText}>
              {popup === "success"
                ? "등록이 완료되었습니다."
                : "등록에 실패했습니다."}
            </p>
            <button
              className={styles.modalButton}
              onClick={() => {
                setPopup(null);
                if (popup === "success") {
                  // 등록 성공 시 결제수단 페이지로 자동 이동
                  navigate("/payments");
                }
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
