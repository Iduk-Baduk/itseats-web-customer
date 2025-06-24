import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useOrderTestData } from "../hooks/useOrderTestData";
import { selectAllOrders, selectActiveOrders, selectCompletedOrders } from "../store/orderSlice";
import Header from "../components/common/Header";
import styles from "./TestOrder.module.css";

export default function TestOrder() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addTestOrder, simulateOrderStatus, simulateOrderProgress } = useOrderTestData();
  
  // Redux 상태
  const allOrders = useSelector(selectAllOrders);
  const activeOrders = useSelector(selectActiveOrders);
  const completedOrders = useSelector(selectCompletedOrders);
  
  // 로컬 상태
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [simulationInterval, setSimulationInterval] = useState(3000);
  const [isSimulating, setIsSimulating] = useState(false);

  // 테스트 주문 추가
  const handleAddTestOrder = () => {
    const newOrder = addTestOrder();
    setSelectedOrderId(newOrder.id);
    alert(`테스트 주문이 추가되었습니다! ID: ${newOrder.id}`);
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
    
    // 30초 후 자동 중단
    setTimeout(() => {
      stopSimulation();
      setIsSimulating(false);
    }, 30000);
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
        
        {/* 테스트 주문 추가 */}
        <section className={styles.section}>
          <h3>1. 테스트 주문 추가</h3>
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
                {order.storeName} - {order.status}
              </option>
            ))}
          </select>
          
          {selectedOrderId && (
            <div className={styles.statusButtons}>
              <button onClick={() => handleStatusChange(selectedOrderId, 'WAITING')}>
                주문 접수
              </button>
              <button onClick={() => handleStatusChange(selectedOrderId, 'COOKING')}>
                조리 중
              </button>
              <button onClick={() => handleStatusChange(selectedOrderId, 'COOKED')}>
                조리 완료
              </button>
              <button onClick={() => handleStatusChange(selectedOrderId, 'RIDER_READY')}>
                라이더 배차
              </button>
              <button onClick={() => handleStatusChange(selectedOrderId, 'DELIVERING')}>
                배달 중
              </button>
              <button onClick={() => handleStatusChange(selectedOrderId, 'DELIVERED')}>
                배달 완료
              </button>
              <button onClick={() => handleStatusChange(selectedOrderId, 'COMPLETED')}>
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
                onChange={(e) => setSimulationInterval(Number(e.target.value))}
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

        {/* 콘솔 도구 안내 */}
        <section className={styles.section}>
          <h3>5. 콘솔 도구 사용법</h3>
          <p>브라우저 개발자 도구 콘솔에서 다음 명령어를 사용할 수 있습니다:</p>
          <div className={styles.codeBlock}>
            <code>orderTest.help()</code> - 도움말 보기<br/>
            <code>orderTest.addTestOrder()</code> - 테스트 주문 추가<br/>
            <code>orderTest.updateStatus('ID', 'STATUS')</code> - 상태 변경<br/>
            <code>orderTest.simulateProgress('ID', 3000)</code> - 자동 시뮬레이션
          </div>
        </section>
      </div>
    </div>
  );
} 
