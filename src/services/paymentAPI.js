import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { logger } from '../utils/logger';

// 재시도 설정
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryBackoff: 2,
};

// 재시도 로직
const retryRequest = async (requestFn, retryCount = 0) => {
  try {
    return await requestFn();
  } catch (error) {
    const isRetryableError = 
      error.statusCode >= 500 || 
      error.statusCode === 0 || 
      error.type === 'NETWORK_ERROR';
    
    if (isRetryableError && retryCount < RETRY_CONFIG.maxRetries) {
      const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.retryBackoff, retryCount);
      logger.warn(`📡 결제 API 재시도 ${retryCount + 1}/${RETRY_CONFIG.maxRetries} (${delay}ms 후)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retryCount + 1);
    }
    
    throw error;
  }
};

  // 결제 수단 API 서비스
export const paymentAPI = {
  // 결제 생성 API (백엔드 명세에 맞게 추가)
  createPayment: async (paymentData) => {
    try {
      logger.log('📡 결제 생성 요청:', paymentData);
      
      const response = await retryRequest(() => 
        apiClient.post('/payments', paymentData)
      );
      
      logger.log('✅ 결제 생성 성공:', response.data);
      return response;
    } catch (error) {
      logger.error('❌ 결제 생성 실패:', error);
      
      // 백엔드 에러 응답 처리
      if (error.originalError?.response?.data?.message) {
        error.message = error.originalError.response.data.message;
      } else if (error.statusCode === 400) {
        error.message = '잘못된 결제 정보입니다.';
      } else if (error.statusCode === 404) {
        error.message = '주문을 찾을 수 없습니다.';
      } else if (error.statusCode === 500) {
        error.message = '서버 내부 오류가 발생했습니다.';
      } else {
        error.message = '결제 생성 중 오류가 발생했습니다.';
      }
      
      throw error;
    }
  },

  // 결제 확인 API (백엔드 명세에 맞게 추가)
  confirmPayment: async (paymentId) => {
    try {
      logger.log('📡 결제 확인 요청:', paymentId);
      
      const response = await retryRequest(() => 
        apiClient.post(`/payments/${paymentId}/confirm`)
      );
      
      logger.log('✅ 결제 확인 성공:', response.data);
      return response;
    } catch (error) {
      logger.error('❌ 결제 확인 실패:', error);
      
      // 백엔드 에러 응답 처리
      if (error.originalError?.response?.data?.message) {
        error.message = error.originalError.response.data.message;
      } else if (error.statusCode === 404) {
        error.message = '결제를 찾을 수 없습니다.';
      } else if (error.statusCode === 500) {
        error.message = '서버 내부 오류가 발생했습니다.';
      } else {
        error.message = '결제 확인 중 오류가 발생했습니다.';
      }
      
      throw error;
    }
  },
  // 결제 수단 목록 조회 (백엔드 미구현으로 목업 데이터 사용)
  getPaymentMethods: async () => {
    try {
      // 백엔드에서 구현되지 않은 API들을 주석처리
      // TODO: 백엔드 API 구현 완료 후 주석 해제
      /*
      const [cards, accounts, coupayMoney] = await Promise.all([
        apiClient.get(API_ENDPOINTS.CARDS),
        apiClient.get(API_ENDPOINTS.ACCOUNTS),
        apiClient.get('/coupayMoney'),
      ]);
      */

      // 목업 데이터 반환 (토스페이먼츠만 사용 예정)
      const mockData = {
        cards: [
          {
            id: 'card-1',
            name: '신한카드',
            number: '****-****-****-1234',
            type: 'credit',
            isDefault: true
          }
        ],
        accounts: [
          {
            id: 'account-1',
            bank: '신한은행',
            number: '****-****-****-5678',
            type: 'checking',
            isDefault: true
          }
        ],
        coupayMoney: 50000 // 목업 쿠페이머니 잔액
      };

      logger.log('📡 결제 수단 목업 데이터 반환:', mockData);
      return mockData;
    } catch (error) {
      logger.error('❌ 결제 수단 조회 실패:', error);
      throw error;
    }
  },

  // 카드 추가 (백엔드 미구현으로 목업 응답)
  addCard: async (cardData) => {
    try {
      logger.log('📡 카드 추가 목업:', cardData);
      return {
        data: {
          id: `card-${Date.now()}`,
          ...cardData,
          createdAt: new Date().toISOString()
        }
      };
      // TODO: 백엔드 API 구현 완료 후 주석 해제
      // return await retryRequest(() => apiClient.post(API_ENDPOINTS.CARDS, cardData));
    } catch (error) {
      logger.error('❌ 카드 추가 실패:', error);
      throw error;
    }
  },

  // 계좌 추가 (백엔드 미구현으로 목업 응답)
  addAccount: async (accountData) => {
    try {
      logger.log('📡 계좌 추가 목업:', accountData);
      return {
        data: {
          id: `account-${Date.now()}`,
          ...accountData,
          createdAt: new Date().toISOString()
        }
      };
      // TODO: 백엔드 API 구현 완료 후 주석 해제
      // return await retryRequest(() => apiClient.post(API_ENDPOINTS.ACCOUNTS, accountData));
    } catch (error) {
      logger.error('❌ 계좌 추가 실패:', error);
      throw error;
    }
  },

  // 카드 삭제 (백엔드 미구현으로 목업 응답)
  deleteCard: async (cardId) => {
    try {
      logger.log('📡 카드 삭제 목업:', cardId);
      return { success: true };
      // TODO: 백엔드 API 구현 완료 후 주석 해제
      // return await retryRequest(() => apiClient.delete(API_ENDPOINTS.CARD_BY_ID(cardId)));
    } catch (error) {
      logger.error('❌ 카드 삭제 실패:', error);
      throw error;
    }
  },

  // 계좌 삭제 (백엔드 미구현으로 목업 응답)
  deleteAccount: async (accountId) => {
    try {
      logger.log('📡 계좌 삭제 목업:', accountId);
      return { success: true };
      // TODO: 백엔드 API 구현 완료 후 주석 해제
      // return await retryRequest(() => apiClient.delete(API_ENDPOINTS.ACCOUNT_BY_ID(accountId)));
    } catch (error) {
      logger.error('❌ 계좌 삭제 실패:', error);
      throw error;
    }
  },

  // 토스페이먼츠 결제 승인 (백엔드 API 호출)
  confirmTossPayment: async (paymentData) => {
    const { paymentId, paymentKey, orderId, amount } = paymentData;
    
    try {
      const requestData = {
        paymentKey,
        orderId,
        amount: Number(amount)
      };
      
      logger.log('📡 토스페이먼츠 결제 승인 요청:', { paymentId, requestData });
      
      // paymentId 유효성 검사 (문자열로 처리)
      if (!paymentId || typeof paymentId !== 'string' || !/^\d+$/.test(paymentId)) {
        throw new Error('유효하지 않은 paymentId입니다.');
      }
      
      // 백엔드 명세에 따른 올바른 엔드포인트 사용 (문자열 paymentId)
      const response = await retryRequest(() => 
        apiClient.post(API_ENDPOINTS.PAYMENT_CONFIRM(paymentId), requestData)
      );
      
      logger.log('✅ 토스페이먼츠 결제 승인 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('❌ 토스페이먼츠 결제 승인 실패:', error);
      
      // 백엔드 에러 응답 처리
      if (error.originalError?.response?.data?.message) {
        error.message = error.originalError.response.data.message;
      } else if (error.statusCode === 400) {
        error.message = '잘못된 금액이 입력되었습니다.';
      } else if (error.statusCode === 500) {
        error.message = '토스 서버 오류가 발생했습니다.';
      } else {
        error.message = '결제 승인 처리 중 오류가 발생했습니다.';
      }
      
      throw error;
    }
  },

  // 결제 상태 확인
  getPaymentStatus: async (paymentId) => {
    try {
      logger.log(`📡 결제 상태 확인 요청 (ID: ${paymentId})`);
      
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.PAYMENT_STATUS(paymentId))
      );
      
      logger.log(`✅ 결제 상태 확인 성공 (ID: ${paymentId}):`, response.data);
      return response.data;
    } catch (error) {
      logger.error(`❌ 결제 상태 확인 실패 (ID: ${paymentId}):`, error);
      
      if (error.statusCode === 404) {
        error.message = '결제 정보를 찾을 수 없습니다.';
      } else if (error.statusCode === 401) {
        error.message = '인증이 필요합니다.';
      } else {
        error.message = '결제 상태를 확인하는데 실패했습니다.';
      }
      
      throw error;
    }
  },

  // 결제 내역 조회
  getPaymentHistory: async (params = {}) => {
    try {
      const { page = 0, size = 20, ...rest } = params;
      
      logger.log('📡 결제 내역 조회 요청:', { page, size, ...rest });
      
      const response = await retryRequest(() => 
        apiClient.get(API_ENDPOINTS.PAYMENTS, { params: { page, size, ...rest } })
      );
      
      logger.log('✅ 결제 내역 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      logger.error('❌ 결제 내역 조회 실패:', error);
      
      if (error.statusCode === 401) {
        error.message = '인증이 필요합니다.';
      } else {
        error.message = '결제 내역을 불러오는데 실패했습니다.';
      }
      
      throw error;
    }
  },
};

export default paymentAPI; 
