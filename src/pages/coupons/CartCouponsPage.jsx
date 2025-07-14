import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { applyCoupon, removeCoupon, selectNormalizedCoupons } from '../../store/couponSlice';
import BottomButton from '../../components/common/BottomButton';
import calculateCartTotal from '../../utils/calculateCartTotal';
import styles from './CartCouponsPage.module.css';
import { formatDiscountValue } from '../../utils/couponUtils';

export default function CartCouponsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentStore = useSelector(state => state.cart.currentStore);
  const myCoupons = useSelector(selectNormalizedCoupons);
  const selectedCouponIds = useSelector(state => state.coupon.selectedCouponIds);
  const orderMenus = useSelector(state => state.cart.orderMenus);

  // ✅ 여기 수정: Cart.jsx와 동일한 방식으로 cartTotal 계산
  const cartTotal = orderMenus.reduce((sum, m) => sum + calculateCartTotal(m), 0);

  const applicableCoupons = Array.isArray(myCoupons)
    ? myCoupons.filter(c =>
        (String(c.storeId) === String(currentStore.storeId) || c.storeId === null) && c.canUsed)
    : [];

  const handleSelect = (couponId) => {
    console.log('👉 handleSelect called', couponId, cartTotal);
    dispatch(applyCoupon({ couponId: String(couponId), cartTotal }));
  };

  const handleDeselect = (couponId) => {
    dispatch(removeCoupon({ couponId: String(couponId) }));
  };

  const handleConfirm = () => {
    navigate(-1);
  };

  const selectedCoupon = applicableCoupons.find(c =>
    selectedCouponIds.includes(String(c.id))
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>쿠폰 선택</h2>

      {applicableCoupons.length === 0 ? (
        <p className={styles.emptyMessage}>이 매장에서 사용할 수 있는 쿠폰이 없습니다.</p>
      ) : (
        <div className={styles.couponList}>
          {applicableCoupons.map(coupon => {
            const isSelected = selectedCouponIds.includes(String(coupon.id));
            return (
              <div
                key={coupon.id}
                className={`${styles.couponCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleSelect(coupon.id)}
              >
                <div className={styles.couponContent}>
                  <div className={styles.discountText}>
                    {coupon.discountValue}
                    {coupon.couponType === 'RATE' ? '% 할인' : '원 할인'}
                  </div>
                  <div className={styles.minOrderText}>
                    {coupon.minOrderAmount.toLocaleString()}원 이상 주문 시
                  </div>
                  <div className={styles.validDateText}>
                    {new Date(coupon.validDate).toLocaleDateString()}까지 사용 가능
                  </div>
                </div>
                <div className={styles.statusArea}>
                  {isSelected ? (
                    <span className={styles.appliedTag}>적용됨</span>
                  ) : (
                    <span className={styles.statusNormal}>사용 가능</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomButton
        onClick={handleConfirm}
        disabled={!selectedCoupon}
        className={styles.bottomButton}
        >
        {selectedCoupon
            ? `${formatDiscountValue(selectedCoupon.discountValue)} 쿠폰 적용하기`
            : '쿠폰 선택 후 적용하기'}
        </BottomButton>
    </div>
  );
}
