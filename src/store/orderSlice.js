import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ORDER_STATUS } from "../constants/orderStatus";
import { isValidOrderStatus } from "../utils/orderUtils";
import { orderAPI } from "../services";
import { STORAGE_KEYS, logger } from '../utils/logger';

// localStorage에 저장하는 함수
const saveOrdersToStorage = (orders) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (error) {
    logger.error('Failed to save orders to storage:', error);
  }
};

// localStorage에서 불러오는 함수
const loadOrdersFromStorage = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return serialized ? JSON.parse(serialized) : [];
  } catch (error) {
    logger.error('Failed to load orders from storage:', error);
    return [];
  }
};

// 고유 ID 생성 함수
const generateOrderId = () => {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// API 기반 Thunk들
export const createOrderAsync = createAsyncThunk(
  'order/createOrder',
  async (orderData) => {
    return await orderAPI.createOrder(orderData);
  }
);

export const fetchOrdersAsync = createAsyncThunk(
  'order/fetchOrders',
  async (params = {}) => {
    return await orderAPI.getOrders(params);
  }
);

export const fetchOrderByIdAsync = createAsyncThunk(
  'order/fetchOrderById',
  async (orderId) => {
    return await orderAPI.getOrderById(orderId);
  }
);

export const updateOrderStatusAsync = createAsyncThunk(
  'order/updateOrderStatus',
  async ({ orderId, status, message }) => {
    await orderAPI.updateOrderStatus(orderId, status, message);
    return { orderId, status, message };
  }
);

export const trackOrderAsync = createAsyncThunk(
  'order/trackOrder',
  async (orderId) => {
    return await orderAPI.trackOrder(orderId);
  }
);

const initialState = {
  orders: loadOrdersFromStorage(), // 주문 목록
  currentOrder: null, // 현재 주문 (주문 상태 페이지에서 사용)
  isLoading: false,
  error: null,
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    // 주문 목록 초기화
    initializeOrders(state, action) {
      state.orders = action.payload;
      saveOrdersToStorage(state.orders);
    },

    // 새 주문 추가 (결제 완료 후)
    addOrder(state, action) {
      const newOrder = {
        ...action.payload,
        id: generateOrderId(),
        createdAt: new Date().toISOString(),
        status: ORDER_STATUS.WAITING,
        statusHistory: [
          {
            status: ORDER_STATUS.WAITING,
            timestamp: new Date().toISOString(),
            message: "주문이 접수되었습니다."
          }
        ]
      };
      
      state.orders.unshift(newOrder); // 최신 주문을 맨 앞에 추가
      state.currentOrder = newOrder;
      saveOrdersToStorage(state.orders);
    },

    // 주문 상태 업데이트
    updateOrderStatus(state, action) {
      const { orderId, status, message } = action.payload;
      
      // 상태 유효성 검증
      if (!isValidOrderStatus(status)) {
        logger.error(`Invalid order status: ${status}`);
        return;
      }
      
      const orderIndex = state.orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        const order = state.orders[orderIndex];
        order.status = status;
        order.statusHistory.push({
          status,
          timestamp: new Date().toISOString(),
          message: message || `주문 상태가 ${status}로 변경되었습니다.`
        });

        // 현재 주문이 업데이트된 주문이라면 currentOrder도 업데이트
        if (state.currentOrder && state.currentOrder.id === orderId) {
          state.currentOrder = order;
        }

        saveOrdersToStorage(state.orders);
      } else {
        logger.error(`Order not found: ${orderId}`);
      }
    },

    // 현재 주문 설정 (주문 상태 페이지에서 사용)
    setCurrentOrder(state, action) {
      const orderId = action.payload;
      const order = state.orders.find(order => order.id === orderId);
      
      // 이미 같은 주문이 설정되어 있으면 업데이트하지 않음
      if (state.currentOrder && state.currentOrder.id === orderId) {
        return;
      }
      
      state.currentOrder = order || null;
    },

    // 주문 상세 정보 업데이트
    updateOrderDetails(state, action) {
      const { orderId, details } = action.payload;
      
      const orderIndex = state.orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        state.orders[orderIndex] = { ...state.orders[orderIndex], ...details };
        
        // 현재 주문이 업데이트된 주문이라면 currentOrder도 업데이트
        if (state.currentOrder && state.currentOrder.id === orderId) {
          state.currentOrder = { ...state.currentOrder, ...details };
        }

        saveOrdersToStorage(state.orders);
      }
    },

    // 주문 삭제 (완료된 주문 정리)
    removeOrder(state, action) {
      const orderId = action.payload;
      state.orders = state.orders.filter(order => order.id !== orderId);
      
      // 현재 주문이 삭제된 주문이라면 currentOrder 초기화
      if (state.currentOrder && state.currentOrder.id === orderId) {
        state.currentOrder = null;
      }

      saveOrdersToStorage(state.orders);
    },

    // 로딩 상태 설정
    setLoading(state, action) {
      state.isLoading = action.payload;
    },

    // 에러 상태 설정
    setError(state, action) {
      state.error = action.payload;
    },

    // 에러 초기화
    clearError(state) {
      state.error = null;
    },

    // 현재 주문 초기화
    clearCurrentOrder(state) {
      state.currentOrder = null;
    },
  },
});

export const {
  initializeOrders,
  addOrder,
  updateOrderStatus,
  setCurrentOrder,
  updateOrderDetails,
  removeOrder,
  setLoading,
  setError,
  clearError,
  clearCurrentOrder,
} = orderSlice.actions;

// Selectors
export const selectAllOrders = (state) => state.order?.orders || [];
export const selectCurrentOrder = (state) => state.order?.currentOrder || null;
export const selectOrderById = (state, orderId) => 
  state.order?.orders?.find(order => order.id === orderId) || null;
export const selectOrdersByStatus = (state, status) => 
  state.order?.orders?.filter(order => order.status === status) || [];
export const selectActiveOrders = (state) => 
  state.order?.orders?.filter(order => 
    [ORDER_STATUS.WAITING, ORDER_STATUS.COOKING, ORDER_STATUS.COOKED, 
     ORDER_STATUS.RIDER_READY, ORDER_STATUS.DELIVERING].includes(order.status)
  ) || [];
export const selectCompletedOrders = (state) => 
  state.order?.orders?.filter(order => 
    [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(order.status)
  ) || [];
export const selectIsLoading = (state) => state.order?.isLoading || false;
export const selectError = (state) => state.order?.error || null;

export default orderSlice.reducer; 
