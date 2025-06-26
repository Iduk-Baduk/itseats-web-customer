// src/pages/Cart/Cart.jsx
import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateQuantity, removeMenu, selectRequestInfo } from "../../store/cartSlice";
import { addOrder, createOrderAsync } from "../../store/orderSlice";
import { 
  setPaymentProcessing, 
  setPaymentSuccess, 
  setPaymentError, 
  clearPaymentResult 
} from "../../store/paymentSlice";
import { paymentAPI } from "../../services";
import calculateCartTotal from "../../utils/calculateCartTotal";
import { createMenuOptionHash } from "../../utils/hashUtils";

import Header from "../../components/common/Header";
import DeliveryToggle from "../../components/orders/cart/DeliveryToggle";
import QuantityControl from "../../components/orders/cart/QuantityControl";
import RiderRequestBottomSheet from "../../components/orders/cart/RiderRequestBottomSheet";
import BottomButton from "../../components/common/BottomButton";
import Toast from "../../components/common/Toast";
import styles from "./Cart.module.css";
import CartAddressSection from '../../components/orders/cart/CartAddressSection';
import CartDeliveryOptionSection from '../../components/orders/cart/CartDeliveryOptionSection';
import CartMenuListSection from '../../components/orders/cart/CartMenuListSection';
import CartCouponSection from '../../components/orders/cart/CartCouponSection';
import CartPaymentSummarySection from '../../components/orders/cart/CartPaymentSummarySection';
import CartPaymentMethodSection from '../../components/orders/cart/CartPaymentMethodSection';
import CartRequestSection from '../../components/orders/cart/CartRequestSection';

// 더미 데이터 상수 (나중에 실제 데이터로 교체 예정)
const DUMMY_DATA = {
  storeName: "도미노피자 구름톤점", // TODO: 실제 매장 정보로 교체
  deliveryAddress: "경기 성남시 판교로 242 PDC A동 902호", // TODO: 선택된 주소로 교체
  destinationLocation: { lat: 37.501887, lng: 127.039252 }, // TODO: 실제 좌표로 교체
  storeLocation: { lat: 37.4979, lng: 127.0276 }, // TODO: 실제 매장 좌표로 교체
  storeImage: "/samples/food1.jpg" // TODO: 실제 매장 이미지로 교체
};

