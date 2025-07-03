import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ORDER_STATUS } from "../constants/orderStatus";
import { isValidOrderStatus } from "../utils/orderUtils";
import { orderAPI } from "../services";
import { generateOrderId as generateUniqueOrderId } from '../utils/idUtils';
import { STORAGE_KEYS, logger } from '../utils/logger';
import { cleanupOrderStorage, compressOrderForStorage, checkStorageSize } from '../utils/storageUtils';

// localStorage에 저장하는 함수 (압축 및 정리)
const saveOrdersToStorage = (orders) => {
  try {
    // 용량 체크
    const { needsCleanup } = checkStorageSize();
    if (needsCleanup) {
      logger.warn('⚠️ 로컬스토리지 용량 초과, 정리 수행');
    }

    // 주문 데이터 정리 (최대 50개)
    const cleanedOrders = cleanupOrderStorage(orders);
    
    // 압축된 주문 데이터만 저장 (핵심 정보만)
    const compressedOrders = cleanedOrders.map(compressOrderForStorage);
    
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(compressedOrders));
    logger.log(`💾 주문 ${compressedOrders.length}개 로컬스토리지에 저장`);
  } catch (error) {
    logger.error('❌ Failed to save orders to storage:', error);
    // 실패 시 비상 정리
    try {
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      logger.log('🚨 로컬스토리지 비상 정리 완료');
    } catch (clearError) {
      logger.error('❌ 비상 정리도 실패:', clearError);
    }
  }
};

// localStorage에서 불러오는 함수
export const loadOrdersFromStorage = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return serialized ? JSON.parse(serialized) : [];
  } catch (error) {
    logger.error('Failed to load orders from storage:', error);
    return [];
  }
};

// 고유 ID 생성 함수 (유틸리티에서 가져옴)
const generateOrderId = generateUniqueOrderId;

// API 기반 Thunk들
export const createOrderAsync = createAsyncThunk(
  'order/createOrder',
  async (orderData) => {
    return await orderAPI.createOrder(orderData);
  }
);

