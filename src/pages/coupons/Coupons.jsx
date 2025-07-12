import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearAllCoupons, applyCoupons, selectNormalizedCoupons, fetchCoupons } from "../../store/couponSlice";
import calculateCartTotal from "../../utils/calculateCartTotal";
import { getCouponDisplayText, validateCoupon, isCouponStackable, calculateMultipleCouponsDiscount } from "../../utils/couponUtils";
import styles from "./Coupons.module.css";
import Header from "../../components/common/Header";
import BottomButton from "../../components/common/BottomButton";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function Coupons() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const coupons = useSelector(selectNormalizedCoupons);
  const orderMenus = useSelector(state => state.cart.orderMenus);
  const selectedCouponIds = useSelector(state => state.coupon.selectedCouponIds);
  const currentStore = useSelector(state => state.store.currentStore);
  const couponLoading = useSelector(state => state.coupon.loading);
  const couponError = useSelector(state => state.coupon.error);
  const fromCart = location.state && location.state.from === 'cart';

  // 선택된 쿠폰 상태 (실제 적용 전) - fromCart일 때만 기존 선택 상태 반영
  const [tempSelectedCouponIds, setTempSelectedCouponIds] = React.useState(
    fromCart ? [...selectedCouponIds] : []
  );
  
  // 쿠폰 코드 입력 상태
  const [couponCode, setCouponCode] = React.useState('');

  // 쿠폰 데이터 로드
  React.useEffect(() => {
    if (coupons.length === 0 && !couponLoading) {
      dispatch(fetchCoupons());
    }
  }, [dispatch, coupons.length, couponLoading]);

  // selectedCouponIds가 변경될 때 상태 동기화 (fromCart일 때만)
  React.useEffect(() => {
    if (fromCart) {
      setTempSelectedCouponIds([...selectedCouponIds]);
    } else {
      setTempSelectedCouponIds([]); // 마이페이지에서 온 경우 선택 상태 초기화
    }
  }, [selectedCouponIds, fromCart]);

  // 장바구니 총액 계산
  const cartTotal = orderMenus.reduce((sum, menu) => sum + calculateCartTotal(menu), 0);
  const deliveryFee = currentStore?.deliveryFee || 0;

  // 사용되지 않은 쿠폰만 필터링 (사용된 쿠폰은 숨김)
  const availableCoupons = coupons.filter(coupon => !coupon.isUsed);

  // 유효기간 포맷팅 함수
  const formatValidDate = (validDate) => {
    if (!validDate) return '유효기간 없음';
    
    try {
      const date = new Date(validDate);
      const formatted = date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
      
      return `${formatted}까지 사용가능`;
    } catch (error) {
      return '유효기간 오류';
    }
  };

  // 쿠폰 타입별 한글 라벨
  const getCouponTypeLabel = (type) => {
    switch(type) {
      case 'delivery': return '배달';
      case 'general': return '포장';
      case 'percentage': return '배달·포장';
      default: return '쿠폰';
    }
  };

  // 쿠폰 사용 가능 여부 체크
  const isCouponUsable = (coupon) => {
    if (!fromCart) {
      // 마이페이지에서 온 경우: 카트 금액과 독립적으로 쿠폰 자체의 유효성만 확인
      // 만료 여부, 유효기간만 체크하고 최소 주문 금액은 무시 (isUsed는 이미 필터링됨)
      if (coupon.isExpired) return false;
      
      // 유효기간 확인
      if (coupon.validDate) {
        const validDate = new Date(coupon.validDate);
        const now = new Date();
        if (now > validDate) return false;
      }
      
      return true; // 마이페이지에서는 기본적으로 모든 유효한 쿠폰을 사용 가능으로 표시
    }

    // fromCart인 경우: 기존 로직 유지 (카트 금액 고려)
    const validationResult = validateCoupon(coupon, cartTotal);
    if (!validationResult.isValid) return false;

    // 선택된 쿠폰은 항상 사용 가능 (해제를 위해)
    const isSelected = tempSelectedCouponIds.includes(coupon.id);
    if (isSelected) return true;

    // 이미 선택된 쿠폰이 있는 경우 중복 로직 확인
    if (tempSelectedCouponIds.length > 0) {
      const selectedCoupons = availableCoupons.filter(c => tempSelectedCouponIds.includes(c.id));
      const hasNonStackable = selectedCoupons.some(c => !isCouponStackable(c));
      
      // 이미 비중복 쿠폰이 선택되어 있으면 다른 쿠폰 선택 불가
      if (hasNonStackable) return false;
      
      // 현재 쿠폰이 비중복이면 다른 쿠폰이 이미 있을 때 선택 불가
      if (!isCouponStackable(coupon) && tempSelectedCouponIds.length > 0) return false;
    }

    return true;
  };

  // 쿠폰 선택/해제 처리 (fromCart일 때만)
  const handleToggleCoupon = (couponId) => {
    if (fromCart) {
      setTempSelectedCouponIds(prev => {
        const newSelection = prev.includes(couponId)
          ? prev.filter(id => id !== couponId)
          : [...prev, couponId];
        
        return newSelection;
      });
    }
  };

  // 적용가능 매장보기 (마이페이지에서 온 경우)
  const handleViewAvailableStores = () => {
    // 홈 페이지로 이동 (추후 매장 목록이나 검색 페이지로 변경 가능)
    navigate('/');
  };

  // 실제 쿠폰 적용 및 카트로 이동
  const handleApplyCoupons = () => {
    if (tempSelectedCouponIds.length > 0) {
      // 선택된 쿠폰들을 모두 적용
      dispatch(applyCoupons({ 
        couponIds: tempSelectedCouponIds,
        cartTotal: cartTotal
      }));
    } else {
      // 선택된 쿠폰이 없으면 모든 쿠폰 해제
      dispatch(clearAllCoupons());
    }
    
    navigate('/cart');
  };

  // 선택된 쿠폰들의 할인 금액 계산 (사용 가능한 쿠폰만 대상)
  const tempSelectedCoupons = availableCoupons.filter(c => tempSelectedCouponIds.includes(c.id));
  const discountResult = calculateMultipleCouponsDiscount(tempSelectedCoupons, cartTotal, deliveryFee);
  
  // 바텀 버튼 텍스트 결정
  const getBottomButtonText = () => {
    if (tempSelectedCouponIds.length === 0) {
      return '쿠폰 적용 안함';
    } else {
      return `${discountResult.totalDiscount.toLocaleString()}원 쿠폰 적용하기`;
    }
  };

  // 로딩 상태
  if (couponLoading) {
    return (
      <div className={styles.container}>
        <Header
          title="할인쿠폰"
          leftIcon="back"
          leftButtonAction={() => navigate(-1)}
          rightIcon="history"
          rightButtonAction={() => navigate('/coupons/history')}
        />
        <LoadingSpinner message="쿠폰을 불러오는 중..." />
      </div>
    );
  }

  // 에러 상태
  if (couponError) {
    return (
      <div className={styles.container}>
        <Header
          title="할인쿠폰"
          leftIcon="back"
          leftButtonAction={() => navigate(-1)}
          rightIcon="history"
          rightButtonAction={() => navigate('/coupons/history')}
        />
        <EmptyState
          variant="error"
          icon="❌"
          title="쿠폰을 불러올 수 없습니다"
          description="잠시 후 다시 시도해주세요"
          actionText="다시 시도"
          onAction={() => dispatch(fetchCoupons())}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header
        title="할인쿠폰"
        leftIcon="back"
        leftButtonAction={() => navigate(-1)}
        rightIcon="history"
        rightButtonAction={() => navigate('/coupons/history')}
      />

      {/* 쿠폰 코드 입력 */}
      <div className={styles.couponInputSection}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            placeholder="쿠폰 번호를 입력하세요 (8, 16자리)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className={styles.couponInput}
          />
        </div>
      </div>

      {availableCoupons.length === 0 ? (
        <EmptyState
          variant="default"
          icon="🎫"
          title="보유한 쿠폰이 없습니다"
          description="주문 완료 후 쿠폰을 받아보세요"
          actionText="쇼핑하러 가기"
          onAction={() => navigate('/')}
        />
      ) : (
        <>
          <ul className={styles.couponList}>
            {availableCoupons.map((coupon) => {
              const validDateInfo = formatValidDate(coupon.validDate);
              const isUsable = isCouponUsable(coupon);
              const isSelected = tempSelectedCouponIds.includes(coupon.id);
              
              return (
                <li key={coupon.id} className={`${styles.couponCard} ${!isUsable ? styles.disabled : ''} ${isSelected ? styles.selected : ''}`}>
                  <div className={styles.couponInfo}>
                    <div className={styles.couponAmount}>
                      {getCouponDisplayText(coupon, cartTotal, deliveryFee)}
                    </div>
                    
                    <div className={styles.couponTag}>
                      {getCouponTypeLabel(coupon.type)}
                    </div>
                    
                    <div className={styles.couponName}>
                      {coupon.name}
                    </div>
                    
                    <div className={styles.couponCondition}>
                      {coupon.minOrderAmount > 0 && (
                        <span>{coupon.minOrderAmount.toLocaleString()}원 이상 주문 시</span>
                      )}
                    </div>
                    
                    <div className={styles.couponDate}>
                      {validDateInfo}
                    </div>
                  </div>
                  
                  <div className={styles.couponAction}>
                    {fromCart ? (
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleToggleCoupon(coupon.id)}
                        disabled={!isUsable}
                      >
                        {isSelected ? '선택됨' : '선택'}
                      </button>
                    ) : (
                      // 마이페이지에서 온 경우 - 항상 "적용가능 매장보기"
                      <button
                        className={styles.actionBtn}
                        onClick={handleViewAvailableStores}
                        disabled={!isUsable}
                      >
                        적용가능<br/>매장보기
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* 바텀 버튼 - 카트에서 온 경우에만 표시 */}
          {fromCart && (
            <div style={{ paddingBottom: '80px' }}>
              <BottomButton onClick={handleApplyCoupons}>
                {getBottomButtonText()}
              </BottomButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
