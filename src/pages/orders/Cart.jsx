// src/pages/Cart/Cart.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateQuantity, removeMenu, selectRequestInfo } from "../../store/cartSlice";
import { addOrder } from "../../store/orderSlice";
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
  const requestInfo = useSelector(selectRequestInfo);
  
  // Redux에서 쿠폰 정보 가져오기
  const coupons = useSelector(state => state.coupon.coupons);
  const selectedCouponId = useSelector(state => state.coupon.selectedCouponId);
  const appliedCoupon = coupons.find(c => c.id === selectedCouponId);

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
    // 주문 데이터 생성
    const orderData = {
      storeName: "도미노피자 구름톤점", // 실제로는 선택된 매장 정보로 설정
      orderPrice: cartInfo.totalPrice,
      orderMenuCount: cartInfo.itemCount,
      deliveryAddress: "경기 성남시 판교로 242 PDC A동 902호", // 실제로는 선택된 주소로 설정
      destinationLocation: { lat: 37.501887, lng: 127.039252 },
      storeLocation: { lat: 37.4979, lng: 127.0276 },
      deliveryEta: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      menuSummary: orderMenus.map(menu => menu.menuName).join(", "),
      storeImage: "/samples/food1.jpg",
      // 요청사항 데이터 포함
      storeRequest: requestInfo.storeRequest,
      deliveryRequest: requestInfo.deliveryRequest,
      disposableChecked: requestInfo.disposableChecked,
      // 배달/포장 옵션 포함
      isDelivery,
      deliveryOption: deliveryOption.label,
      deliveryFee: deliveryOption.price,
      // 쿠폰 정보 포함
      appliedCouponId: selectedCouponId,
      couponDiscount: appliedCoupon ? appliedCoupon.discount : 0,
      // 주문 메뉴 정보
      orderMenus: orderMenus.map(menu => ({
        ...menu,
        menuOptionHash: createMenuOptionHash(menu.menuOption)
      })),
    };

    // Redux에 주문 추가
    dispatch(addOrder(orderData));
    
    // 주문 상태 페이지로 이동
    navigate("/orders/status");
  };

  // ✅ 실시간 계산 (구조 B 방식) - useMemo로 성능 최적화
  const cartInfo = useMemo(() => ({
    orderPrice: orderMenus.reduce(
      (sum, m) => sum + calculateCartTotal(m),
      0
    ),
    totalPrice: Math.max(0, orderMenus.reduce(
      (sum, m) => sum + calculateCartTotal(m),
      0
    ) + (deliveryOption.price || 0) - (appliedCoupon ? appliedCoupon.discount : 0)), // Redux에서 쿠폰 할인 가져오기
    itemCount: orderMenus.reduce((sum, m) => sum + m.quantity, 0),
    deliveryFee: deliveryOption.price || 0,
    deliveryLabel: deliveryOption.label,
    couponDiscount: appliedCoupon ? appliedCoupon.discount : 0, // Redux에서 쿠폰 할인 가져오기
  }), [orderMenus, deliveryOption, appliedCoupon]);

  return (
    <div className={styles.container}>
      {orderMenus.length === 0 ? (
        <div className={styles.emptyCart}>
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