export const fetchOrdersAsync = createAsyncThunk(
  'order/fetchOrders',
  async (params = { page: 0 }) => {
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
  async ({ orderId, orderStatus, message }) => {
    await orderAPI.updateOrderStatus(orderId, orderStatus, message);
    return { orderId, orderStatus, message };
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
  currentPage: 1, // 현재 페이지 (페이징 처리)
  hasNext: false, // 다음 페이지 여부 (페이징 처리)
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

    // 새 주문 추가 (결제 완료 후) - 중복 방지 로직 추가
    addOrder(state, action) {
      const payloadOrderId = action.payload.id || action.payload.orderId;
      
      // 이미 같은 orderId를 가진 주문이 있는지 확인
      if (payloadOrderId) {
        const existingOrder = state.orders.find(order => 
          order.id === payloadOrderId || order.orderId === payloadOrderId
        );
        if (existingOrder) {
          logger.log('🔄 중복 주문 생성 방지:', payloadOrderId);
          state.currentOrder = existingOrder;
          return; // 중복 생성 방지
        }
      }
      
      // 새로운 orderId 생성 (payload에 없는 경우만)
      const orderId = payloadOrderId || generateOrderId();
      const newOrder = {
        ...action.payload,
        id: orderId,
        orderId: orderId, // id와 orderId를 동일하게 설정
        createdAt: action.payload.createdAt || new Date().toISOString(),
        orderStatus: action.payload.orderStatus || ORDER_STATUS.WAITING,
        statusHistory: action.payload.statusHistory || [
          {
            orderStatus: action.payload.orderStatus || ORDER_STATUS.WAITING,
            timestamp: new Date().toISOString(),
            message: "주문이 접수되었습니다."
          }
        ]
      };
      
      logger.log('📦 새 주문 Redux에 추가:', { id: newOrder.id, orderId: newOrder.orderId });
      state.orders.unshift(newOrder); // 최신 주문을 맨 앞에 추가
      state.currentOrder = newOrder;
      saveOrdersToStorage(state.orders);
    },

    // 주문 전체 업데이트 (상태 포함)
    updateOrder(state, action) {
      const updatedOrder = action.payload;
      const orderIndex = state.orders.findIndex(order => order.id === updatedOrder.id);
      
      if (orderIndex !== -1) {
        // 기존 주문을 새로운 주문으로 교체
        state.orders[orderIndex] = updatedOrder;
        
        // 현재 주문이 업데이트된 주문이라면 currentOrder도 업데이트
        if (state.currentOrder && state.currentOrder.id === updatedOrder.id) {
          state.currentOrder = updatedOrder;
        }

        // 로컬스토리지 업데이트
        saveOrdersToStorage(state.orders);
        logger.log(`📝 주문 ${updatedOrder.id} 전체 업데이트 완료`);
      } else {
        logger.error(`주문을 찾을 수 없음: ${updatedOrder.id}`);
      }
    },

    // 주문 상태만 업데이트 (이전 버전과의 호환성을 위해 유지)
    updateOrderStatus(state, action) {
      const { orderId, orderStatus, message } = action.payload;
      
      // 상태 유효성 검증
      if (!isValidOrderStatus(orderStatus)) {
        logger.error(`Invalid order status: ${orderStatus}`);
        return;
      }
      
      const orderIndex = state.orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        const order = state.orders[orderIndex];
        
        // 상태가 실제로 변경된 경우에만 업데이트
        if (order.orderStatus !== orderStatus) {
          order.orderStatus = orderStatus;
          
          // statusHistory가 없으면 초기화
          if (!order.statusHistory) {
            order.statusHistory = [];
          }
          
          order.statusHistory.push({
            orderStatus,
            timestamp: new Date().toISOString(),
            message: message || `주문 상태가 ${orderStatus}로 변경되었습니다.`
          });

          // 현재 주문이 업데이트된 주문이라면 currentOrder도 업데이트
          if (state.currentOrder && state.currentOrder.id === orderId) {
            state.currentOrder = { ...order }; // 새로운 객체로 복사하여 리렌더링 트리거
          }

          // 상태가 변경되었을 때만 저장
          saveOrdersToStorage(state.orders);
          logger.log(`🔄 주문 ${orderId} 상태 업데이트: ${orderStatus}`);
        }
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
  extraReducers: (builder) => {
    builder
      // 주문 생성
      .addCase(createOrderAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrderAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        // 주문 생성 성공 시 주문 목록에 추가
        const newOrder = {
          ...action.payload,
          id: action.payload.id || generateOrderId(),
          orderId: action.payload.id || action.payload.orderId || generateOrderId(), // id와 orderId 동기화
          createdAt: new Date().toISOString(),
          statusHistory: [
            {
              orderStatus: action.payload.orderStatus || ORDER_STATUS.WAITING,
              timestamp: new Date().toISOString(),
              message: "주문이 접수되었습니다."
            }
          ]
        };
        state.orders.unshift(newOrder);
        state.currentOrder = newOrder;
        saveOrdersToStorage(state.orders);
      })
      .addCase(createOrderAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // 주문 목록 조회
      .addCase(fetchOrdersAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrdersAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders || [];
        state.hasNext = action.payload.hasNext || false;
        state.currentPage = action.payload.currentPage || 0;
        saveOrdersToStorage(state.orders);
      })
      .addCase(fetchOrdersAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // 주문 조회
      .addCase(fetchOrderByIdAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderByIdAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderByIdAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // 주문 상태 업데이트
      .addCase(updateOrderStatusAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatusAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const { orderId, orderStatus, message } = action.payload;
        const orderIndex = state.orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
          state.orders[orderIndex].orderStatus = orderStatus;
          
          // statusHistory가 없으면 초기화
          if (!state.orders[orderIndex].statusHistory) {
            state.orders[orderIndex].statusHistory = [];
          }
          
          state.orders[orderIndex].statusHistory.push({
            orderStatus,
            timestamp: new Date().toISOString(),
            message: message || `주문 상태가 ${orderStatus}로 변경되었습니다.`
          });
          if (state.currentOrder && state.currentOrder.id === orderId) {
            state.currentOrder = state.orders[orderIndex];
          }
          saveOrdersToStorage(state.orders);
        }
      })
      .addCase(updateOrderStatusAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // 주문 추적
      .addCase(trackOrderAsync.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
      });
  },
});

export const {
  initializeOrders,
  addOrder,
  updateOrder,
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
export const selectOrdersByStatus = (state, orderStatus) => 
  state.order?.orders?.filter(order => order.orderStatus === orderStatus) || [];
export const selectActiveOrders = (state) => 
  state.order?.orders?.filter(order => 
    [ORDER_STATUS.WAITING, ORDER_STATUS.COOKING, ORDER_STATUS.COOKED, 
     ORDER_STATUS.RIDER_READY, ORDER_STATUS.DELIVERING].includes(order.orderStatus)
  ) || [];
export const selectCompletedOrders = (state) => 
  state.order?.orders?.filter(order => 
    [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELED].includes(order.orderStatus)
  ) || [];
export const selectIsLoading = (state) => state.order?.isLoading || false;
export const selectError = (state) => state.order?.error || null;

export default orderSlice.reducer; 
