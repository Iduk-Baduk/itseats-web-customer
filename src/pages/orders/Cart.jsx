// src/pages/Cart/Cart.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateQuantity, removeMenu, selectRequestInfo, selectCurrentStore, updateCurrentStore } from "../../store/cartSlice";
import { addOrder, createOrderAsync } from "../../store/orderSlice";
import { 
  setPaymentProcessing, 
  setPaymentSuccess, 
  setPaymentError, 
  clearPaymentResult 
} from "../../store/paymentSlice";
import { fetchCoupons } from "../../store/couponSlice";
import { fetchPaymentMethods } from "../../store/paymentSlice";
import { fetchStores, fetchStoreById } from "../../store/storeSlice";
import { paymentAPI, tossPaymentAPI, orderAPI } from "../../services";
import { TossPaymentWidget } from "../../components/payment/TossPaymentWidget";
import calculateCartTotal from "../../utils/calculateCartTotal";
import { createMenuOptionHash } from "../../utils/hashUtils";
import { calculateCouponDiscount, calculateMultipleCouponsDiscount } from "../../utils/couponUtils";
import { generateOrderId } from "../../utils/idUtils";
import { logger } from "../../utils/logger";
import { findOrCreateStoreInfo } from "../../utils/storeUtils";
import { ENV_CONFIG } from '../../config/api';
import AuthService from '../../services/authService';

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
import EmptyState from '../../components/common/EmptyState';
import { ORDER_STATUS } from '../../constants/orderStatus';

