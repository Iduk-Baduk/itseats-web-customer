// src/hooks/usePaymentMethods.js
import { useSelector, useDispatch } from "react-redux";
import {
  removeCard,
  removeAccount,
  addCard,
  addAccount,
  fetchPaymentMethods,
} from "../store/paymentSlice";

export default function usePaymentMethods() {
  const dispatch = useDispatch();
  const { cards, accounts, coupayMoney, isLoading, error } = useSelector(
    (state) => state.payment
  );

  const deleteCard = (id) => dispatch(removeCard(id));
  const deleteAccount = (id) => dispatch(removeAccount(id));
  const addNewCard = (card) => dispatch(addCard(card));
  const addNewAccount = (account) => dispatch(addAccount(account));
  const fetchData = () => dispatch(fetchPaymentMethods());

  return {
    cards,
    accounts,
    coupayMoney,
    deleteCard,
    deleteAccount,
    addNewCard,
    addNewAccount,
    fetchData,
    isLoading,
    error,
  };
}
