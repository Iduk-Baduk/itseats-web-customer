import React from "react";
import styles from "./Payments.module.css";
import usePaymentMethods from "../hooks/usePaymentMethods";

export default function Payments() {
  const {
    paymentMethods,
    handleDelete,
    showDeleteModal,
    selectedItem,
    setShowDeleteModal,
  } = usePaymentMethods();

  const renderSection = (title, items) => (
    items.length > 0 && (
      <section className={styles.section}>
        <h3>{title}</h3>
        {items.map((item) => (
          <div key={item.id} className={styles.item}>
            <span>{item.label}</span>
            <button onClick={() => handleDelete(item)} className={styles.delete}>삭제</button>
          </div>
        ))}
      </section>
    )
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>결제 관리</h2>

      {renderSection("쿠페이 머니", paymentMethods.money)}
      {renderSection("신용/체크카드", paymentMethods.cards)}
      {renderSection("계좌이체", paymentMethods.accounts)}

      <button className={styles.addButton}>+ 결제수단 추가</button>

      {showDeleteModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <p>선택하신 결제 수단을 삭제하시겠습니까?</p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowDeleteModal(false)}>취소</button>
              <button onClick={() => handleDelete(selectedItem, true)}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
