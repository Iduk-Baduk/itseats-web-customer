import { image } from "motion/react-client";
import { useState, useEffect } from "react";

// 더미 카드사, 은행 로고
const dummyCards = [
  {
    id: 1,
    name: "신한카드",
    last4: "553*",
    image: "/icons/logos/shinhan.png",
  },
];

const dummyAccounts = [
  {
    id: 1,
    bankName: "카카오뱅크",
    last4: "0227",
    image: "/icons/logos/kakao.png",
  },
  {
    id: 2,
    bankName: "국민은행",
    last4: "5164",
    image: "/icons/logos/kbbank.jpg",
  },
];

export default function usePaymentMethods() {
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [coupayMoney, setCoupayMoney] = useState(0);

  useEffect(() => {
    // 초기 더미 데이터 로드
    setCards(dummyCards);
    setAccounts(dummyAccounts);
    setCoupayMoney(0);
  }, []);

  const deleteCard = (id) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
  };

  const deleteAccount = (id) => {
    setAccounts((prev) => prev.filter((account) => account.id !== id));
  };

  return {
    cards,
    accounts,
    coupayMoney,
    deleteCard,
    deleteAccount,
  };
}