export default function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { storeId } = useParams(); // URL에서 storeId 추출
  const orderMenus = useSelector((state) => state.cart.orderMenus);
  const requestInfo = useSelector(selectRequestInfo);
  
  // Redux에서 쿠폰 정보 가져오기
  const coupons = useSelector(state => state.coupon.coupons);
  const selectedCouponIds = useSelector(state => state.coupon.selectedCouponIds);
  const appliedCoupons = coupons.filter(c => selectedCouponIds.includes(c.id));
  
  // Redux에서 주소 및 결제 정보 가져오기
  const selectedAddress = useSelector(state => 
    state.address.addresses.find(addr => addr.id === state.address.selectedAddressId)
  );
  const selectedPaymentType = useSelector(state => state.payment.selectedPaymentType);
  const selectedCardId = useSelector(state => state.payment.selectedCardId);
  const selectedAccountId = useSelector(state => state.payment.selectedAccountId);
  const isProcessingPayment = useSelector(state => state.payment.isProcessingPayment);
  const paymentError = useSelector(state => state.payment.paymentError);

  // 배달 옵션 및 배달비 상태 추가
  const [deliveryOption, setDeliveryOption] = useState({
    label: '무료배달',
    price: 0,
  });

  const [isDelivery, setIsDelivery] = useState("delivery");
  const [riderRequest, setRiderRequest] = useState("직접 받을게요 (부재 시 문 앞)");
  const [isRiderRequestSheetOpen, setRiderRequestSheetOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });

  // Toast 헬퍼 함수
  const showToast = (message) => {
    setToast({ show: true, message });
  };

  const hideToast = () => {
    setToast({ show: false, message: "" });
  };

  const handleQuantityChange = (menuId, menuOption, delta) => {
    const menuOptionHash = createMenuOptionHash(menuOption);
    dispatch(updateQuantity({ menuId, menuOptionHash, delta }));
  };

  const handleDelete = (menuId, menuOption) => {
    const menuOptionHash = createMenuOptionHash(menuOption);
    dispatch(removeMenu({ menuId, menuOptionHash }));
  };

  const handlePayment = async () => {
    // 현재 페이지의 storeId 추출
    const currentStoreId = storeId && !isNaN(parseInt(storeId)) ? parseInt(storeId) : null;
    
    if (!currentStoreId) {
      showToast("유효한 매장 정보가 없습니다.");
      return;
    }
    
    // 결제 수단 문자열 생성
    let paymentMethod = 'coupay'; // 기본값
    if (selectedPaymentType === 'card') {
      paymentMethod = 'card';
    } else if (selectedPaymentType === 'account') {
      paymentMethod = 'account';
    }

    // API 스펙에 맞는 주문 데이터 구조 생성
    const orderRequestData = {
      // 주문 기본 정보
      addrId: selectedAddress?.id || null,
      storeId: currentStoreId,
      orderMenus: orderMenus.map(menu => ({
        menuId: menu.menuId,
        menuName: menu.menuName,
        menuOptions: menu.menuOptions || [], // API 스펙에 맞는 구조 사용
        menuTotalPrice: calculateCartTotal(menu),
        quantity: menu.quantity
      })),
      coupons: selectedCouponIds.length > 0 ? selectedCouponIds : [],
      deliveryType: isDelivery === "delivery" ? "DEFAULT" : "ONLY_ONE"
    };

    // 서버로 전송할 최종 주문 데이터
    const finalOrderData = {
      // orderId는 서버에서 생성되어 응답으로 받음
      coupons: orderRequestData.coupons,
      totalCost: cartInfo.totalPrice,
      paymentMethod: paymentMethod,
      paymentStatus: "PENDING", // 결제 대기 상태
      storeRequest: requestInfo.storeRequest || "",
      riderRequest: requestInfo.deliveryRequest || "문 앞에 놔주세요 (초인종 O)",
      
      // 주문 상세 정보 (주문 생성 시 필요)
      orderDetails: orderRequestData
    };

    // 유효성 검사
    if (!selectedAddress) {
      showToast("배송 주소를 선택해 주세요.");
      return;
    }
    
    if (!paymentMethod) {
      showToast("결제 수단을 선택해 주세요.");
      return;
    }

    try {
      // 🔄 결제 처리 시작
      dispatch(setPaymentProcessing(true));
      dispatch(clearPaymentResult());

      // ✅ API를 통한 주문 생성 (서버 연동 준비)
      // 개발 중에는 로컬 저장소 사용, 배포 시 실제 API 사용
      const useLocalStorage = import.meta.env.VITE_MOCK_MODE === 'true';
      
      let orderResponse;
      
      if (useLocalStorage) {
        // 로컬 개발 환경: Redux로 주문 추가 (기존 데이터 구조 유지)
        const localOrderData = {
          ...finalOrderData,
          // 로컬 개발용 추가 필드들
          storeName: DUMMY_DATA.storeName,
          deliveryAddress: selectedAddress?.address || DUMMY_DATA.deliveryAddress,
          destinationLocation: DUMMY_DATA.destinationLocation,
          storeLocation: DUMMY_DATA.storeLocation,
          deliveryEta: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          menuSummary: orderMenus.map(menu => menu.menuName).join(", "),
          storeImage: DUMMY_DATA.storeImage,
          // Mock orderId 생성
          orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        dispatch(addOrder(localOrderData));
        orderResponse = { data: localOrderData };
      } else {
        // 실제 환경: API를 통한 주문 생성
        orderResponse = await dispatch(createOrderAsync(finalOrderData)).unwrap();
        console.log("주문 생성 성공:", orderResponse);
      }

      // 💳 실제 결제 처리 (Mock 모드에서도 테스트)
      const paymentData = {
        orderId: orderResponse.data.orderId,
        paymentMethod: paymentMethod,
        amount: cartInfo.totalPrice,
        cardId: selectedPaymentType === 'card' ? selectedCardId : null,
        accountId: selectedPaymentType === 'account' ? selectedAccountId : null,
        customerInfo: {
          address: selectedAddress
        }
      };

      console.log('💳 결제 처리 시작:', paymentData);
      
      // 결제 API 호출 (Mock 모드에서는 시뮬레이션)
      if (useLocalStorage) {
        // Mock 결제 처리 (2초 지연)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 90% 확률로 성공
        if (Math.random() > 0.1) {
          const mockPaymentResult = {
            paymentId: `payment_${Date.now()}`,
            status: 'SUCCESS',
            amount: paymentData.amount,
            method: paymentData.paymentMethod,
            timestamp: new Date().toISOString()
          };
          
          dispatch(setPaymentSuccess(mockPaymentResult));
          console.log('✅ Mock 결제 성공:', mockPaymentResult);
        } else {
          throw new Error('결제가 거절되었습니다. (Mock 테스트)');
        }
      } else {
        // 실제 결제 API 호출
        const paymentResult = await paymentAPI.processPayment(paymentData);
        dispatch(setPaymentSuccess(paymentResult));
        console.log('✅ 실제 결제 성공:', paymentResult);
      }
      
      // 🎉 결제 성공 시 주문 상태 페이지로 이동
      navigate("/orders/status");
      
    } catch (error) {
      console.error("❌ 주문/결제 실패:", error);
      
      // 결제 실패 상태 업데이트
      dispatch(setPaymentError(error.message || '주문 처리 중 오류가 발생했습니다.'));
      
      // 사용자에게 에러 알림
      showToast(`결제 실패: ${error.message || '주문 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'}`);
    }
  };

  // ✅ 실시간 계산 (구조 B 방식) - useMemo로 성능 최적화
  const cartInfo = useMemo(() => {
    const totalCouponDiscount = appliedCoupons.reduce((sum, coupon) => sum + coupon.discount, 0);
    
    return {
      orderPrice: orderMenus.reduce(
        (sum, m) => sum + calculateCartTotal(m),
        0
      ),
      totalPrice: Math.max(0, orderMenus.reduce(
        (sum, m) => sum + calculateCartTotal(m),
        0
      ) + (deliveryOption.price || 0) - totalCouponDiscount), // 다중 쿠폰 할인 적용
      itemCount: orderMenus.reduce((sum, m) => sum + m.quantity, 0),
      deliveryFee: deliveryOption.price || 0,
      deliveryLabel: deliveryOption.label,
      couponDiscount: totalCouponDiscount, // 다중 쿠폰 할인 총합
    };
  }, [orderMenus, deliveryOption, appliedCoupons]);

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
            disabled={orderMenus.length === 0 || isProcessingPayment}
            cartInfo={cartInfo}
            loading={isProcessingPayment}
            loadingText="결제 처리 중..."
          />
          <RiderRequestBottomSheet
            request={riderRequest}
            isOpen={isRiderRequestSheetOpen}
            onClose={() => setRiderRequestSheetOpen(false)}
            onSelect={(request) => setRiderRequest(request)}
          />
        </>
      )}
      {toast.show && (
        <Toast
          message={toast.message}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
