// src/pages/Cart/Cart.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateQuantity, removeMenu } from "../../store/cartSlice";
import calculateCartTotal from "../../utils/calculateCartTotal";
import { createMenuOptionHash } from "../../utils/hashUtils";

import Header from "../../components/common/Header";
import DeliveryToggle from "../../components/orders/cart/DeliveryToggle";
import QuantityControl from "../../components/orders/cart/QuantityControl";
import RiderRequestBottomSheet from "../../components/orders/cart/RiderRequestBottomSheet";
import BottomButton from "../../components/common/BottomButton";
import styles from "./Cart.module.css";
import CartAddressSection from '../../components/orders/cart/CartAddressSection';
import CartDeliveryOptionSection from '../../components/orders/cart/CartDeliveryOptionSection';
import CartMenuListSection from '../../components/orders/cart/CartMenuListSection';
import CartCouponSection from '../../components/orders/cart/CartCouponSection';
import CartPaymentSummarySection from '../../components/orders/cart/CartPaymentSummarySection';
import CartPaymentMethodSection from '../../components/orders/cart/CartPaymentMethodSection';
import CartRequestSection from '../../components/orders/cart/CartRequestSection';

export default function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const orderMenus = useSelector((state) => state.cart.orderMenus);

  // 배달 옵션 및 배달비 상태 추가
  const [deliveryOption, setDeliveryOption] = useState({
    label: '무료배달',
    price: 0,
  });

  const [isDelivery, setIsDelivery] = useState("delivery");
  const [riderRequest, setRiderRequest] = useState("직접 받을게요 (부재 시 문 앞)");
  const [isRiderRequestSheetOpen, setRiderRequestSheetOpen] = useState(false);

  const handleQuantityChange = (menuId, menuOption, delta) => {
    const menuOptionHash = createMenuOptionHash(menuOption);
    dispatch(updateQuantity({ menuId, menuOptionHash, delta }));
  };

  const handleDelete = (menuId, menuOption) => {
    const menuOptionHash = createMenuOptionHash(menuOption);
    dispatch(removeMenu({ menuId, menuOptionHash }));
  };

  const handlePayment = () => {
    alert("결제 페이지로 이동 예정!");
  };

  // ✅ 실시간 계산 (구조 B 방식) - useMemo로 성능 최적화
  const cartInfo = useMemo(() => ({
    orderPrice: orderMenus.reduce(
      (sum, m) => sum + m.menuPrice * m.quantity,
      0
    ),
    totalPrice: orderMenus.reduce(
      (sum, m) => sum + calculateCartTotal(m),
      0
    ) + (deliveryOption.price || 0), // 배달비 포함
    itemCount: orderMenus.reduce((sum, m) => sum + m.quantity, 0),
    deliveryFee: deliveryOption.price || 0,
    deliveryLabel: deliveryOption.label,
  }), [orderMenus, deliveryOption]);

  return (
    <div className={styles.container}>
      {orderMenus.length === 0 ? (
        <div className={styles.emptyCart} style={{padding: '80px 0', textAlign: 'center', fontSize: '16px', color: '#888'}}>
          카트가 비어있습니다.
        </div>
      ) : (
        <>
          <CartAddressSection />
          <CartDeliveryOptionSection
            selected={deliveryOption}
            onChange={setDeliveryOption}
          />
          <CartMenuListSection />
          <CartCouponSection />
          <CartPaymentSummarySection cartInfo={cartInfo} />
          <CartPaymentMethodSection />
          <CartRequestSection />
          <Header
            title=""
            leftIcon="close"
            rightIcon={null}
            leftButtonAction={() => navigate(-1)}
          />
          <span className={styles.fixed}>
            <DeliveryToggle onChange={(value) => setIsDelivery(value)} />
          </span>
          <BottomButton
            onClick={handlePayment}
            disabled={orderMenus.length === 0}
            cartInfo={cartInfo}
          />
          <RiderRequestBottomSheet
            request={riderRequest}
            isOpen={isRiderRequestSheetOpen}
            onClose={() => setRiderRequestSheetOpen(false)}
            onSelect={(request) => setRiderRequest(request)}
          />
        </>
      )}
    </div>
  );
}
