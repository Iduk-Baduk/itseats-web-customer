import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styles from '../../../pages/orders/Cart.module.css';
import { setSelectedPaymentMethod } from '../../../store/paymentSlice';

export default function CartPaymentMethodSection() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    selectedPaymentType,
    selectedCardId,
    selectedAccountId,
    cards,
    accounts,
    coupayMoney,
  } = useSelector(state => state.payment);

  // 드롭다운 상태
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // 결제수단 종류별 라벨/대표값
  const paymentOptions = [
    {
      type: 'coupay',
      label: '쿠페이 머니',
      value: coupayMoney,
      disabled: false,
    },
    {
      type: 'card',
      label: '신용/체크카드',
      value: cards.length,
      disabled: cards.length === 0,
    },
    {
      type: 'account',
      label: '계좌이체',
      value: accounts.length,
      disabled: accounts.length === 0,
    },
  ];

  // 대표 결제수단 라벨
  let selectedLabel = '';
  if (selectedPaymentType === 'coupay') {
    selectedLabel = `쿠페이 머니 (보유 ${coupayMoney}원)`;
  } else if (selectedPaymentType === 'card') {
    const card = cards.find(c => c.id === selectedCardId) || cards[0];
    selectedLabel = card ? `${card.name} ****${card.last4}` : '카드 선택';
  } else if (selectedPaymentType === 'account') {
    const account = accounts.find(a => a.id === selectedAccountId) || accounts[0];
    selectedLabel = account ? `${account.bankName} ****${account.last4}` : '계좌 선택';
  }

  // 공통 드롭다운 버튼 렌더링 함수
  const renderDropdownButton = (label) => (
    <button
      className={`${styles.dropdownButton} ${dropdownOpen ? styles.open : ''}`}
      onClick={() => setDropdownOpen(v => !v)}
      type="button"
      aria-expanded={dropdownOpen}
      aria-haspopup="listbox"
    >
      <span className={styles.buttonLabel}>{label}</span>
      <span className={styles.dropdownArrow}>
        {dropdownOpen ? '▲' : '▼'}
      </span>
    </button>
  );

  // 드롭다운 리스트 렌더링
  const renderDropdownList = () => {
    if (selectedPaymentType === 'card') {
      return (
        <div className={styles.dropdownList}>
          {cards.map(card => (
            <div
              key={card.id}
              className={`${styles.dropdownItem} ${selectedCardId === card.id ? styles.selected : ''}`}
              onClick={() => {
                dispatch(setSelectedPaymentMethod({ type: 'card', cardId: card.id }));
                setDropdownOpen(false);
              }}
            >
              <span className={styles.itemLabel}>{card.name} ****{card.last4}</span>
              {selectedCardId === card.id && <span className={styles.checkmark}>✔</span>}
            </div>
          ))}
          <div
            className={styles.addNewItem}
            onClick={() => { setDropdownOpen(false); navigate('/payments/add-card'); }}
          >
            + 신용/체크카드 추가
          </div>
        </div>
      );
    }
    if (selectedPaymentType === 'account') {
      return (
        <div className={styles.dropdownList}>
          {accounts.map(account => (
            <div
              key={account.id}
              className={`${styles.dropdownItem} ${selectedAccountId === account.id ? styles.selected : ''}`}
              onClick={() => {
                dispatch(setSelectedPaymentMethod({ type: 'account', accountId: account.id }));
                setDropdownOpen(false);
              }}
            >
              <span className={styles.itemLabel}>{account.bankName} ****{account.last4}</span>
              {selectedAccountId === account.id && <span className={styles.checkmark}>✔</span>}
            </div>
          ))}
          <div
            className={styles.addNewItem}
            onClick={() => { setDropdownOpen(false); navigate('/payments/add-account'); }}
          >
            + 은행계좌 추가
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className={styles.section}>
      <div className={styles.paymentContainer}>
        {/* 결제수단 종류별 라디오 */}
        <div className={styles.paymentOptions}>
          {paymentOptions.map(opt => (
            <label key={opt.type} className={`${styles.paymentOption} ${opt.disabled ? styles.disabled : ''}`}>
              <input
                type="radio"
                name="paymentType"
                value={opt.type}
                checked={selectedPaymentType === opt.type}
                disabled={opt.disabled}
                onChange={() => {
                  if (!opt.disabled) {
                    if (opt.type === 'card' && cards.length > 0) {
                      dispatch(setSelectedPaymentMethod({ type: 'card', cardId: cards[0].id }));
                    } else if (opt.type === 'account' && accounts.length > 0) {
                      dispatch(setSelectedPaymentMethod({ type: 'account', accountId: accounts[0].id }));
                    } else {
                      dispatch(setSelectedPaymentMethod({ type: opt.type }));
                    }
                    setDropdownOpen(false);
                  }
                }}
                className={styles.radioInput}
              />
              {opt.label}
            </label>
          ))}
        </div>
        
        {/* 대표 결제수단 + 드롭다운 버튼 */}
        {(selectedPaymentType === 'card' && cards.length > 0) && (
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            {renderDropdownButton(selectedLabel)}
            {dropdownOpen && renderDropdownList()}
          </div>
        )}
        
        {(selectedPaymentType === 'account' && accounts.length > 0) && (
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            {renderDropdownButton(selectedLabel)}
            {dropdownOpen && renderDropdownList()}
          </div>
        )}
        
        {(selectedPaymentType === 'coupay') && (
          <div className={styles.coupayInfo}>{selectedLabel}</div>
        )}
      </div>
    </section>
  );
}
