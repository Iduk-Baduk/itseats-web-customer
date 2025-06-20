import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import usePaymentMethods from "../hooks/usePaymentMethods";
import ConfirmModal from "../components/common/ConfirmModal";
import styles from "./Payments.module.css";

export default function Payments() {
  const navigate = useNavigate();
  const { cards, accounts, coupayMoney, deleteCard, deleteAccount } =
    usePaymentMethods();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDeleteClick = (type, id) => {
    setDeleteTarget({ type, id });
    setModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget.type === "card") {
      deleteCard(deleteTarget.id);
    } else if (deleteTarget.type === "account") {
      deleteAccount(deleteTarget.id);
    }
    setModalOpen(false);
    setDeleteTarget(null);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>결제 관리</h2>

      <section>
        <p className={styles.label}>쿠페이 머니</p>
        <div className={styles.item}>
          <img
            src="/icons/logos/coupay.jpg"
            alt="coupay"
            className={styles.icon}
          />
          <span>
            쿠페이 머니 (보유 {coupayMoney}원)
            <p className={styles.coupayDesc}>연결된 계좌는 계좌이체 목록에서 확인 가능합니다.</p>{" "}
          </span>
        </div>
      </section>

      {cards.length > 0 && (
        <section>
          <p className={styles.label}>신용/체크카드</p>
          {cards.map((card) => (
            <div key={card.id} className={styles.item}>
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
            <div key={account.id} className={styles.item}>
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
          onClick={() => navigate("/add-payment")}
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
    </div>
  );
}
