import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useOrderTestData } from "../hooks/useOrderTestData";
import useCurrentUser from "../hooks/useCurrentUser";
import { selectAllOrders, selectActiveOrders, selectCompletedOrders } from "../store/orderSlice";
import { ORDER_STATUS } from "../constants/orderStatus";
import Header from "../components/common/Header";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorState from "../components/common/ErrorState";
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
  
  // 로컬 상태
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [simulationInterval, setSimulationInterval] = useState(3000);
  const [isSimulating, setIsSimulating] = useState(false);
  
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

  // 로딩 상태
  if (loading) {
    return (
      <div className={styles.container}>
        <Header
          title="주문 테스트"
          leftIcon="close"
          rightIcon={null}
          leftButtonAction={() => navigate(-1)}
        />
        <LoadingSpinner message="사용자 정보를 확인하는 중..." />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={styles.container}>
        <Header
          title="주문 테스트"
          leftIcon="close"
          rightIcon={null}
          leftButtonAction={() => navigate(-1)}
        />
        <ErrorState 
          message={error} 
          onPrimaryAction={() => navigate("/login")}
          primaryActionText="로그인"
        />
      </div>
    );
  }

  // 테스트 주문 추가
  const handleAddTestOrder = async () => {
    try {
      const newOrder = await addTestOrder();
      setSelectedOrderId(newOrder.id);
      alert(`테스트 주문이 추가되었습니다!\nID: ${newOrder.id}\n사용자: ${newOrder.userName}`);
    } catch (error) {
      alert(`테스트 주문 추가 실패: ${error.message}`);
    }
  };

  // 주문 상태 변경
  const handleStatusChange = (orderId, status) => {
    simulateOrderStatus(orderId, status);
    alert(`주문 ${orderId}의 상태가 ${status}로 변경되었습니다.`);
  };

  // 자동 시뮬레이션 시작
  const handleStartSimulation = () => {
    if (!selectedOrderId) {
      alert("시뮬레이션할 주문을 선택해주세요.");
      return;
    }

    setIsSimulating(true);
    const stopSimulation = simulateOrderProgress(selectedOrderId, simulationInterval);
    stopSimulationRef.current = stopSimulation;
    
    // 30초 후 자동 중단
    timeoutRef.current = setTimeout(() => {
      stopSimulation();
      setIsSimulating(false);
      stopSimulationRef.current = null;
    }, 30000);
  };

  // 시뮬레이션 간격 변경 핸들러
  const handleIntervalChange = (e) => {
    const value = Number(e.target.value);
    if (value < 1000) {
      alert("간격은 최소 1000ms 이상이어야 합니다.");
      return;
    }
    if (value > 10000) {
      alert("간격은 최대 10000ms 이하여야 합니다.");
      return;
    }
    setSimulationInterval(value);
  };

  return (
    <div className={styles.container}>
      <Header
        title="주문 테스트"
        leftIcon="close"
        rightIcon={null}
        leftButtonAction={() => navigate(-1)}
      />
      
      <div className={styles.content}>
        <h2>🎯 주문 테스트 도구</h2>
        
        {/* 현재 사용자 정보 */}
        <section className={styles.section}>
          <h3>👤 현재 사용자</h3>
          <div className={styles.userInfo}>
            <div className={styles.userDetails}>
              <p><strong>이름:</strong> {user?.name || '알 수 없음'}</p>
              <p><strong>아이디:</strong> {user?.username || '알 수 없음'}</p>
              <p><strong>전화번호:</strong> {user?.phone || '알 수 없음'}</p>
            </div>
            <div className={styles.userStats}>
              <div>주문 {userStats.orderCount}회</div>
              <div>리뷰 {userStats.reviewCount}개</div>
              <div>즐겨찾기 {userStats.favoriteCount}개</div>
            </div>
          </div>
        </section>
        
        {/* 테스트 주문 추가 */}
        <section className={styles.section}>
          <h3>1. 테스트 주문 추가</h3>
          <p className={styles.description}>
            현재 로그인된 사용자({user?.name})의 이름으로 테스트 주문을 생성합니다.
          </p>
          <button 
            className={styles.button}
            onClick={handleAddTestOrder}
          >
            테스트 주문 추가
          </button>
        </section>

        {/* 주문 선택 및 상태 변경 */}
        <section className={styles.section}>
          <h3>2. 주문 상태 변경</h3>
          <select 
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className={styles.select}
          >
            <option value="">주문을 선택하세요</option>
            {allOrders.map(order => (
              <option key={order.id} value={order.id}>
                {order.storeName} - {order.status} - {order.userName || '사용자 정보 없음'}
              </option>
            ))}
          </select>
          
          {selectedOrderId && (
            <div className={styles.statusButtons}>
              <button onClick={() => handleStatusChange(selectedOrderId, ORDER_STATUS.WAITING)}>
                주문 접수
              </button>
              <button onClick={() => handleStatusChange(selectedOrderId, ORDER_STATUS.COOKING)}>
                조리 중
              </button>
              <button onClick={() => handleStatusChange(selectedOrderId, ORDER_STATUS.COOKED)}>
                조리 완료
              </button>
              <button onClick={() => handleStatusChange(selectedOrderId, ORDER_STATUS.RIDER_READY)}>
                라이더 배차
              </button>
              <button onClick={() => handleStatusChange(selectedOrderId, ORDER_STATUS.DELIVERING)}>
                배달 중
              </button>
              <button onClick={() => handleStatusChange(selectedOrderId, ORDER_STATUS.DELIVERED)}>
                배달 완료
              </button>
              <button onClick={() => handleStatusChange(selectedOrderId, ORDER_STATUS.COMPLETED)}>
                주문 완료
              </button>
            </div>
          )}
        </section>

        {/* 자동 시뮬레이션 */}
        <section className={styles.section}>
          <h3>3. 자동 시뮬레이션</h3>
          <div className={styles.simulationControls}>
            <label>
              간격 (ms):
              <input
                type="number"
                value={simulationInterval}
                onChange={handleIntervalChange}
                min="1000"
                max="10000"
                className={styles.input}
              />
            </label>
            <button 
              className={`${styles.button} ${isSimulating ? styles.disabled : ''}`}
              onClick={handleStartSimulation}
              disabled={isSimulating}
            >
              {isSimulating ? '시뮬레이션 중...' : '시뮬레이션 시작'}
            </button>
          </div>
        </section>

        {/* 주문 목록 */}
        <section className={styles.section}>
          <h3>4. 현재 주문 목록</h3>
          <div className={styles.orderStats}>
            <div>전체: {allOrders.length}개</div>
            <div>진행 중: {activeOrders.length}개</div>
            <div>완료: {completedOrders.length}개</div>
          </div>
          
          <div className={styles.orderList}>
            {allOrders.map(order => (
              <div key={order.id} className={styles.orderItem}>
                <div className={styles.orderInfo}>
                  <strong>{order.storeName}</strong>
                  <span>상태: {order.status}</span>
                  <span>사용자: {order.userName || '정보 없음'}</span>
                  <span>ID: {order.id}</span>
                </div>
                <button 
                  onClick={() => navigate(`/orders/${order.id}/status`)}
                  className={styles.viewButton}
                >
                  상태 보기
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 개발자 도구 안내 */}
        <section className={styles.section}>
          <h3>5. 브라우저 콘솔 도구</h3>
          <div className={styles.consoleInfo}>
            <p>브라우저 개발자 도구 콘솔에서 다음 명령어를 사용할 수 있습니다:</p>
            <code>orderTest.help()</code> - 사용법 확인<br/>
            <code>orderTest.getCurrentUser()</code> - 현재 사용자 정보<br/>
            <code>orderTest.addTestOrder()</code> - 테스트 주문 추가<br/>
            <code>orderTest.getAllOrders()</code> - 모든 주문 확인
          </div>
        </section>
      </div>
    </div>
  );
} 
