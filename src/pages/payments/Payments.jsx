// src/pages/Payments/Payments.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  removeCard,
  removeAccount,
  fetchPaymentMethods,
  setSelectedPaymentMethod,
} from "../../store/paymentSlice";

import Header from "../../components/common/Header";
import ConfirmModal from "../../components/common/ConfirmModal";
import styles from "./Payments.module.css";
import Toast from "../../components/common/Toast";

export default function Payments() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const payment = useSelector((state) => state.payment);

  const {
    cards,
    accounts,
    coupayMoney,
    isLoading,
    error,
    selectedPaymentType,
    selectedCardId,
    selectedAccountId,
  } = payment;

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
  };

  // 🎯 결제수단 목록 최초 로딩
  useEffect(() => {
    dispatch(fetchPaymentMethods());
  }, [dispatch]);

  const handleDeleteClick = (type, id) => {
    setDeleteTarget({ type, id });
    setModalOpen(true);
  };

  // ✅ 수정된 handleConfirmDelete 함수
  const handleConfirmDelete = async () => {
    try {
      const { type, id } = deleteTarget;
      const endpoint =
        type === "card" ? `/api/cards/${id}` : `/api/accounts/${id}`;

      const res = await fetch(endpoint, { method: "DELETE" });

      if (!res.ok) throw new Error("삭제 실패");

      if (type === "card") {
        dispatch(removeCard(id));
      } else {
        dispatch(removeAccount(id));
      }
    } catch (err) {
      console.error("삭제 실패:", err);
      showToast("삭제에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setModalOpen(false);
      setDeleteTarget(null);
    }
  };

  // 결제수단 선택 핸들러
  const handleSelectPayment = (type, id) => {
    if (type === 'card') {
      dispatch(setSelectedPaymentMethod({ type: 'card', cardId: id }));
    } else if (type === 'account') {
      dispatch(setSelectedPaymentMethod({ type: 'account', accountId: id }));
    } else {
      dispatch(setSelectedPaymentMethod({ type: 'coupay' }));
    }
  };

  return (
    <div className={styles.container}>
      <Header
        title="결제 관리"
        leftButtonAction={() => navigate(-1)}
        rightIcon=""
      />

      {/* 로딩 또는 에러 처리 */}
      {isLoading && <p>로딩 중...</p>}
      {error && <p className={styles.errorText}>오류: {error}</p>}

      <section>
        <p className={styles.label}>쿠페이 머니</p>
        <div className={styles.item} style={{alignItems: 'center'}}>
          <input
            type="radio"
            name="paymentType"
            checked={selectedPaymentType === 'coupay'}
            onChange={() => handleSelectPayment('coupay')}
            style={{marginRight: 8}}
          />
          <img
            src="/icons/logos/coupay.jpg"
            alt="coupay"
            className={styles.icon}
          />
          <span>
            쿠페이 머니 (보유 {coupayMoney}원)
            <p className={styles.coupayDesc}>
              연결된 계좌는 계좌이체 목록에서 확인 가능합니다.
            </p>
          </span>
        </div>
      </section>

      {cards.length > 0 && (
        <section>
          <p className={styles.label}>신용/체크카드</p>
          {cards.map((card) => (
            <div key={card.id} className={styles.item} style={{alignItems: 'center'}}>
              <input
                type="radio"
                name="paymentType"
                checked={selectedPaymentType === 'card' && selectedCardId === card.id}
                onChange={() => handleSelectPayment('card', card.id)}
                style={{marginRight: 8}}
              />
              <img src={card.image} alt={card.name} className={styles.icon} />
              <span>
                {card.name} ****{card.last4}
              </span>
              <button
                onClick={() => handleDeleteClick("card", card.id)}
                className={styles.deleteButton}
              >
                삭제
              </button>
            </div>
          ))}
        </section>
      )}

      {accounts.length > 0 && (
        <section>
          <p className={styles.label}>계좌이체</p>
          {accounts.map((account) => (
            <div key={account.id} className={styles.item} style={{alignItems: 'center'}}>
              <input
                type="radio"
                name="paymentType"
                checked={selectedPaymentType === 'account' && selectedAccountId === account.id}
                onChange={() => handleSelectPayment('account', account.id)}
                style={{marginRight: 8}}
              />
              <img
                src={account.image}
                alt={account.bankName}
                className={styles.icon}
              />
              <span>
                {account.bankName} ****{account.last4}
              </span>
              <button
                onClick={() => handleDeleteClick("account", account.id)}
                className={styles.deleteButton}
              >
                삭제
              </button>
            </div>
          ))}
        </section>
      )}

      <div className={styles.addButtonWrapper}>
        <button
          onClick={() => navigate('/payments/add')}
          className={styles.addButton}
        >
          + 결제수단 추가
        </button>
      </div>

      {modalOpen && (
        <ConfirmModal
          message="선택하신 결제 수단을 삭제하시겠습니까?"
          onCancel={() => setModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}


    </div>
  );
}
