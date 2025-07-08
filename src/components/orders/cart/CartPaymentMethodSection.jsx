import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styles from '../../../pages/orders/Cart.module.css';
import { setSelectedPaymentMethod, setCoupayAmount } from '../../../store/paymentSlice';
import { TossPaymentWidget } from '../../payment/TossPaymentWidget';
import { logger } from '../../../utils/logger';

export default function CartPaymentMethodSection({ cartInfo = { totalPrice: 0 } }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    selectedPaymentType,
    selectedCardId,
    selectedAccountId,
    cards,
    accounts,
    coupayMoney,
    coupayAmount,
  } = useSelector(state => state.payment);
  
  // 고객 정보 가져오기 (실제로는 로그인된 사용자 정보를 사용해야 함)
  const customerInfo = useSelector(state => state.user?.currentUser) || {
    email: "customer@example.com",
    name: "고객",
    phone: "01012345678"
  };
  
  // cartInfo는 props로 받아옴

  // 드롭다운 상태
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // 쿠페이머니 입력 상태
  const [coupayInputValue, setCoupayInputValue] = useState(coupayAmount || 0);
  const [showCoupayDetails, setShowCoupayDetails] = useState(false);

  // cartInfo.totalPrice 변경 시 쿠페이머니 사용금액 자동 조정
  useEffect(() => {
    if (selectedPaymentType === 'coupay' && coupayAmount > 0) {
      const maxUsable = Math.min(coupayMoney, cartInfo.totalPrice || 0);
      const adjustedAmount = Math.min(coupayAmount, maxUsable);
      
      // 현재 사용금액이 최대 사용 가능 금액보다 크면 자동 조정
      if (coupayAmount > maxUsable) {
        setCoupayInputValue(adjustedAmount);
        dispatch(setCoupayAmount(adjustedAmount));
      }
    }
  }, [cartInfo.totalPrice, coupayMoney, coupayAmount, selectedPaymentType, dispatch]);

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
    {
      type: 'toss',
      label: '토스페이먼츠',
      value: '다양한 결제수단',
      disabled: false,
    },
  ];

  // 쿠페이머니 입력값 변경 처리
  const handleCoupayAmountChange = (value) => {
    const numValue = Math.max(0, Math.min(value, coupayMoney, cartInfo.totalPrice || 0));
    setCoupayInputValue(numValue);
    dispatch(setCoupayAmount(numValue));
  };

  // 전액사용 버튼
  const handleUseAllCoupay = () => {
    const maxUsable = Math.min(coupayMoney, cartInfo.totalPrice || 0);
    setCoupayInputValue(maxUsable);
    dispatch(setCoupayAmount(maxUsable));
  };

  // 대표 결제수단 라벨
  let selectedLabel = '';
  if (selectedPaymentType === 'coupay') {
    const usedAmount = coupayAmount || 0;
    const remainingAmount = Math.max(0, (cartInfo.totalPrice || 0) - usedAmount);
    selectedLabel = `쿠페이 머니 ${usedAmount.toLocaleString()}원 사용`;
    if (remainingAmount > 0) {
      selectedLabel += ` + 추가 결제 ${remainingAmount.toLocaleString()}원`;
    }
  } else if (selectedPaymentType === 'card') {
    const card = cards.find(c => c.id === selectedCardId) || cards[0];
    selectedLabel = card ? `${card.name} ****${card.last4}` : '카드 선택';
  } else if (selectedPaymentType === 'account') {
    const account = accounts.find(a => a.id === selectedAccountId) || accounts[0];
    selectedLabel = account ? `${account.bankName} ****${account.last4}` : '계좌 선택';
  } else if (selectedPaymentType === 'toss') {
    selectedLabel = '토스페이먼츠로 결제';
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
          <div className={styles.coupayContainer}>
            <div className={styles.coupayInfo}>
              <div className={styles.coupayBalance}>
                보유: {coupayMoney.toLocaleString()}원
              </div>
              <button 
                className={styles.coupayDetailButton}
                onClick={() => setShowCoupayDetails(!showCoupayDetails)}
                type="button"
              >
                {showCoupayDetails ? '간단히 보기' : '상세 설정'}
              </button>
            </div>
            
            {showCoupayDetails && (
              <div className={styles.coupayDetails}>
                <div className={styles.coupayInputGroup}>
                  <input
                    type="number"
                    value={coupayInputValue}
                    onChange={(e) => handleCoupayAmountChange(parseInt(e.target.value) || 0)}
                    min="0"
                    max={Math.min(coupayMoney, cartInfo.totalPrice || 0)}
                    className={styles.coupayInput}
                    placeholder="사용할 금액"
                  />
                  <span className={styles.coupayInputSuffix}>원 사용</span>
                  <button 
                    className={styles.useAllButton}
                    onClick={handleUseAllCoupay}
                    type="button"
                  >
                    전액사용
                  </button>
                </div>
                
                {(cartInfo.totalPrice || 0) > (coupayAmount || 0) && (
                  <div className={styles.additionalPaymentInfo}>
                    <span className={styles.additionalLabel}>추가 결제 필요:</span>
                    <span className={styles.additionalAmount}>
                      {((cartInfo.totalPrice || 0) - (coupayAmount || 0)).toLocaleString()}원
                    </span>
                    <div className={styles.additionalNote}>
                      (신용카드 또는 계좌이체로 결제됩니다)
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className={styles.coupaySelectedInfo}>{selectedLabel}</div>
          </div>
        )}
        
        {/* 토스페이먼츠 결제위젯 */}
        {(selectedPaymentType === 'toss') && (
          <div className={styles.tossContainer}>
            {/* 쿠폰 할인 정보 표시 */}
            {cartInfo.couponDiscount > 0 && (
              <div className={styles.tossDiscountInfo}>
                <span>쿠폰 할인: -{cartInfo.couponDiscount.toLocaleString()}원</span>
              </div>
            )}
            
            <TossPaymentWidget
              amount={{
                currency: "KRW",
                value: cartInfo.totalPrice || 0,
              }}
              orderId={`order_${Date.now()}`}
              orderName={`${cartInfo.itemCount}개 메뉴`}
              customerEmail={customerInfo.email}
              customerName={customerInfo.name}
              customerMobilePhone={customerInfo.phone}
              onPaymentSuccess={(result) => {
                logger.log('토스페이먼츠 결제 성공:', result);
                // 결제 성공 시 처리 로직
                window.location.href = `/payments/success?paymentKey=${result.paymentKey}&orderId=${result.orderId}&amount=${result.amount}`;
              }}
              onPaymentError={(error) => {
                logger.error('토스페이먼츠 결제 실패:', error);
                // 결제 실패 시 처리 로직
                window.location.href = `/payments/failure?code=${error.code}&message=${error.message}`;
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
