import { useState } from "react";

const dummyData = {
  money: [
    { id: "m1", label: "쿠페이 머니 (보유 0원)" },
  ],
  cards: [
    { id: "c1", label: "신한카드 ****553*" },
  ],
  accounts: [
    { id: "a1", label: "카카오뱅크 ****0227" },
    { id: "a2", label: "국민은행 ****5164" },
  ],
};

export default function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState(dummyData);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleDelete = (item, confirm = false) => {
    if (!confirm) {
      setSelectedItem(item);
      setShowDeleteModal(true);
      return;
    }

    const type = item.id[0] === "m" ? "money" : item.id[0] === "c" ? "cards" : "accounts";
    setPaymentMethods((prev) => ({
      ...prev,
      [type]: prev[type].filter((v) => v.id !== item.id),
    }));
    setShowDeleteModal(false);
  };

  return {
    paymentMethods,
    handleDelete,
    showDeleteModal,
    selectedItem,
    setShowDeleteModal,
  };
}