export default function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { storeId } = useParams(); // URL에서 storeId 추출
  
  // 매장 정보를 Redux에서 가져오기
  const currentStore = useSelector(state => state.cart.currentStore);
  const allStores = useSelector(state => state.store?.stores || []);
  
  const orderMenus = useSelector((state) => state.cart.orderMenus);
  const orders = useSelector(state => state.order?.orders || []); // 주문 목록 추가
  
  // AuthService를 사용하여 사용자 정보 가져오기
  const user = AuthService.getUserInfo();
  
  // 현재 매장 정보 찾기 (Redux cart에서 우선, 없으면 전체 매장 목록에서 검색)
  const storeInfo = currentStore || allStores.find(store => 
    String(store.storeId) === String(storeId)
  ) || (orderMenus.length > 0 && orderMenus[0]?.storeId && allStores.find(store => 
    String(store.storeId) === String(orderMenus[0].storeId)
  ));
  const requestInfo = useSelector(selectRequestInfo);
  
  // Redux에서 쿠폰 정보 가져오기
  const coupons = useSelector(state => state.coupon.coupons);
  const selectedCouponIds = useSelector(state => state.coupon.selectedCouponIds);
  // coupons가 배열이 아닐 경우 빈 배열로 대체
  const couponsArray = Array.isArray(coupons) ? coupons : [];
  const appliedCoupons = couponsArray.filter(c => selectedCouponIds.includes(c.id));
  
  // Redux에서 주소 및 결제 정보 가져오기
  const selectedAddress = useSelector(state => 
    state.address.addresses.find(addr => addr.id === state.address.selectedAddressId)
  );
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
  
  // 토스 결제 위젯 상태
  const [showTossWidget, setShowTossWidget] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  // ✅ 실시간 계산 (구조 B 방식) - useMemo로 성능 최적화
  const cartInfo = useMemo(() => {
    const orderPrice = orderMenus.reduce((sum, m) => sum + calculateCartTotal(m), 0);
    const deliveryFee = deliveryOption.price || 0;
    
    // 다중 쿠폰 할인 계산 (주문금액과 배달비 분리)
    const discountResult = calculateMultipleCouponsDiscount(appliedCoupons, orderPrice, deliveryFee);
    
    return {
      orderPrice,
      totalPrice: Math.max(0, orderPrice + deliveryFee - discountResult.totalDiscount),
      itemCount: orderMenus.reduce((sum, m) => sum + m.quantity, 0),
      deliveryFee,
      deliveryLabel: deliveryOption.label,
      couponDiscount: discountResult.totalDiscount,
      orderDiscount: discountResult.orderDiscount,
      deliveryDiscount: discountResult.deliveryDiscount,
    };
  }, [orderMenus, deliveryOption, appliedCoupons]);

  // Toast 헬퍼 함수 강화
  const showToast = (message, duration = 4000) => {
    // 기존 Toast 숨기기
    setToast({ show: false, message: "" });
    
    // 잠시 후 새 Toast 표시 (중복 방지)
    setTimeout(() => {
      setToast({ show: true, message });
      logger.log('🍞 Toast 표시:', message);
      
      // 자동 숨김
      setTimeout(() => {
        setToast({ show: false, message: "" });
      }, duration);
    }, 100);
  };

  const hideToast = () => {
    setToast({ show: false, message: "" });
  };

  // 토스 결제 위젯 콜백 함수들
  const handlePaymentSuccess = async (paymentResult) => {
    try {
      logger.log('✅ 토스 결제 위젯 성공:', paymentResult);
      
      // 4단계: 백엔드에 결제 승인 요청
      logger.log('📡 Step 4: 백엔드 결제 승인 요청');
      const confirmRes = await tossPaymentAPI.confirmPayment(paymentData.backendPaymentId, {
        TossPaymentKey: paymentResult.paymentKey,
        TossOrderId: paymentData.backendOrderId, // 백엔드 주문 ID 사용
        amount: paymentResult.totalAmount
      });
      
      logger.log('✅ 백엔드 결제 승인 성공:', confirmRes);
      
      // 토스 위젯 닫기
      setShowTossWidget(false);
      setPaymentData(null);
      
      // 결제 성공 후 페이지 이동
      showToast('결제가 성공적으로 완료되었습니다!');
      navigate('/payments/toss-success');
      
    } catch (error) {
      logger.error('❌ 백엔드 결제 승인 실패:', error);
      showToast(`결제 승인 실패: ${error.message}`);
      setShowTossWidget(false);
      setPaymentData(null);
    }
  };

  const handlePaymentError = (error) => {
    logger.error('❌ 토스 결제 위젯 실패:', error);
    
    // 토스 위젯 닫기
    setShowTossWidget(false);
    setPaymentData(null);
    
    // 결제 실패 시 처리
    if (error.message.includes('PAY_PROCESS_CANCELED')) {
      showToast('결제가 취소되었습니다.');
    } else {
      showToast(`결제 실패: ${error.message}`);
    }
  };

  // 컴포넌트 마운트 시 필요한 데이터 로딩
  useEffect(() => {
    logger.log('🚀 Cart 컴포넌트 마운트:', { storeId, orderMenusCount: orderMenus.length });
    
    // 쿠폰 API가 실패할 수 있으므로 try-catch로 감싸기
    try {
      dispatch(fetchCoupons()).catch(error => {
        logger.warn('쿠폰 API 로드 실패 (정상):', error.message);
      });
    } catch (error) {
      logger.warn('쿠폰 로드 실패 (정상):', error.message);
    }
    
    // 결제수단 API가 비활성화되어 있어서 에러가 발생할 수 있으므로 try-catch로 감싸기
    try {
      dispatch(fetchPaymentMethods()).catch(error => {
        logger.warn('결제수단 API 비활성화로 인한 에러 (정상):', error.message);
      });
    } catch (error) {
      logger.warn('결제수단 로드 실패 (정상):', error.message);
    }
    
    dispatch(fetchStores()).then((result) => {
      logger.log('🏪 매장 데이터 로드 결과:', result.payload);
    });
    
    if (storeId) {
      dispatch(fetchStoreById(storeId)).then((result) => {
        logger.log('🏪 특정 매장 데이터 로드:', result.payload);
      });
    }
  }, [dispatch, storeId]);

  // 매장 정보 검증 및 복구
  useEffect(() => {
    logger.log('🔍 매장 정보 복구 체크:', { 
      currentStore, 
      orderMenusCount: orderMenus.length, 
      allStoresCount: allStores.length,
      firstMenu: orderMenus[0]
    });
    
    if (!currentStore && orderMenus.length > 0 && allStores.length > 0) {
      const firstMenu = orderMenus[0];
      
      if (firstMenu?.storeId) {
        const foundStore = allStores.find(store => 
          String(store.storeId) === String(firstMenu.storeId)
        );
        
        if (foundStore) {
          logger.log('✅ 매장 정보 복구 성공 (storeId):', foundStore);
          dispatch(updateCurrentStore({
            storeId: foundStore.storeId,
            storeName: foundStore.name,
            storeImage: foundStore?.images[0] || "/samples/food1.jpg"
          }));
        }
      } else if (firstMenu?.menuId) {
        const foundStore = allStores.find(store => 
          store.menus && store.menus.some(menu => 
            String(menu.menuId) === String(firstMenu.menuId)
          )
        );
        
        if (foundStore) {
          logger.log('✅ 매장 정보 복구 성공 (menuId):', foundStore);
          dispatch(updateCurrentStore({
            storeId: foundStore.storeId,
            storeName: foundStore.name,
            storeImage: foundStore?.images[0] || "/samples/food1.jpg"
          }));
        } else if (firstMenu.menuId === 1 || firstMenu.menuId === "1") {
          logger.log('✅ 기본 매장 정보 설정');
          dispatch(updateCurrentStore({
            storeId: "2", // 존재하는 매장 ID로 변경
            storeName: "BHC 구름점",
            storeImage: "/samples/food1.jpg"
          }));
        }
      }
    }
  }, [currentStore, orderMenus, allStores, dispatch]);

  const handleQuantityChange = (menuId, menuOption, delta) => {
    const menuOptionHash = createMenuOptionHash(menuOption);
    dispatch(updateQuantity({ menuId, menuOptionHash, delta }));
  };

  const handleDelete = (menuId, menuOption) => {
    const menuOptionHash = createMenuOptionHash(menuOption);
    dispatch(removeMenu({ menuId, menuOptionHash }));
  };

  const handlePayment = async () => {
    let orderId = null;
    let paymentId = null;
    let deliveryInfo = null;
    
    // 중복 결제 방지 강화
    if (isProcessingPayment) {
      showToast("결제 처리 중입니다. 잠시만 기다려주세요.");
      return;
    }

    // 추가 중복 방지: 버튼 연속 클릭 방지
    const now = Date.now();
    if (handlePayment.lastClickTime && (now - handlePayment.lastClickTime) < 3000) {
      showToast("너무 빠르게 클릭하셨습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    handlePayment.lastClickTime = now;

    // 현재 페이지의 storeId 추출 및 검증 (먼저 정의)
    let currentStoreId = storeId || storeInfo?.id;
    let currentStoreInfo = storeInfo;

    // 주문 내용 기반 중복 방지
    const cartHash = JSON.stringify({
      storeId: currentStoreId,
      menus: orderMenus.map(m => ({ id: m.menuId, qty: m.quantity })),
      total: cartInfo.totalPrice
    });
    
    if (handlePayment.lastCartHash === cartHash) {
      showToast("동일한 주문이 처리 중입니다. 잠시만 기다려주세요.");
      return;
    }
    handlePayment.lastCartHash = cartHash;
    
    // 매장 정보가 없는 경우 복구 로직 적용
    if (!currentStoreId || !currentStoreInfo) {
      const recoveryResult = findOrCreateStoreInfo(orderMenus, allStores, logger);
      
      if (!recoveryResult) {
        showToast("장바구니에 상품이 없습니다.");
        return;
      }
      
      currentStoreId = recoveryResult.storeId;
      currentStoreInfo = recoveryResult.storeInfo;
      
      // Redux에 매장 정보 업데이트
      dispatch(updateCurrentStore({
        storeId: currentStoreInfo.id,
        storeName: currentStoreInfo.name,
        storeImage: currentStoreInfo.imageUrl
      }));
    }
    
    // 최종 검증
    if (!currentStoreId || !currentStoreInfo) {
      showToast("매장 정보를 확인할 수 없습니다. 메뉴를 다시 담아주세요.");
      return;
    }
    
    logger.log('🏪 매장 정보:', { currentStoreId, currentStoreInfo });
    
    // 장바구니가 비어있는지 확인
    if (!orderMenus || orderMenus.length === 0) {
      showToast("장바구니에 상품이 없습니다.");
      return;
    }
    
    // 주소 유효성 검사 강화
    logger.log('🏠 주소 검증:', { selectedAddress, hasAddress: !!selectedAddress });
    
    if (!selectedAddress || !selectedAddress.address || selectedAddress.address.trim() === '') {
      showToast("⚠️ 배송 주소를 먼저 설정해주세요!", 5000);
      logger.warn('❌ 주소 검증 실패:', selectedAddress);
      
      // 즉시 확인 창 표시
      setTimeout(() => {
        const shouldNavigate = window.confirm(
          "주문을 하려면 배송 주소가 필요합니다.\n\n주소 설정 페이지로 이동하시겠습니까?"
        );
        if (shouldNavigate) {
          navigate('/address', { state: { from: 'cart' } });
        }
      }, 1000);
      
      return;
    }
    
    logger.log('✅ 주소 검증 통과:', selectedAddress.address);
    
    // 포장 주문인 경우 차단
    if (isDelivery === "takeout") {
      showToast("포장 주문은 현재 구현예정입니다. 배달 주문을 이용해주세요.");
      return;
    }
    
    // 결제 수단 설정 (토스페이먼츠로 고정)
    let paymentMethod = 'toss';
    let remainingAmount = cartInfo.totalPrice;
    let usedCoupayAmount = 0;

    // 백엔드 명세에 맞는 주문 데이터 생성 (불필요한 필드 제거)
    const orderRequestData = {
      storeId: currentStoreId,  // 실제 매장 ID
      addrId: selectedAddress?.id,   // 선택된 주소
      deliveryType: isDelivery === "delivery" ? "DEFAULT" : "ONLY_ONE",
      orderMenus: orderMenus.map(menu => ({
        menuId: menu.menuId,
        menuName: menu.menuName,
        quantity: menu.quantity,
        menuTotalPrice: calculateCartTotal(menu),
        menuOption: Array.isArray(menu.menuOptions) ? menu.menuOptions.map(option => ({
          optionName: option.name || option,
          optionPrice: option.price || 0
        })) : []
      }))
      // memberCouponId는 주문 생성 시에는 불필요, 결제 생성 시에만 사용
    };

    // 주문 데이터 준비 전 디버깅
    logger.log('🔍 주문 데이터 준비:', {
      currentStoreId,
      currentStoreInfo,
      cartInfo,
      orderMenusCount: orderMenus.length,
      paymentMethod,
      selectedAddress,
      selectedCouponIds
    });

    // 주소 ID 검증 및 안전한 처리
    const addrId = selectedAddress?.id;
    if (!addrId) {
      showToast("배송 주소가 선택되지 않았습니다. 주소를 먼저 설정해주세요.");
      logger.error('배송 주소가 선택되지 않았습니다.');
      return;
    }
    
    try {
      dispatch(setPaymentProcessing(true));
      dispatch(clearPaymentResult());

      // 1단계: 주문 생성 (백엔드 명세에 맞게 정리)
      logger.log('📡 Step 1: 주문 생성 요청');
      const orderCreateReq = {
        addrId: selectedAddress?.id,
        storeId: currentStoreId,
        orderMenus: orderMenus.map(menu => ({
          menuId: menu.menuId,
          menuName: menu.menuName, // 백엔드 명세에 맞게 menuName 추가
          quantity: menu.quantity,
          menuTotalPrice: calculateCartTotal(menu),
          menuOption: Array.isArray(menu.menuOptions) ? menu.menuOptions.map(option => ({
            optionName: option.name || option,
            optionPrice: option.price || 0
          })) : [] // 백엔드 명세에 맞게 menuOption 구조 변경
        })),
        deliveryType: isDelivery === "delivery" ? "DEFAULT" : "ONLY_ONE"
      };
      
      logger.log('📡 주문 생성 요청:', orderCreateReq);
      logger.log('🔍 orderMenus 상세 정보:', orderMenus.map(menu => ({
        menuId: menu.menuId,
        menuName: menu.menuName,
        hasMenuName: !!menu.menuName
      })));
      const orderRes = await orderAPI.createOrderWithDeliveryInfo(orderCreateReq);
      
      // 백엔드 실제 응답 구조에 맞게 파싱 (response.data.orderId, tossOrderId)
      if (!orderRes?.data?.orderId || !orderRes?.data?.tossOrderId) {
        logger.error('❌ 주문 생성 응답 구조 오류:', orderRes);
        throw new Error('주문 생성 실패: orderId 또는 tossOrderId가 없습니다');
      }
      orderId = orderRes.data.orderId;
      const tossOrderId = orderRes.data.tossOrderId;
      logger.log('✅ 주문 생성 성공:', { orderId, tossOrderId });
      
      // 주문 상세 정보 조회 (배달팁, 시간, 할인금액 등) - 선택적
      // 현재 백엔드에서 menu_name null 문제가 있어서 임시로 비활성화
      /*
      try {
        const orderDetails = await orderAPI.getOrderDetails(orderId, {
          couponId: selectedCouponIds?.[0] || null,
          orderPrice: cartInfo.totalPrice
        });
        logger.log('✅ 주문 상세 정보 조회 성공:', orderDetails);
        
        // 배달팁, 시간, 할인금액 등 추가 정보 사용 가능
        const deliveryFee = orderDetails.data?.defaultDeliveryFee || 0;
        const discountValue = orderDetails.data?.discountValue || 0;
        logger.log('📦 배달 정보:', { deliveryFee, discountValue });
      } catch (error) {
        logger.warn('⚠️ 주문 상세 정보 조회 실패 (계속 진행):', error.message);
        // 주문 상세 정보 조회 실패해도 주문 생성은 성공했으므로 계속 진행
      }
      */
      logger.log('⏭️ 주문 상세 정보 조회 건너뛰기 (백엔드 menu_name 문제)');

      // 2단계: 결제 생성
      logger.log('📡 Step 2: 결제 생성 요청');
      const paymentCreateReq = {
        orderId,
        memberCouponId: selectedCouponIds?.[0] || null,
        totalCost: cartInfo.totalPrice,
        paymentMethod: 'CARD',
        storeRequest: requestInfo?.storeRequest || '',
        riderRequest: requestInfo?.deliveryRequest || '문 앞에 놔주세요 (초인종 O)'
      };
      logger.log('📡 결제 생성 요청:', paymentCreateReq);
      const paymentRes = await paymentAPI.createPayment(paymentCreateReq);
      
      // 백엔드 응답 구조에 맞게 파싱 (response.data.paymentId)
      if (!paymentRes?.data?.paymentId) {
        logger.error('❌ 결제 생성 응답 구조 오류:', paymentRes);
        throw new Error('결제 생성 실패: paymentId가 없습니다');
      }
      paymentId = paymentRes.data.paymentId;
      logger.log('✅ 결제 생성 성공:', paymentId);

      // 3단계: 토스 결제 위젯 실행
      logger.log('📡 Step 3: 토스 결제 위젯 실행');
      
      // 토스 결제 위젯을 위한 데이터 설정
      const paymentDataForWidget = {
        amount: Number(cartInfo.totalPrice), // 숫자로 명시적 변환
        orderId: tossOrderId, // 토스페이먼츠용 UUID 사용
        orderName: `${currentStoreInfo?.name || '주문'} - ${orderMenus.length}개 메뉴`,
        customerName: '고객', // TODO: 실제 사용자 이름으로 변경
        customerEmail: 'customer@example.com', // TODO: 실제 사용자 이메일로 변경
        backendPaymentId: paymentId, // 백엔드 결제 ID 추가
        backendOrderId: orderId // 백엔드 주문 ID (내부 관리용)
      };
      
      // sessionStorage에 결제 데이터 저장 (결제 성공 페이지에서 사용)
      sessionStorage.setItem('paymentData', JSON.stringify(paymentDataForWidget));
      
      setPaymentData(paymentDataForWidget);
      
      // 토스 결제 위젯 모달 열기
      setShowTossWidget(true);
    } catch (error) {
      logger.error('❌ 주문/결제 실패:', error);
      dispatch(setPaymentError(error.message || '주문 처리 중 오류가 발생했습니다.'));
      dispatch(setPaymentProcessing(false));
      showToast(`결제 실패: ${error.message || '주문 처리 중 오류가 발생했습니다.'}`);
      // 결제 실패 페이지 이동 등 기존 코드 활용
      setTimeout(() => {
        navigate('/payments/failure');
      }, 2000);
    } finally {
      dispatch(setPaymentProcessing(false));
      setTimeout(() => {
        handlePayment.lastCartHash = null;
      }, 5000);
    }
  };

  return (
    <div className={styles.container}>

      
      {orderMenus.length === 0 ? (
        <EmptyState
          variant="cart"
          title="장바구니가 비어있습니다"
          description="맛있는 메뉴를 담아보세요"
          actionText="메뉴 둘러보기"
          onAction={() => navigate('/')}
        />
      ) : isDelivery === "takeout" ? (
        <EmptyState
          variant="cart"
          title="포장 주문 서비스 구현예정"
          description="현재 배달 주문만 이용 가능합니다"
          actionText="배달로 주문하기"
          onAction={() => setIsDelivery("delivery")}
        />
      ) : (
        <>
          <CartAddressSection />
          <CartDeliveryOptionSection
            selected={deliveryOption}
            onChange={setDeliveryOption}
          />
          <CartMenuListSection />
          <CartCouponSection />
          <CartPaymentSummarySection 
            cartInfo={cartInfo} 
          />
          <CartPaymentMethodSection cartInfo={cartInfo} />
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
            disabled={
              orderMenus.length === 0 || 
              isProcessingPayment ||
              !selectedAddress ||
              !selectedAddress.address ||
              selectedAddress.address.trim() === ''
            }
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
      
      {/* 토스 결제 위젯 팝업 */}
      {showTossWidget && paymentData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            {/* 닫기 버튼 */}
            <button
              onClick={() => {
                setShowTossWidget(false);
                setPaymentData(null);
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                zIndex: 10
              }}
            >
              ×
            </button>
            
            <TossPaymentWidget
              amount={paymentData.amount}
              orderId={paymentData.orderId}
              orderName={paymentData.orderName}
              customerName={paymentData.customerName}
              customerEmail={paymentData.customerEmail}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </div>
        </div>
      )}
    </div>
  );
}
