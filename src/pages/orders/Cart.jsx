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

  // 배달 정보 상태 추가
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [isLoadingDeliveryInfo, setIsLoadingDeliveryInfo] = useState(false);

  const [isDelivery, setIsDelivery] = useState("delivery");
  const [riderRequest, setRiderRequest] = useState("직접 받을게요 (부재 시 문 앞)");
  const [isRiderRequestSheetOpen, setRiderRequestSheetOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });

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

  // 배달 정보 가져오기
  const fetchDeliveryInfo = async () => {
    if (!selectedAddress?.id || !storeInfo?.storeId || orderMenus.length === 0) {
      logger.log('⚠️ 배달 정보 가져오기 조건 미충족:', {
        hasAddress: !!selectedAddress?.id,
        hasStore: !!storeInfo?.storeId,
        menuCount: orderMenus.length
      });
      return;
    }

    try {
      setIsLoadingDeliveryInfo(true);
      logger.log('📡 배달 정보 요청 시작');

      const orderRequestData = {
        storeId: storeInfo.storeId,
        addrId: selectedAddress.id,
        orderMenus: orderMenus.map(menu => ({
          menuId: menu.menuId,
          menuName: menu.menuName,
          quantity: menu.quantity,
          menuTotalPrice: calculateCartTotal(menu),
          menuOptions: Array.isArray(menu.menuOptions) ? menu.menuOptions : []
        })),
        deliveryType: 'DEFAULT'
      };

      const response = await orderAPI.createOrderWithDeliveryInfo(orderRequestData);
      
      if (response?.data) {
        setDeliveryInfo(response.data);
        logger.log('✅ 배달 정보 가져오기 성공:', response.data);
        
        // 기본 배달 옵션으로 설정
        const defaultOption = {
          label: '무료배달',
          description: `${response.data.defaultTimeMin || 33}~${response.data.defaultTimeMax || 48}분`,
          price: response.data.defaultFee || 0,
          benefit: response.data.defaultFee === 0 ? '무료' : `+${response.data.defaultFee?.toLocaleString()}원`,
          wow: response.data.defaultFee === 0,
          type: 'DEFAULT'
        };
        
        setDeliveryOption(defaultOption);
      }
    } catch (error) {
      logger.error('❌ 배달 정보 가져오기 실패:', error);
      // 에러가 발생해도 기본 옵션 사용
    } finally {
      setIsLoadingDeliveryInfo(false);
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

  // 배달 정보 가져오기
  useEffect(() => {
    if (selectedAddress?.id && storeInfo?.storeId && orderMenus.length > 0) {
      fetchDeliveryInfo();
    }
  }, [selectedAddress?.id, storeInfo?.storeId, orderMenus]);

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
    
    // 결제 수단 설정 (토스페이먼츠로 고정)
    let paymentMethod = 'toss';
    let remainingAmount = cartInfo.totalPrice;
    let usedCoupayAmount = 0;

    // 백엔드 명세에 맞는 주문 데이터 생성
    const orderRequestData = {
      storeId: currentStoreId,  // 실제 매장 ID
      addrId: selectedAddress?.id || 3,   // 선택된 주소 또는 기본 주소
      deliveryType: isDelivery === "delivery" ? "DEFAULT" : "ONLY_ONE",
      orderMenus: orderMenus.map(menu => ({
        menuId: menu.menuId,
        menuName: menu.menuName,
        quantity: menu.quantity,
        menuTotalPrice: calculateCartTotal(menu),
        menuOption: Array.isArray(menu.menuOptions) ? menu.menuOptions : []  // 백엔드 명세에 맞게 menuOption으로 변경
      })),
      memberCouponId: selectedCouponIds?.[0] || null  // 선택된 쿠폰 ID
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
    const addrId = selectedAddress?.id || 3; // 기본값으로 admin 사용자의 주소 ID 사용
    
    // 서버로 전송할 최종 주문 데이터 (orderAPI.js 스펙에 맞춤)
    const finalOrderData = {
      // orderAPI.js에서 요구하는 필수 필드들
      storeId: currentStoreId,
      addrId: addrId, // 안전한 주소 ID 사용
      storeName: currentStoreInfo?.name || "알 수 없는 매장",
      totalPrice: cartInfo?.totalPrice || 0,
      paymentMethod: paymentMethod,
      orderMenus: orderMenus.map(menu => ({
        menuId: menu.menuId,
        menuName: menu.menuName,
        menuOptions: Array.isArray(menu.menuOptions) ? menu.menuOptions : [], // 빈 배열로 안전하게 처리
        menuTotalPrice: calculateCartTotal(menu),
        quantity: menu.quantity
      })),
      
      // 배송 정보
      deliveryAddress: selectedAddress?.address || "주소 미설정",
      deliveryFee: deliveryOption?.price || 0,
      
      // 추가 정보
      storeRequest: requestInfo?.storeRequest || "",
      riderRequest: requestInfo?.deliveryRequest || "문 앞에 놔주세요 (초인종 O)",
      coupons: Array.isArray(selectedCouponIds) ? selectedCouponIds : [],
      
      // 결제 관련 정보
      paymentStatus: "PENDING",
      coupayAmount: usedCoupayAmount || 0,
      remainingAmount: remainingAmount || 0
    };

    logger.log('📦 최종 주문 데이터:', finalOrderData);
    logger.log('📦 백엔드 명세에 맞는 주문 요청 데이터:', orderRequestData);

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
        // ✅ 새로운 주문 생성 (명세서 기반 배달 정보 포함)
        const useLocalStorage = false; // 실제 API 호출 테스트
        
        if (useLocalStorage) {
          // 🎯 로컬 저장소 모드: Redux에만 저장
          logger.log('📦 로컬 저장소 모드로 주문 생성...');
          const localOrderData = {
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
            isLocalStorage: true // 로컬 저장소 주문 표시
          };
          
          dispatch(addOrder(localOrderData));
          orderResponse = { data: localOrderData };
          logger.log('✅ 로컬 저장소 주문 생성 성공:', orderResponse);
          
        } else {
          // 🎯 메인 모드: DB에 주문 저장 (명세서 기반)
          try {
            logger.log('📡 API를 통한 배달 정보 포함 주문 생성 시도...');
            
            // 명세서에 맞는 배달 정보 포함 주문 생성
            const apiResult = await orderAPI.createOrderWithDeliveryInfo(orderRequestData);
            
            if (apiResult && apiResult.data && apiResult.data.data) {
              orderResponse = apiResult;
              logger.log('✅ DB 배달 정보 포함 주문 생성 성공:', {
                httpStatus: orderResponse.data.httpStatus,
                message: orderResponse.data.message,
                orderId: orderResponse.data.data.orderId,
                totalCost: orderResponse.data.data.totalCost
              });
              
              // 배달 정보 응답에서 추가 정보 추출 (백엔드 응답 구조에 맞게 수정)
              const deliveryInfo = apiResult.data.data;
              logger.log('📦 배달 정보 응답:', {
                orderId: deliveryInfo.orderId,
                defaultTimeMin: deliveryInfo.defaultTimeMin,
                defaultTimeMax: deliveryInfo.defaultTimeMax,
                onlyOneTimeMin: deliveryInfo.onlyOneTimeMin,
                onlyOneTimeMax: deliveryInfo.onlyOneTimeMax,
                orderPrice: deliveryInfo.orderPrice,
                defaultFee: deliveryInfo.defaultFee,
                onlyOneFee: deliveryInfo.onlyOneFee,
                discountValue: deliveryInfo.discountValue,
                totalCost: deliveryInfo.totalCost
              });
              
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
                // 배달 정보 추가
                deliveryInfo: {
                  defaultTimeMin: deliveryInfo.defaultTimeMin,
                  defaultTimeMax: deliveryInfo.defaultTimeMax,
                  onlyOneTimeMin: deliveryInfo.onlyOneTimeMin,
                  onlyOneTimeMax: deliveryInfo.onlyOneTimeMax,
                  defaultFee: deliveryInfo.defaultFee,
                  onlyOneFee: deliveryInfo.onlyOneFee,
                  discountValue: deliveryInfo.discountValue
                }
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

      // 주문 생성 검증 (백엔드 응답 구조에 맞게 수정)
      logger.log('🔍 주문 생성 결과 검증:', { 
        hasOrderResponse: !!orderResponse,
        hasData: !!(orderResponse && orderResponse.data),
        hasOrderId: !!(orderResponse && orderResponse.data && orderResponse.data.orderId),
        orderResponse: orderResponse
      });
      
      if (!orderResponse || !orderResponse.data || !orderResponse.data.orderId) {
        throw new Error('주문 생성에 실패했습니다. 다시 시도해주세요.');
      }

      // 백엔드 가이드에 따른 올바른 결제 플로우
      try {
        // Step 1: 주문 생성 (먼저 주문을 생성하여 orderId 확보) - 명세서 기반
        logger.log('📡 Step 1: 배달 정보 포함 주문 생성 요청');
        const orderResponse = await orderAPI.createOrderWithDeliveryInfo(orderRequestData);
        const orderId = orderResponse.data.orderId; // 백엔드 응답 구조에 맞게 수정
        logger.log('✅ Step 1: 배달 정보 포함 주문 생성 성공, orderId:', orderId);
        
        // 배달 정보 응답에서 추가 정보 추출 (백엔드 응답 구조에 맞게 수정)
        const deliveryInfo = orderResponse.data;
        logger.log('📦 배달 정보 응답:', {
          orderId: deliveryInfo.orderId,
          defaultTimeMin: deliveryInfo.defaultTimeMin,
          defaultTimeMax: deliveryInfo.defaultTimeMax,
          onlyOneTimeMin: deliveryInfo.onlyOneTimeMin,
          onlyOneTimeMax: deliveryInfo.onlyOneTimeMax,
          orderPrice: deliveryInfo.orderPrice,
          defaultFee: deliveryInfo.defaultFee,
          onlyOneFee: deliveryInfo.onlyOneFee,
          discountValue: deliveryInfo.discountValue,
          totalCost: deliveryInfo.totalCost
        });
        
        // Step 2: 결제 정보 생성 (orderId를 사용하여 결제 정보 생성)
        const paymentInfo = {
          orderId: orderId,
          memberCouponId: selectedCouponIds?.[0] || null, // 첫 번째 쿠폰 사용
          totalCost: deliveryInfo.totalCost, // 배달 정보에서 받은 총 금액 사용
          paymentMethod: 'CARD',
          storeRequest: requestInfo?.storeRequest || '',
          riderRequest: requestInfo?.deliveryRequest || '문 앞에 놔주세요 (초인종 O)'
        };
        
        logger.log('📡 Step 2: 결제 정보 생성 요청 시작');
        logger.log('📋 결제 정보:', paymentInfo);
        
        try {
          // JWT 인증이 해결되었으므로 실제 백엔드 API 사용
          const useMockMode = false; // 실제 백엔드 API 사용
          // const isTestMode = import.meta.env.DEV && import.meta.env.VITE_USE_TEST_PAYMENT_API === 'true';
          
          let paymentCreateResponse;
          if (useMockMode) {
            logger.log('🧪 Mock 모드: 테스트용 결제 생성 API 사용');
            paymentCreateResponse = await tossPaymentAPI.createTestPayment(paymentInfo);
          } else {
            logger.log('🚀 프로덕션 모드: 실제 결제 생성 API 사용');
            paymentCreateResponse = await tossPaymentAPI.createPayment(paymentInfo);
          }
          
          logger.log('✅ Step 2: 결제 정보 생성 API 호출 성공');
          
          // paymentId 추출 시 안전한 처리 추가
          let backendPaymentId = null;
          if (paymentCreateResponse) {
            logger.log('📦 결제 생성 응답 데이터:', paymentCreateResponse);
            // 다양한 응답 구조에 대응
            backendPaymentId = paymentCreateResponse.paymentId || 
                              paymentCreateResponse.id || 
                              paymentCreateResponse.data?.paymentId ||
                              paymentCreateResponse.data?.id;
          }
          
          if (!backendPaymentId) {
            logger.error('❌ 결제 정보 생성 응답에서 paymentId를 찾을 수 없습니다:', paymentCreateResponse);
            throw new Error('결제 정보 생성에 실패했습니다. 다시 시도해주세요.');
          }
          
          // paymentId를 문자열로 변환 (JavaScript Number 타입 한계 문제 해결)
          const paymentIdString = String(backendPaymentId);
          logger.log('✅ Step 2: 결제 정보 생성 성공, paymentId:', paymentIdString);
          
        } catch (createPaymentError) {
          logger.error('❌ 결제 정보 생성 API 호출 실패:', createPaymentError);
          logger.error('❌ 에러 상세 정보:', {
            message: createPaymentError.message,
            statusCode: createPaymentError.statusCode,
            response: createPaymentError.originalError?.response?.data
          });
          throw createPaymentError;
        }
        
        // Step 3: 토스페이먼츠 결제 페이지로 이동 (paymentId 포함)
        const tossParams = new URLSearchParams({
          orderId: orderId,
          paymentId: paymentIdString, // 문자열로 전달
          amount: deliveryInfo.totalCost.toString(), // 배달 정보에서 받은 총 금액 사용
          orderName: `${currentStoreInfo?.name || '주문'} - ${orderMenus.map(m => m.menuName).join(', ')}`,
          customerName: user?.name || '고객',
          customerEmail: user?.email || 'customer@example.com'
        });
        
        logger.log('📋 토스페이먼츠 파라미터:', {
          orderId,
          paymentId: paymentIdString,
          amount: deliveryInfo.totalCost,
          orderName: `${currentStoreInfo?.name || '주문'} - ${orderMenus.map(m => m.menuName).join(', ')}`
        });
        
        // 토스페이먼츠 결제 페이지로 이동
        logger.log('📡 Step 3: 토스페이먼츠 결제 페이지로 이동');
        
        // 주문 데이터를 sessionStorage에 저장 (결제 성공 후 주문 정보 유지용)
        const orderDataForPayment = {
          orderId: orderId,
          storeId: currentStoreId,
          storeName: currentStoreInfo?.name || "알 수 없는 매장",
          totalPrice: deliveryInfo.totalCost,
          deliveryFee: deliveryInfo.defaultFee || deliveryInfo.onlyOneFee || 0,
          orderMenus: orderMenus.map(menu => ({
            menuId: menu.menuId,
            menuName: menu.menuName,
            quantity: menu.quantity,
            price: menu.menuTotalPrice || 0,
            options: menu.menuOptions || []
          })),
          deliveryAddress: {
            roadAddress: selectedAddress?.address || "",
            detailAddress: selectedAddress?.detailAddress || "",
            lat: selectedAddress?.lat,
            lng: selectedAddress?.lng
          },
          paymentMethod: {
            type: 'CARD',
            id: 'toss'
          },
          storeRequest: requestInfo?.storeRequest || "",
          riderRequest: requestInfo?.deliveryRequest || "문 앞에 놔주세요 (초인종 O)",
          couponIds: Array.isArray(selectedCouponIds) ? selectedCouponIds : [],
          // 배달 정보 추가
          deliveryInfo: {
            defaultTimeMin: deliveryInfo.defaultTimeMin,
            defaultTimeMax: deliveryInfo.defaultTimeMax,
            onlyOneTimeMin: deliveryInfo.onlyOneTimeMin,
            onlyOneTimeMax: deliveryInfo.onlyOneTimeMax,
            defaultFee: deliveryInfo.defaultFee,
            onlyOneFee: deliveryInfo.onlyOneFee,
            discountValue: deliveryInfo.discountValue
          }
        };
        
        // sessionStorage에 주문 데이터 저장
        sessionStorage.setItem('pendingOrderData', JSON.stringify(orderDataForPayment));
        logger.log('💾 주문 데이터 sessionStorage 저장:', orderDataForPayment);
        
        navigate(`/payments/toss?${tossParams}`);
        
      } catch (paymentError) {
        logger.error('❌ 결제 처리 실패:', paymentError);
        
        // 결제 실패 시 Mock 모드로 fallback
        try {
          logger.warn('⚠️ 백엔드 결제 실패, Mock 모드로 fallback');
          
          // Mock 주문 데이터 생성
          const mockOrderData = {
            orderId: `mock_${Date.now()}`,
            storeId: currentStoreId,
            storeName: currentStoreInfo?.name || "알 수 없는 매장",
            totalPrice: cartInfo.totalPrice,
            deliveryFee: cartInfo.deliveryFee || 0,
            orderMenus: orderMenus.map(menu => ({
              menuId: menu.menuId,
              menuName: menu.menuName,
              quantity: menu.quantity,
              price: menu.menuTotalPrice || 0,
              options: menu.menuOptions || []
            })),
            deliveryAddress: {
              roadAddress: selectedAddress?.address || "",
              detailAddress: selectedAddress?.detailAddress || "",
              lat: selectedAddress?.lat,
              lng: selectedAddress?.lng
            },
            paymentMethod: {
              type: 'CARD',
              id: 'toss'
            },
            storeRequest: requestInfo?.storeRequest || "",
            riderRequest: requestInfo?.deliveryRequest || "문 앞에 놔주세요 (초인종 O)",
            couponIds: Array.isArray(selectedCouponIds) ? selectedCouponIds : []
          };
          
          // Mock 결제 데이터 생성
          const mockPaymentData = {
            orderId: mockOrderData.orderId,
            amount: cartInfo.totalPrice,
            paymentKey: `mock_${Date.now()}`
          };
          
          const mockPaymentResponse = await tossPaymentAPI.mockConfirmPayment(mockPaymentData);
          logger.log('✅ Mock 결제 성공:', mockPaymentResponse);
          
          // 결제 성공 페이지로 이동
          navigate('/payments/success', { 
            state: { 
              orderData: mockOrderData,
              paymentData: mockPaymentData 
            } 
          });
          
        } catch (mockError) {
          logger.error('❌ Mock 결제도 실패:', mockError);
          throw paymentError; // 원래 에러를 다시 던짐
        }
      }
      
      // 중복 방지 해시 초기화
      handlePayment.lastCartHash = null;
      
    } catch (error) {
      logger.error("❌ 주문/결제 실패:", error);
      
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
            deliveryInfo={deliveryInfo}
            isLoading={isLoadingDeliveryInfo}
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
    </div>
  );
}
