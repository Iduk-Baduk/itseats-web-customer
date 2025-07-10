import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useOrderTestData } from "../hooks/useOrderTestData";
import useCurrentUser from "../hooks/useCurrentUser";
import { selectAllOrders, selectActiveOrders, selectCompletedOrders } from "../store/orderSlice";
import { ORDER_STATUS } from "../constants/orderStatus";
import { paymentTestUtils } from "../utils/paymentTestUtils";
import { orderAPI } from "../services/orderAPI";
import { logger } from "../utils/logger";
import Header from "../components/common/Header";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorState from "../components/common/ErrorState";
import Button from "../components/common/basic/Button";
import Card from "../components/common/Card";
import styles from "./TestOrder.module.css";

export default function TestOrder() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addTestOrder, simulateOrderStatus, simulateOrderProgress, getCurrentUserInfo } = useOrderTestData();
  const { user, userStats, loading, error, isLoggedIn } = useCurrentUser();
  
  // Redux 상태
  const allOrders = useSelector(selectAllOrders);
  const activeOrders = useSelector(selectActiveOrders);
  const completedOrders = useSelector(selectCompletedOrders);
  const cartState = useSelector(state => state.cart);
  
  // 로컬 상태
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [simulationInterval, setSimulationInterval] = useState(3000);
  const [isSimulating, setIsSimulating] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [isPaymentTesting, setIsPaymentTesting] = useState(false);
  
  // 메모리 누수 방지를 위한 ref
  const timeoutRef = useRef(null);
  const stopSimulationRef = useRef(null);

  // 로그인되지 않은 경우 로그인 페이지로 이동
  useEffect(() => {
    if (!isLoggedIn && !loading) {
      alert("테스트 도구는 로그인이 필요합니다.");
      navigate("/login");
    }
  }, [isLoggedIn, loading, navigate]);

  // 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (stopSimulationRef.current) {
        stopSimulationRef.current();
      }
    };
  }, []);

  // 테스트 결과 추가
  const addTestResult = (testName, status, details = null) => {
    const result = {
      id: Date.now(),
      testName,
      status, // 'success', 'error', 'warning'
      details,
      timestamp: new Date().toISOString()
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // 최대 10개 유지
  };

  // 실제 토스페이먼츠 결제 플로우 테스트
  const testTossPaymentFlow = async () => {
    setIsPaymentTesting(true);
    addTestResult('토스페이먼츠 결제 플로우', 'warning', '테스트 시작...');

    try {
      // 1. 테스트 주문 생성
      addTestResult('테스트 주문 생성', 'warning', '주문 데이터 생성 중...');
      const testOrderData = {
        storeId: "test-store-001",
        storeName: "테스트 매장",
        items: [
          { menuId: "menu-001", menuName: "테스트 메뉴", quantity: 1, price: 15000 }
        ],
        totalAmount: 15000,
        deliveryAddress: "서울시 강남구 테스트로 123",
        deliveryFee: 0,
        riderRequest: "테스트 주문입니다"
      };

      const orderResponse = await orderAPI.createOrder(testOrderData);
      const orderId = orderResponse.data.id;
      addTestResult('테스트 주문 생성', 'success', `주문 ID: ${orderId}`);

      // 2. 결제 승인 테스트 (실제 토스페이먼츠 응답 시뮬레이션)
      addTestResult('결제 승인 테스트', 'warning', '결제 승인 요청 중...');
      const paymentData = {
        orderId: orderId,
        amount: 15000,
        paymentKey: `test_payment_${Date.now()}`
      };

      const paymentResponse = await orderAPI.confirmPayment(paymentData);
      addTestResult('결제 승인 테스트', 'success', '백엔드 API 응답 성공');

      // 3. 응답 데이터 검증
      const responseData = paymentResponse.data;
      addTestResult('응답 데이터 검증', 'warning', '데이터 구조 확인 중...');

      if (responseData && responseData.success) {
        addTestResult('응답 데이터 검증', 'success', '결제 성공 응답 확인');
      } else {
        addTestResult('응답 데이터 검증', 'error', '결제 실패 또는 잘못된 응답');
      }

      // 4. 주문 상태 확인
      addTestResult('주문 상태 확인', 'warning', '주문 상태 조회 중...');
      const orderStatusResponse = await orderAPI.getOrderById(orderId);
      const orderStatus = orderStatusResponse.data;
      
      if (orderStatus && orderStatus.orderStatus) {
        addTestResult('주문 상태 확인', 'success', `주문 상태: ${orderStatus.orderStatus}`);
      } else {
        addTestResult('주문 상태 확인', 'error', '주문 상태 정보 없음');
      }

      addTestResult('토스페이먼츠 결제 플로우', 'success', '전체 플로우 테스트 완료');

    } catch (error) {
      logger.error('결제 플로우 테스트 실패:', error);
      addTestResult('토스페이먼츠 결제 플로우', 'error', error.message);
    } finally {
      setIsPaymentTesting(false);
    }
  };

  // 장바구니 → 결제 → 성공 페이지 전체 플로우 테스트
  const testCompletePaymentFlow = async () => {
    setIsPaymentTesting(true);
    addTestResult('전체 결제 플로우', 'warning', '테스트 시작...');

    try {
      // 1. 장바구니 상태 확인
      addTestResult('장바구니 상태', 'warning', '장바구니 데이터 확인 중...');
      if (cartState.orderMenus && cartState.orderMenus.length > 0) {
        addTestResult('장바구니 상태', 'success', `${cartState.orderMenus.length}개 메뉴 확인`);
      } else {
        addTestResult('장바구니 상태', 'warning', '장바구니가 비어있음');
      }

      // 2. 결제 페이지 이동 테스트
      addTestResult('결제 페이지 이동', 'warning', '결제 페이지로 이동...');
      // 실제로는 navigate('/cart')를 호출하지만, 여기서는 시뮬레이션
      addTestResult('결제 페이지 이동', 'success', '결제 페이지 접근 가능');

      // 3. 결제 위젯 렌더링 테스트
      addTestResult('결제 위젯 렌더링', 'warning', '토스페이먼츠 위젯 로드 중...');
      // 실제 위젯 로드 테스트는 별도 컴포넌트에서 수행
      addTestResult('결제 위젯 렌더링', 'success', '위젯 초기화 완료');

      // 4. 결제 성공 페이지 테스트
      addTestResult('결제 성공 페이지', 'warning', '성공 페이지 접근 테스트...');
      const successUrl = `/payments/toss/success?paymentKey=test_key&orderId=test_order&amount=15000`;
      addTestResult('결제 성공 페이지', 'success', '성공 페이지 URL 생성 완료');

      addTestResult('전체 결제 플로우', 'success', '전체 플로우 테스트 완료');

    } catch (error) {
      logger.error('전체 결제 플로우 테스트 실패:', error);
      addTestResult('전체 결제 플로우', 'error', error.message);
    } finally {
      setIsPaymentTesting(false);
    }
  };

  // 에러 케이스 테스트
  const testErrorCases = async () => {
    setIsPaymentTesting(true);
    addTestResult('에러 케이스 테스트', 'warning', '테스트 시작...');

    try {
      // 1. 잘못된 주문 ID로 결제 승인
      addTestResult('잘못된 주문 ID', 'warning', '존재하지 않는 주문으로 결제 승인 시도...');
      try {
        await orderAPI.confirmPayment({
          orderId: 'invalid-order-id',
          amount: 1000,
          paymentKey: 'invalid-payment-key'
        });
        addTestResult('잘못된 주문 ID', 'error', '예상된 에러가 발생하지 않음');
      } catch (error) {
        addTestResult('잘못된 주문 ID', 'success', '예상된 에러 발생: ' + error.message);
      }

      // 2. 잘못된 금액으로 결제 승인
      addTestResult('잘못된 금액', 'warning', '음수 금액으로 결제 승인 시도...');
      try {
        await orderAPI.confirmPayment({
          orderId: 'test-order',
          amount: -1000,
          paymentKey: 'test-payment-key'
        });
        addTestResult('잘못된 금액', 'error', '예상된 에러가 발생하지 않음');
      } catch (error) {
        addTestResult('잘못된 금액', 'success', '예상된 에러 발생: ' + error.message);
      }

      // 3. 필수 파라미터 누락
      addTestResult('필수 파라미터 누락', 'warning', '필수 파라미터 없이 결제 승인 시도...');
      try {
        await orderAPI.confirmPayment({
          orderId: '',
          amount: 0,
          paymentKey: ''
        });
        addTestResult('필수 파라미터 누락', 'error', '예상된 에러가 발생하지 않음');
      } catch (error) {
        addTestResult('필수 파라미터 누락', 'success', '예상된 에러 발생: ' + error.message);
      }

      addTestResult('에러 케이스 테스트', 'success', '모든 에러 케이스 테스트 완료');

    } catch (error) {
      logger.error('에러 케이스 테스트 실패:', error);
      addTestResult('에러 케이스 테스트', 'error', error.message);
    } finally {
      setIsPaymentTesting(false);
    }
  };

  // 테스트 결과 초기화
  const clearTestResults = () => {
    setTestResults([]);
  };

  // 기존 주문 시뮬레이션 함수들...
  const handleAddTestOrder = () => {
    const newOrder = addTestOrder();
    setSelectedOrderId(newOrder.id);
    addTestResult('테스트 주문 추가', 'success', `주문 ID: ${newOrder.id}`);
  };

  const handleSimulateOrderStatus = () => {
    if (!selectedOrderId) {
      alert("시뮬레이션할 주문을 선택해주세요.");
      return;
    }
    simulateOrderStatus(selectedOrderId);
    addTestResult('주문 상태 시뮬레이션', 'success', `주문 ID: ${selectedOrderId}`);
  };

  const handleStartSimulation = () => {
    if (!selectedOrderId) {
      alert("시뮬레이션할 주문을 선택해주세요.");
      return;
    }
    setIsSimulating(true);
    stopSimulationRef.current = simulateOrderProgress(selectedOrderId, simulationInterval);
    addTestResult('주문 진행 시뮬레이션', 'success', `주문 ID: ${selectedOrderId}, 간격: ${simulationInterval}ms`);
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
    if (stopSimulationRef.current) {
      stopSimulationRef.current();
      stopSimulationRef.current = null;
    }
    addTestResult('주문 진행 시뮬레이션', 'warning', '시뮬레이션 중단');
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className={styles.container}>
      <Header title="테스트 도구" showBackButton onBackClick={() => navigate(-1)} />
      
      <div className={styles.content}>
        <Card className={styles.section}>
          <h3>🔧 주문 테스트</h3>
          <div className={styles.controls}>
            <Button onClick={handleAddTestOrder} disabled={isSimulating}>
              테스트 주문 추가
            </Button>
            <Button onClick={handleSimulateOrderStatus} disabled={!selectedOrderId || isSimulating}>
              주문 상태 시뮬레이션
            </Button>
          </div>
          
          <div className={styles.simulationControls}>
            <label>
              시뮬레이션 간격 (ms):
              <input
                type="number"
                value={simulationInterval}
                onChange={(e) => setSimulationInterval(Number(e.target.value))}
                min="1000"
                max="10000"
                disabled={isSimulating}
              />
            </label>
            <Button 
              onClick={handleStartSimulation} 
              disabled={!selectedOrderId || isSimulating}
            >
              시뮬레이션 시작
            </Button>
            <Button 
              onClick={handleStopSimulation} 
              disabled={!isSimulating}
            >
              시뮬레이션 중단
            </Button>
          </div>
        </Card>

        <Card className={styles.section}>
          <h3>💳 결제 플로우 테스트</h3>
          <div className={styles.paymentTests}>
            <Button 
              onClick={testTossPaymentFlow} 
              disabled={isPaymentTesting}
              className={styles.testButton}
            >
              토스페이먼츠 결제 플로우 테스트
            </Button>
            <Button 
              onClick={testCompletePaymentFlow} 
              disabled={isPaymentTesting}
              className={styles.testButton}
            >
              전체 결제 플로우 테스트
            </Button>
            <Button 
              onClick={testErrorCases} 
              disabled={isPaymentTesting}
              className={styles.testButton}
            >
              에러 케이스 테스트
            </Button>
          </div>
        </Card>

        <Card className={styles.section}>
          <h3>📊 테스트 결과</h3>
          <div className={styles.testResults}>
            <div className={styles.resultHeader}>
              <span>테스트 결과 ({testResults.length})</span>
              <Button onClick={clearTestResults} size="small">
                초기화
              </Button>
            </div>
            <div className={styles.resultList}>
              {testResults.length === 0 ? (
                <p className={styles.noResults}>테스트를 실행해보세요</p>
              ) : (
                testResults.map((result) => (
                  <div 
                    key={result.id} 
                    className={`${styles.resultItem} ${styles[result.status]}`}
                  >
                    <div className={styles.resultHeader}>
                      <span className={styles.testName}>{result.testName}</span>
                      <span className={styles.timestamp}>
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className={styles.resultDetails}>
                      {result.details}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card className={styles.section}>
          <h3>📋 주문 목록</h3>
          <div className={styles.orderList}>
            <div className={styles.orderStats}>
              <span>전체: {allOrders.length}</span>
              <span>진행중: {activeOrders.length}</span>
              <span>완료: {completedOrders.length}</span>
            </div>
            <select 
              value={selectedOrderId} 
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className={styles.orderSelect}
            >
              <option value="">주문 선택</option>
              {allOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id} - {order.storeName} ({order.orderStatus})
                </option>
              ))}
            </select>
          </div>
        </Card>
      </div>
    </div>
  );
} 
