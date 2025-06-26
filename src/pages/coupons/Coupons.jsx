import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { applyCoupon, clearAllCoupons, selectNormalizedCoupons } from "../../store/couponSlice";
import calculateCartTotal from "../../utils/calculateCartTotal";
import { getCouponDisplayText, validateCoupon, isCouponStackable, calculateMultipleCouponsDiscount } from "../../utils/couponUtils";
import styles from "./Coupons.module.css";
import Header from "../../components/common/Header";
import BottomButton from "../../components/common/BottomButton";

export default function Coupons() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const coupons = useSelector(selectNormalizedCoupons);
  const orderMenus = useSelector(state => state.cart.orderMenus);
  const selectedCouponIds = useSelector(state => state.coupon.selectedCouponIds);
  const fromCart = location.state && location.state.from === 'cart';

  // 임시 선택된 쿠폰 상태 (실제 적용 전)
  const [tempSelectedCouponIds, setTempSelectedCouponIds] = React.useState([...selectedCouponIds]);

  // selectedCouponIds가 변경될 때 임시 상태도 동기화
  React.useEffect(() => {
    setTempSelectedCouponIds([...selectedCouponIds]);
  }, [selectedCouponIds]);

  // 장바구니 총액 계산
  const cartTotal = orderMenus.reduce((sum, menu) => sum + calculateCartTotal(menu), 0);
  const deliveryFee = 2500; // 기본 배달비

  // 유효기간 포맷팅 함수
  const formatValidDate = (validDate) => {
    if (!validDate) return '유효기간 없음';
    
    try {
      const date = new Date(validDate);
      const now = new Date();
      const isExpired = now > date;
      
      const formatted = date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      return {
        text: `${formatted}까지`,
        isExpired,
        style: isExpired ? { color: '#ff4444', fontWeight: 'bold' } : { color: '#666' }
      };
    } catch (error) {
      return {
        text: '유효기간 오류',
        isExpired: true,
        style: { color: '#ff4444' }
      };
    }
  };

  // 쿠폰 사용 가능 여부 체크 (임시 선택 기준)
  const isCouponUsable = (coupon) => {
    const validationResult = validateCoupon(coupon, cartTotal);
    if (!validationResult.isValid) return false;

    // 임시 선택된 쿠폰은 항상 사용 가능 (해제를 위해)
    const isSelected = tempSelectedCouponIds.includes(coupon.id);
    if (isSelected) return true;

    // 이미 선택된 쿠폰이 있는 경우 중복 로직 확인
    if (tempSelectedCouponIds.length > 0) {
      const selectedCoupons = coupons.filter(c => tempSelectedCouponIds.includes(c.id));
      const hasNonStackable = selectedCoupons.some(c => !isCouponStackable(c));
      
      // 이미 비중복 쿠폰이 선택되어 있으면 다른 쿠폰 선택 불가
      if (hasNonStackable) return false;
      
      // 현재 쿠폰이 비중복이면 다른 쿠폰이 이미 있을 때 선택 불가
      if (!isCouponStackable(coupon) && tempSelectedCouponIds.length > 0) return false;
    }

    return true;
  };

  // 쿠폰 임시 선택/해제 처리
  const handleToggleCoupon = (couponId) => {
    // console.log('🎫 쿠폰 임시 선택/해제:', couponId);
    
    setTempSelectedCouponIds(prev => {
      const newSelection = prev.includes(couponId)
        ? prev.filter(id => id !== couponId)
        : [...prev, couponId];
      
      return newSelection;
    });
  };

  // 실제 쿠폰 적용 및 카트로 이동
  const handleApplyCoupons = () => {
    // console.log('🎫 쿠폰 적용 및 카트 이동:', tempSelectedCouponIds);

    const cartTotal = calculateTotal();
    
    if (tempSelectedCouponIds.length > 0) {
      // 선택된 쿠폰들을 모두 적용
      dispatch(applyCoupons({ 
        couponIds: tempSelectedCouponIds,
        cartTotal: cartTotal
      }));
    } else {
      // 선택된 쿠폰이 없으면 모든 쿠폰 해제
      dispatch(removeAllCoupons());
    }
    
    navigate('/cart');
  };

  // 쿠폰 적용하지 않고 카트로 이동
  const handleGoToCartOnly = () => {
    // console.log('🎫 쿠폰 적용하지 않고 카트 이동');
    navigate('/cart');
  };

  // 임시 선택된 쿠폰들의 할인 금액 계산
  const tempSelectedCoupons = coupons.filter(c => tempSelectedCouponIds.includes(c.id));
  const discountResult = calculateMultipleCouponsDiscount(tempSelectedCoupons, cartTotal, deliveryFee);
  
  // 바텀 버튼 텍스트 결정
  const getBottomButtonText = () => {
    if (tempSelectedCouponIds.length === 0) {
      return '쿠폰 적용 안함';
    } else {
      return `${discountResult.totalDiscount.toLocaleString()}원 쿠폰 적용하기`;
    }
  };

  return (
    <div className={styles.container}>
      <Header
        title="할인 쿠폰"
        leftButtonAction={() => {
          navigate(-1);
        }}
        rightIcon=""
      />
      {coupons.length === 0 ? (
        <p className={styles.empty}>보유한 쿠폰이 없습니다.</p>
      ) : (
        <ul className={styles.couponList}>
          {coupons.map((coupon) => {
            const validDateInfo = formatValidDate(coupon.validDate);
            const isUsable = isCouponUsable(coupon);
            const validationResult = validateCoupon(coupon, cartTotal);
            const isSelected = tempSelectedCouponIds.includes(coupon.id);
            
            return (
              <li key={coupon.id} className={`${styles.couponCard} ${!isUsable ? styles.disabled : ''} ${isSelected ? styles.selected : ''}`}>
                <div className={styles.couponInfo}>
                  <p className={styles.amount}>
                    {getCouponDisplayText(coupon, cartTotal, deliveryFee)}
                    {isCouponStackable(coupon) && (
                      <span className={styles.stackableTag}>중복가능</span>
                    )}
                  </p>
                  <span className={styles.tag}>{coupon.type}</span>
                  <p className={styles.desc}>
                    {coupon.name}
                    {coupon.minOrderAmount > 0 && (
                      <span style={{ color: cartTotal >= coupon.minOrderAmount ? '#2196f3' : '#ff4444' }}>
                        {' '}(최소 {coupon.minOrderAmount.toLocaleString()}원)
                      </span>
                    )}
                    {coupon.maxDiscount && coupon.type === 'percentage' && (
                      <span style={{ color: '#888', fontSize: '13px' }}>
                        {' '}최대 {coupon.maxDiscount.toLocaleString()}원
                      </span>
                    )}
                  </p>
                  <p className={styles.date} style={validDateInfo.style}>
                    📅 {validDateInfo.text}
                  </p>
                  
                  {/* 상태 정보 */}
                  <div className={styles.statusInfo}>
                    {coupon.isUsed && <span style={{ color: '#ff4444' }}>🚫 이미 사용됨</span>}
                    {coupon.isExpired && <span style={{ color: '#ff4444' }}>⏰ 만료됨</span>}
                    {validDateInfo.isExpired && <span style={{ color: '#ff4444' }}>📅 유효기간 만료</span>}
                    {fromCart && !validationResult.isValid && (
                      <span style={{ color: '#ff4444' }}>
                        💰 {validationResult.reason}
                      </span>
                    )}
                    {fromCart && tempSelectedCouponIds.length > 0 && !isCouponStackable(coupon) && !isSelected && (
                      <span style={{ color: '#ff4444' }}>
                        🚫 중복 불가 (다른 쿠폰과 함께 사용 불가)
                      </span>
                    )}
                    {isUsable && <span style={{ color: '#4caf50' }}>✅ 사용 가능</span>}
                    {isSelected && <span style={{ color: '#2196f3' }}>🎯 선택됨</span>}
                  </div>
                </div>
                {fromCart ? (
                  <button
                    className={styles.linkBtn}
                    onClick={() => handleToggleCoupon(coupon.id)}
                    disabled={!isUsable}
                    style={{ 
                      opacity: isUsable ? 1 : 0.5,
                      cursor: isUsable ? 'pointer' : 'not-allowed',
                      backgroundColor: isSelected ? '#2196f3' : undefined,
                      color: isSelected ? 'white' : undefined
                    }}
                  >
                    {isSelected ? '선택됨' : isUsable ? '선택하기' : '사용 불가'}
                  </button>
                ) : (
                  <button
                    className={styles.linkBtn}
                    onClick={() => navigate(`/stores/${coupon.storeId}`)}
                  >
                    →<br />
                    적용가능<br />
                    매장보기
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      
      {/* 바텀 버튼 - 장바구니에서 온 경우에만 표시 */}
      {fromCart && (
        <BottomButton
          onClick={tempSelectedCouponIds.length > 0 ? handleApplyCoupons : handleGoToCartOnly}
        >
          {getBottomButtonText()}
        </BottomButton>
      )}
    </div>
  );
}
