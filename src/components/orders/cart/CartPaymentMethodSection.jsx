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

  // 드롭다운 리스트 렌더링
  const renderDropdownList = () => {
    if (selectedPaymentType === 'card') {
      return (
        <div style={{background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 14, marginTop: 6, boxShadow: '0 6px 24px rgba(0,0,0,0.10)', zIndex: 100, position: 'absolute', right: 0, left: 0, minWidth: 260, padding: '4px 0'}}>
          {cards.map(card => (
            <div
              key={card.id}
              style={{padding: '16px 24px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 16, color: '#222', background: selectedCardId === card.id ? '#f5f7fa' : '#fff', fontWeight: selectedCardId === card.id ? 700 : 500}}
              onClick={() => {
                dispatch(setSelectedPaymentMethod({ type: 'card', cardId: card.id }));
                setDropdownOpen(false);
              }}
            >
              <span style={{flex: 1}}>{card.name} ****{card.last4}</span>
              {selectedCardId === card.id && <span style={{color: '#2196f3', fontWeight: 700, fontSize: 20, marginLeft: 8}}>✔</span>}
            </div>
          ))}
          <div
            style={{padding: '16px 24px', color: '#2196f3', fontWeight: 600, cursor: 'pointer', borderTop: '1px solid #f0f0f0', fontSize: 16}}
            onClick={() => { setDropdownOpen(false); navigate('/payments/add-card'); }}
          >
            + 신용/체크카드 추가
          </div>
        </div>
      );
    }
    if (selectedPaymentType === 'account') {
      return (
        <div style={{background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 14, marginTop: 6, boxShadow: '0 6px 24px rgba(0,0,0,0.10)', zIndex: 100, position: 'absolute', right: 0, left: 0, minWidth: 260, padding: '4px 0'}}>
          {accounts.map(account => (
            <div
              key={account.id}
              style={{padding: '16px 24px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 16, color: '#222', background: selectedAccountId === account.id ? '#f5f7fa' : '#fff', fontWeight: selectedAccountId === account.id ? 700 : 500}}
              onClick={() => {
                dispatch(setSelectedPaymentMethod({ type: 'account', accountId: account.id }));
                setDropdownOpen(false);
              }}
            >
              <span style={{flex: 1}}>{account.bankName} ****{account.last4}</span>
              {selectedAccountId === account.id && <span style={{color: '#2196f3', fontWeight: 700, fontSize: 20, marginLeft: 8}}>✔</span>}
            </div>
          ))}
          <div
            style={{padding: '16px 24px', color: '#2196f3', fontWeight: 600, cursor: 'pointer', borderTop: '1px solid #f0f0f0', fontSize: 16}}
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
      <div style={{display: 'flex', flexDirection: 'column', gap: 14, position: 'relative'}}>
        {/* 결제수단 종류별 라디오 */}
        <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
          {paymentOptions.map(opt => (
            <label key={opt.type} style={{display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 16, color: opt.disabled ? '#bbb' : '#222', cursor: opt.disabled ? 'not-allowed' : 'pointer'}}>
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
                    setDropdownOpen(false); // 라디오 변경 시 드롭다운 닫기
                  }
                }}
                style={{accentColor: '#2196f3', width: 20, height: 20}}
              />
              {opt.label}
            </label>
          ))}
        </div>
        {/* 대표 결제수단 + 드롭다운 버튼 */}
        {(selectedPaymentType === 'card' && cards.length > 0) && (
          <div style={{position: 'relative', width: 300, maxWidth: '100%'}} ref={dropdownRef}>
            <button
              style={{
                width: '100%',
                background: '#f5f5f5',
                border: '1.5px solid #e0e0e0',
                borderRadius: 12,
                padding: '18px 20px',
                fontSize: 16,
                fontWeight: 600,
                color: '#222',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                boxShadow: dropdownOpen ? '0 4px 16px rgba(0,0,0,0.07)' : 'none',
                transition: 'box-shadow 0.2s',
                minHeight: 56,
              }}
              onClick={() => setDropdownOpen(v => !v)}
              type="button"
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
            >
              <span style={{flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{selectedLabel}</span>
              <span style={{marginLeft: 10, fontSize: 22, color: '#888', display: 'flex', alignItems: 'center'}}>{dropdownOpen ? '▲' : '▼'}</span>
            </button>
            {dropdownOpen && renderDropdownList()}
          </div>
        )}
        {(selectedPaymentType === 'account' && accounts.length > 0) && (
          <div style={{position: 'relative', width: 300, maxWidth: '100%'}} ref={dropdownRef}>
            <button
              style={{
                width: '100%',
                background: '#f5f5f5',
                border: '1.5px solid #e0e0e0',
                borderRadius: 12,
                padding: '18px 20px',
                fontSize: 16,
                fontWeight: 600,
                color: '#222',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                boxShadow: dropdownOpen ? '0 4px 16px rgba(0,0,0,0.07)' : 'none',
                transition: 'box-shadow 0.2s',
                minHeight: 56,
              }}
              onClick={() => setDropdownOpen(v => !v)}
              type="button"
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
            >
              <span style={{flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{selectedLabel}</span>
              <span style={{marginLeft: 10, fontSize: 22, color: '#888', display: 'flex', alignItems: 'center'}}>{dropdownOpen ? '▲' : '▼'}</span>
            </button>
            {dropdownOpen && renderDropdownList()}
          </div>
        )}
        {(selectedPaymentType === 'coupay') && (
          <div style={{padding: '18px 2px 0 2px', color: '#222', fontSize: 16, fontWeight: 600, minHeight: 56}}>{selectedLabel}</div>
        )}
      </div>
    </section>
  );
} 
