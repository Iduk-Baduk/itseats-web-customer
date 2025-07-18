// src/pages/Payments/AddCard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addCardAsync } from "../../store/paymentSlice";
import useCurrentUser from "../../hooks/useCurrentUser";

import Header from "../../components/common/Header";
import styles from "./AddCard.module.css";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function AddCard() {
  const { currentUser, loading: userLoading } = useCurrentUser();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 사용자 정보 로딩 중이면 로딩 표시, 없으면 로그인 페이지로 리다이렉트
  if (userLoading) {
    return <LoadingSpinner />;
  }
  if (!currentUser) {
    navigate('/login');
    return null;
  }
  const user = currentUser;

  const [cardNumber, setCardNumber] = useState(["", "", "", ""]);
  const [expiry, setExpiry] = useState({ mm: "", yy: "" });
  const [cvc, setCvc] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [popup, setPopup] = useState(null); // success | error | null

  const thisYear = new Date().getFullYear();
  const currentYY = thisYear % 100;
  const maxYY = currentYY + 8;

  const isCardValid = cardNumber.every((num) => num.length === 4);
  const mmNum = Number(expiry.mm);
  const yyNum = Number(expiry.yy);
  const isValidMM = expiry.mm.length === 2 && mmNum >= 1 && mmNum <= 12;
  const isValidYY = expiry.yy.length === 2 && yyNum >= currentYY && yyNum <= maxYY;
  const isExpiryValid = isValidMM && isValidYY;
  const isCvcValid = cvc.length === 3;
  const isPwValid = password.length === 2;
  const isAllValid = isCardValid && isExpiryValid && isCvcValid && isPwValid && agree;

  const handleCardInput = (index, value) => {
    const newNums = [...cardNumber];
    newNums[index] = value.replace(/\D/g, "").slice(0, 4);
    setCardNumber(newNums);
  };

  const handleSubmit = async () => {
    const payload = {
      cardNumber: cardNumber.join(""),
      expiryMonth: expiry.mm,
      expiryYear: expiry.yy,
      cvc,
      password,
    };

    try {
      // ✅ Axios 기반 API 서비스 사용
      dispatch(addCardAsync(payload))
        .unwrap() // unwrap으로 실제 결과값 추출
        .then(() => {
          setPopup("success");
        })
        .catch((error) => {
          console.error("카드 등록 실패:", error);
          setPopup("error");
        });
    } catch (error) {
      console.error("카드 등록 실패:", error);
      setPopup("error");
    }
  };

  return (
    <div className={styles.container}>
      <Header
        title="결제수단 등록"
        leftButtonAction={() => navigate(-1)}
        rightIcon=""
      />

      {/* 카드번호 입력 */}
      <div className={styles.inputBox}>
        <span className={styles.inputLabel}>카드번호</span>
        <div className={styles.cardInputGroup}>
          {cardNumber.map((num, idx) => (
            <div key={idx} className={styles.cardSegment}>
              <div className={styles.cardInputWrapper}>
                <input
                  type={idx < 2 ? "text" : "password"}
                  value={num}
                  onChange={(e) => handleCardInput(idx, e.target.value)}
                  maxLength={4}
                  className={styles.cardInput}
                />
              </div>
              {idx < 3 && <span className={styles.hyphen}>-</span>}
            </div>
          ))}
        </div>
      </div>

      <p className={styles.notice}>{user.name}님의 신용/체크카드만 이용 가능합니다.</p>

      {/* 유효기간 */}
      {isCardValid && (
        <>
          <div className={styles.flexRow}>
            <div className={`${styles.inputBox} ${!isValidMM && expiry.mm.length === 2 ? styles.invalid : ""}`}>
              <span className={styles.inputLabel}>유효기간 (MM)</span>
              <input
                type="text"
                maxLength={2}
                value={expiry.mm}
                onChange={(e) => setExpiry({ ...expiry, mm: e.target.value.replace(/\D/g, "") })}
                className={styles.input}
              />
              {expiry.mm.length === 2 && !isValidMM && (
                <span className={styles.errorMessage}>유효한 월을 입력하세요</span>
              )}
            </div>

            <div className={`${styles.inputBox} ${!isValidYY && expiry.yy.length === 2 ? styles.invalid : ""}`}>
              <span className={styles.inputLabel}>유효기간 (YY)</span>
              <input
                type="text"
                maxLength={2}
                value={expiry.yy}
                onChange={(e) => setExpiry({ ...expiry, yy: e.target.value.replace(/\D/g, "") })}
                className={styles.input}
              />
              {expiry.yy.length === 2 && !isValidYY && (
                <span className={styles.errorMessage}>유효한 연도를 입력하세요</span>
              )}
            </div>
          </div>

          {/* CVC */}
          {isExpiryValid && (
            <div className={styles.inputBox}>
              <span className={styles.inputLabel}>CVC</span>
              <input
                type="password"
                maxLength={3}
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                className={styles.input}
              />
            </div>
          )}

          {/* 비밀번호 */}
          {isCvcValid && (
            <div className={styles.inputBox}>
              <span className={styles.inputLabel}>비밀번호</span>
              <input
                type="password"
                maxLength={2}
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\D/g, ""))}
                className={styles.input}
              />
            </div>
          )}
        </>
      )}

      <label className={styles.agreeBox}>
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        카드사 개인정보 제3자 제공
      </label>

      <button
        className={isAllValid ? styles.active : styles.disabled}
        disabled={!isAllValid}
        onClick={handleSubmit}
      >
        등록하기
      </button>

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
