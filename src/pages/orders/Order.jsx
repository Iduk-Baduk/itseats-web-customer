import React, { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import OrderCard from "../../components/orders/OrderCard";
import OrderSearch from "../../components/orders/OrderSearch";
import OrderTab from "../../components/orders/OrderTab";
import {
  selectActiveOrders,
  selectCompletedOrders,
  selectAllOrders,
  fetchOrdersAsync,
} from "../../store/orderSlice";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { logger } from "../../utils/logger";
import styles from "./Order.module.css";

export default function Order() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation(); // 추가
  const [selectedTab, setSelectedTab] = React.useState("past");
  const [keyword, setKeyword] = React.useState("");

  const allOrders = useSelector(selectAllOrders);
  const activeOrders = useSelector(selectActiveOrders);
  const completedOrders = useSelector(selectCompletedOrders);
  const isLoading = useSelector((state) => state.order?.isLoading || false);

  useEffect(() => {
    dispatch(fetchOrdersAsync({ page: 0, keyword }));
  }, [dispatch, keyword]);

  // location.state?.refresh가 true면 주문 목록 새로고침
  useEffect(() => {
    if (location.state?.refresh) {
      dispatch(fetchOrdersAsync({ page: 0, keyword }));
      // 새로고침 후 state 초기화 (중복 새로고침 방지)
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, dispatch, keyword, location.pathname, navigate]);

  const refreshOrders = useCallback(() => {
    dispatch(fetchOrdersAsync({ page: 0, keyword }));
  }, [dispatch, keyword]);

  const handleWriteReview = useCallback(
    (order) => {
      navigate(`/orders/${order.orderId}/review`, {
        state: { order },
      });
    },
    [navigate]
  );

  const handleViewReview = useCallback(
    (order) => {
      navigate(`/orders/${order.orderId}/review/view`);
    },
    [navigate]
  );

  const handleReorder = useCallback(
    (order) => {
      if (order.storeId) {
        navigate(`/stores/${order.storeId}`);
      } else {
        if (import.meta.env.DEV) {
          logger.warn("주문에서 매장 ID를 찾을 수 없습니다:", order);
        }
        const foundStore = allOrders.find((o) => o.storeName === order.storeName);
        if (foundStore && foundStore.storeId) {
          navigate(`/stores/${foundStore.storeId}`);
        } else {
          navigate("/");
        }
      }
    },
    [navigate, allOrders]
  );

  const transformOrderForCard = useCallback((order) => {
    const isCompleted = ["DELIVERED", "COMPLETED"].includes(order.orderStatus);
    return {
      ...order,
      price: order.orderPrice || order.price || 0,
      date: order.createdAt
        ? new Date(order.createdAt).toLocaleString("ko-KR")
        : order.date,
      isCompleted,
      hasReview: !!order.hasReview,
    };
  }, []);

  const displayCompletedOrders = completedOrders.map(transformOrderForCard);
  const displayActiveOrders = activeOrders.map(transformOrderForCard);

  if (isLoading) {
    return (
      <div>
        <OrderTab onTabChange={setSelectedTab} />
        <LoadingSpinner message="주문 정보를 불러오는 중..." pageLoading />
      </div>
    );
  }

  return (
    <div>
      <OrderTab onTabChange={setSelectedTab} />
      <OrderSearch className={styles.orderSearch} onClick={setKeyword} />

      {selectedTab === "past" &&
        (displayCompletedOrders.length > 0 ? (
          displayCompletedOrders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              className={styles.orderCard}
              onWriteReview={() => {
                handleWriteReview(order);
              }}
              onViewReview={() => handleViewReview(order)}
              onReorder={() => handleReorder(order)}
            />
          ))
        ) : (
          <EmptyState
            variant="order"
            title="아직 완료된 주문이 없습니다"
            description="첫 주문을 시작해보세요"
            actionText="주문하러 가기"
            onAction={() => navigate("/")}
          />
        ))}

      {selectedTab === "preparing" &&
        (displayActiveOrders.length > 0 ? (
          displayActiveOrders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              className={styles.orderCard}
              onOpenStatus={() => navigate(`/orders/${order.orderId}/status`)}
            />
          ))
        ) : (
          <EmptyState
            variant="order"
            title="진행 중인 주문이 없습니다"
            description="새로운 주문을 시작해보세요"
            actionText="주문하러 가기"
            onAction={() => navigate("/")}
          />
        ))}
    </div>
  );
}
