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
import { paymentAPI } from "../../services";
import calculateCartTotal from "../../utils/calculateCartTotal";
import { createMenuOptionHash } from "../../utils/hashUtils";
import { calculateCouponDiscount, calculateMultipleCouponsDiscount } from "../../utils/couponUtils";
import { generateOrderId } from "../../utils/idUtils";
import { logger } from "../../utils/logger";
import { findOrCreateStoreInfo } from "../../utils/storeUtils";
import { ENV_CONFIG } from '../../config/api';

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
  const appliedCoupons = coupons.filter(c => selectedCouponIds.includes(c.id));
  
  // Redux에서 주소 및 결제 정보 가져오기
  const selectedAddress = useSelector(state => 
    state.address.addresses.find(addr => addr.id === state.address.selectedAddressId)
  );
  const selectedPaymentType = useSelector(state => state.payment.selectedPaymentType);
  const selectedCardId = useSelector(state => state.payment.selectedCardId);
  const selectedAccountId = useSelector(state => state.payment.selectedAccountId);
  const coupayAmount = useSelector(state => state.payment.coupayAmount);
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

  // 컴포넌트 마운트 시 필요한 데이터 로딩
  useEffect(() => {
    logger.log('🚀 Cart 컴포넌트 마운트:', { storeId, orderMenusCount: orderMenus.length });
    
    dispatch(fetchCoupons());
    dispatch(fetchPaymentMethods());
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
            String(menu.id) === String(firstMenu.menuId)
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
            storeId: "1",
            storeName: "도미노피자 구름점",
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
    // 전역 변수로 함수 시작 시 초기화
    let orderResponse = null;
    
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
    
    // 결제 수단 검증 및 설정
    let paymentMethod = selectedPaymentType;
    let remainingAmount = cartInfo.totalPrice;
    let usedCoupayAmount = 0;
    
    // 쿠페이머니 사용 시 부분 결제 처리
    if (selectedPaymentType === 'coupay') {
      usedCoupayAmount = coupayAmount || 0;
      remainingAmount = Math.max(0, cartInfo.totalPrice - usedCoupayAmount);
      
      if (remainingAmount > 0) {
        // 추가 결제 수단이 필요한 경우 - 기본적으로 카드로 설정 (실제로는 사용자가 선택해야 함)
        // 현재 목업에서는 카드로 자동 설정
        paymentMethod = 'mixed'; // 혼합 결제
      } else {
        paymentMethod = 'coupay'; // 쿠페이머니 전액 결제
      }
    }
    
    // 결제 수단 유효성 검사
    if (!selectedPaymentType) {
      showToast("결제 수단을 선택해주세요.");
      return;
    }
    
    if (selectedPaymentType === 'coupay' && usedCoupayAmount <= 0) {
      showToast("쿠페이머니 사용 금액을 입력해주세요.");
      return;
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

    // 주문 데이터 준비 전 디버깅
    logger.log('🔍 주문 데이터 준비:', {
      currentStoreId,
      currentStoreInfo,
      cartInfo,
      orderMenusCount: orderMenus.length,
      paymentMethod,
      selectedAddress
    });

    // 서버로 전송할 최종 주문 데이터 (orderAPI.js 스펙에 맞춤)
    const finalOrderData = {
      // orderAPI.js에서 요구하는 필수 필드들
      storeId: currentStoreId,
      storeName: currentStoreInfo?.name || "알 수 없는 매장",
      totalPrice: cartInfo?.totalPrice || 0,
      paymentMethod: paymentMethod,
      orderMenus: orderMenus.map(menu => ({
        menuId: menu.menuId,
        menuName: menu.menuName,
        menuOptions: menu.menuOptions || [],
        menuTotalPrice: calculateCartTotal(menu),
        quantity: menu.quantity
      })),
      
      // 배송 정보
      deliveryAddress: selectedAddress?.address || "주소 미설정",
      deliveryFee: deliveryOption?.price || 0,
      
      // 추가 정보
      storeRequest: requestInfo?.storeRequest || "",
      riderRequest: requestInfo?.deliveryRequest || "문 앞에 놔주세요 (초인종 O)",
      coupons: selectedCouponIds?.length > 0 ? selectedCouponIds : [],
      
      // 결제 관련 정보
      paymentStatus: "PENDING",
      coupayAmount: usedCoupayAmount || 0,
      remainingAmount: remainingAmount || 0
    };

    logger.log('📦 최종 주문 데이터:', finalOrderData);

    try {
      // 🔄 결제 처리 시작
      dispatch(setPaymentProcessing(true));
      dispatch(clearPaymentResult());

      // 한 번의 결제 요청에 대해 고유한 orderId 생성 (중복 방지)
      const uniqueOrderId = generateOrderId();
      logger.log('🆔 고유 주문 ID 생성:', uniqueOrderId);

      // 이미 동일한 orderId로 생성된 주문이 있는지 체크
      const existingOrderCheck = orders.find(order => 
        order.orderId === uniqueOrderId || order.id === uniqueOrderId
      );
      
      if (existingOrderCheck) {
        logger.log('🔄 이미 존재하는 주문 발견, 기존 주문 사용:', existingOrderCheck);
        orderResponse = { data: existingOrderCheck };
      } else {
        // ✅ 새로운 주문 생성
        const useLocalStorage = true; // 임시로 로컬 저장소 모드 사용
        
        if (useLocalStorage) {
          // 백업 모드: 로컬 저장
          logger.warn('⚠️ 백업 모드: 로컬 저장 사용');
          
          const localOrderData = {
            ...finalOrderData,
            price: finalOrderData.totalPrice,
            orderPrice: finalOrderData.totalPrice,
            totalAmount: finalOrderData.totalPrice,
            items: finalOrderData.orderMenus.map(menu => ({
              menuName: menu.menuName,
              quantity: menu.quantity,
              price: menu.menuTotalPrice || 0,
              menuOptions: menu.menuOptions || []
            })),
            storeName: currentStoreInfo?.name || "알 수 없는 매장",
            deliveryAddress: selectedAddress?.address || "주소 미설정",
            menuSummary: orderMenus.map(menu => menu.menuName).join(", "),
            storeImage: currentStoreInfo?.imageUrl || "/samples/food1.jpg",
            date: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            status: ORDER_STATUS.WAITING,
            orderMenuCount: orderMenus.length,
            orderId: uniqueOrderId // 고유 orderId 사용
          };
          
          // 로컬스토리지 과부하 방지를 위해 압축된 데이터만 Redux에 추가
          dispatch(addOrder(localOrderData));
          orderResponse = { data: localOrderData };
        } else {
          // 🎯 메인 모드: DB에 주문 저장
          try {
            logger.log('📡 API를 통한 주문 생성 시도...');
            const apiResult = await dispatch(createOrderAsync({
              ...finalOrderData,
              orderId: uniqueOrderId
            })).unwrap();
            
            if (apiResult && apiResult.data) {
              orderResponse = apiResult;
              logger.log('✅ DB 주문 생성 성공:', orderResponse);
              
              // DB 저장 성공 시 Redux에도 캐시용으로 압축 저장
              const cacheOrderData = {
                ...orderResponse.data,
                items: finalOrderData.orderMenus.map(menu => ({
                  menuName: menu.menuName,
                  quantity: menu.quantity,
                  price: menu.menuTotalPrice || 0,
                  menuOptions: menu.menuOptions || []
                })),
                menuSummary: orderMenus.map(menu => menu.menuName).join(", "),
              };
              dispatch(addOrder(cacheOrderData));
            } else {
              throw new Error('API 응답 데이터가 잘못되었습니다.');
            }
          } catch (apiError) {
            logger.error('❌ API 주문 생성 실패, 백업 모드로 전환:', apiError);
            
            // API 실패 시 백업으로 로컬 저장
            const backupOrderData = {
              ...finalOrderData,
              price: finalOrderData.totalPrice,
              orderPrice: finalOrderData.totalPrice,
              items: finalOrderData.orderMenus.map(menu => ({
                menuName: menu.menuName,
                quantity: menu.quantity,
                price: menu.menuTotalPrice || 0,
                menuOptions: menu.menuOptions || []
              })),
              storeName: currentStoreInfo?.name || "알 수 없는 매장",
              deliveryAddress: selectedAddress?.address || "주소 미설정",
              menuSummary: orderMenus.map(menu => menu.menuName).join(", "),
              date: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              status: ORDER_STATUS.WAITING,
              orderId: uniqueOrderId,
              isBackup: true // 백업 주문 표시
            };
            
            dispatch(addOrder(backupOrderData));
            orderResponse = { data: backupOrderData };
            
            // 사용자에게 알림
            showToast('주문이 임시 저장되었습니다. 네트워크 연결을 확인해주세요.');
          }
        }
      }

      // 주문 생성 검증
      logger.log('🔍 주문 생성 결과 검증:', { 
        hasOrderResponse: !!orderResponse,
        hasData: !!(orderResponse && orderResponse.data),
        hasOrderId: !!(orderResponse && orderResponse.data && orderResponse.data.orderId),
        orderResponse: orderResponse
      });
      
      if (!orderResponse || !orderResponse.data || !orderResponse.data.orderId) {
        throw new Error('주문 생성에 실패했습니다. 다시 시도해주세요.');
      }

      // 💳 실제 결제 처리 (Mock 모드에서도 테스트)
      const paymentData = {
        orderId: orderResponse.data.orderId,
        paymentMethod: paymentMethod,
        amount: cartInfo.totalPrice,
        coupayAmount: usedCoupayAmount,
        remainingAmount: remainingAmount,
        cardId: (selectedPaymentType === 'card' || paymentMethod === 'mixed') ? selectedCardId : null,
        accountId: (selectedPaymentType === 'account') ? selectedAccountId : null,
        customerInfo: {
          address: selectedAddress
        }
      };

      let paymentResult = null; // 결제 결과 초기화
      
      // 결제 API 호출 (Mock 모드에서는 시뮬레이션)
      if (ENV_CONFIG.isDevelopment) {
        // Mock 결제 처리 (2초 지연)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 목업에서는 항상 성공 (신용카드/계좌이체 무조건 성공)
        paymentResult = {
          paymentId: `payment_${Date.now()}`,
          status: 'SUCCESS',
          amount: paymentData.amount,
          method: paymentData.paymentMethod,
          coupayAmount: usedCoupayAmount,
          remainingAmount: remainingAmount,
          additionalPaymentMethod: remainingAmount > 0 ? 'card' : null,
          timestamp: new Date().toISOString()
        };
        
        dispatch(setPaymentSuccess(paymentResult));
        logger.log('✅ Mock 결제 성공:', paymentResult);
        
        // 쿠페이머니 사용 시 잔액 업데이트 (목업)
        if (usedCoupayAmount > 0) {
          // 실제로는 서버에서 처리되어야 함
          logger.log(`쿠페이머니 ${usedCoupayAmount}원 사용됨`);
        }
      } else {
        // 실제 결제 API 호출
        try {
          paymentResult = await paymentAPI.processPayment(paymentData);
          if (paymentResult) {
            dispatch(setPaymentSuccess(paymentResult));
            logger.log('✅ 실제 결제 성공:', paymentResult);
          } else {
            throw new Error('결제 API 응답이 비어있습니다.');
          }
        } catch (paymentError) {
          logger.error('❌ 실제 결제 API 실패:', paymentError);
          throw new Error(`결제 처리 실패: ${paymentError.message || '알 수 없는 오류'}`);
        }
      }
      
      // 🎉 결제 성공 시 결제 완료 페이지로 이동
      const successParams = new URLSearchParams({
        paymentId: paymentResult?.paymentId || `payment_${Date.now()}`,
        orderId: orderResponse.data.orderId,
        amount: paymentData.amount.toString()
      });
      
      // 중복 방지 해시 초기화 (성공 시)
      handlePayment.lastCartHash = null;
      
      navigate(`/payments/success?${successParams}`);
      
    } catch (error) {
      console.error("❌ 주문/결제 실패:", error);
      
      // 결제 실패 상태 업데이트
      dispatch(setPaymentError(error.message || '주문 처리 중 오류가 발생했습니다.'));
      
      // 결제 처리 상태 해제
      dispatch(setPaymentProcessing(false));
      
      // 결제 실패 페이지로 이동
      const failureParams = new URLSearchParams({
        error: 'processing_failed',
        message: error.message || '알 수 없는 오류가 발생했습니다.',
        orderId: (orderResponse && orderResponse.data && orderResponse.data.orderId) 
          ? orderResponse.data.orderId 
          : `temp_${Date.now()}`
      });
      
      // 결제 실패 페이지로 이동 (3초 후)
      setTimeout(() => {
        navigate(`/payments/failure?${failureParams}`);
      }, 3000);
      
      // 사용자에게 에러 알림
      showToast(`결제 실패: ${error.message || '주문 처리 중 오류가 발생했습니다.'}`);
    } finally {
      // 결제 처리 완료 후 상태 정리
      dispatch(setPaymentProcessing(false));
      
      // 중복 방지 해시 초기화 (실패 시에도)
      setTimeout(() => {
        handlePayment.lastCartHash = null;
      }, 5000); // 5초 후 해시 초기화
    }
  };

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
            selectedPaymentType={selectedPaymentType}
            coupayAmount={coupayAmount}
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
    </div>
  );
}
