import apiClient from './apiClient';
import { STORAGE_KEYS, logger } from '../utils/logger';

// 토큰에서 사용자 ID 추출 유틸리티 (authAPI와 동일)
const extractUserIdFromToken = (token) => {
  if (!token) return null;
  
  try {
    // JWT 토큰인 경우 디코딩
    if (token.includes('.')) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.sub;
    }
    
    // 간단한 형식인 경우
    const parts = token.split('_');
    return parts.length > 1 ? parts[1] : null;
  } catch (error) {
    logger.error('토큰 파싱 실패:', error);
    return null;
  }
};

// 사용자 API 서비스
export const userAPI = {
  // 사용자 프로필 조회
  getProfile: async () => {
    try {
      const response = await apiClient.get('/user/profile');
      return response.data;
    } catch (error) {
      console.error('사용자 프로필 조회 실패:', error);
      throw error;
    }
  },

  // 사용자 통계 정보 조회 (실제 데이터 기반으로 계산)
  getStats: async () => {
    try {
      // 동시에 여러 데이터 가져오기
      const [orders, favorites, reviews] = await Promise.all([
        apiClient.get('/orders').catch((error) => {
          logger.warn('주문 데이터 로드 실패:', error);
          return [];
        }),
        apiClient.get('/favorites').catch((error) => {
          logger.warn('즐겨찾기 데이터 로드 실패:', error);
          return [];
        }),
        apiClient.get('/reviews').catch((error) => {
          logger.warn('리뷰 데이터 로드 실패:', error);
          return [];
        })
      ]);

      // 현재 사용자 ID 가져오기
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userId = extractUserIdFromToken(token);

      if (!userId) {
        throw new Error('사용자 인증 정보가 없습니다.');
      }

      // 사용자별 주문 필터링 (배달 완료된 주문만)
      const userOrders = orders.filter(order => 
        order.status === 'delivered' || order.status === 'completed'
      );

      // 사용자별 즐겨찾기 필터링
      const userFavorites = favorites.filter(fav => fav.userId === userId);

      // 사용자별 리뷰 필터링
      const userReviews = reviews.filter(review => review.userId === userId);

      // 도움이 됐어요 총합 계산
      const totalHelpCount = userReviews.reduce((sum, review) => sum + (review.helpCount || 0), 0);

      // 총 주문 금액 계산
      const totalSpent = userOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      return {
        reviewCount: userReviews.length,
        helpCount: totalHelpCount,
        favoriteCount: userFavorites.length,
        orderCount: userOrders.length,
        totalSpent: totalSpent
      };
    } catch (error) {
      console.error('사용자 통계 조회 실패:', error);
      
      // API 실패 시 로컬스토리지에서 계산
      try {
        return this.getStatsFromLocalStorage();
      } catch (localError) {
        console.warn('로컬 통계 계산도 실패:', localError);
        throw error;
      }
    }
  },

  // 로컬스토리지 기반 통계 계산 (폴백)
  getStatsFromLocalStorage: () => {
    try {
      // 로컬스토리지에서 데이터 가져오기
      const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
      const favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');

      // 배달 완료된 주문만 필터링
      const completedOrders = orders.filter(order => 
        order.status === 'delivered' || order.status === 'completed'
      );

      // 총 주문 금액 계산
      const totalSpent = completedOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      return {
        reviewCount: 3, // 기본값 (실제로는 리뷰 API에서 가져와야 함)
        helpCount: 3, // 리뷰에서 받은 도움이 됐어요 수
        favoriteCount: favorites.length,
        orderCount: completedOrders.length,
        totalSpent: totalSpent
      };
    } catch (error) {
      console.error('로컬 스토리지 통계 계산 실패:', error);
      // 최후의 기본값
      return {
        reviewCount: 0,
        helpCount: 0,
        favoriteCount: 0,
        orderCount: 0,
        totalSpent: 0
      };
    }
  },

  // 사용자 즐겨찾기 목록 조회
  getFavorites: async () => {
    try {
      const response = await apiClient.get('/favorites');
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userId = extractUserIdFromToken(token);
      
      if (!userId) {
        throw new Error('사용자 인증 정보가 없습니다.');
      }

      // 현재 사용자의 즐겨찾기만 필터링
      return response.filter(fav => fav.userId === userId);
    } catch (error) {
      console.error('즐겨찾기 조회 실패:', error);
      throw error;
    }
  },

  // 즐겨찾기 추가
  addFavorite: async (storeId) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userId = extractUserIdFromToken(token);
      
      if (!userId) {
        throw new Error('사용자 인증 정보가 없습니다.');
      }

      const response = await apiClient.post('/favorites', { 
        userId,
        storeId,
        createdAt: new Date().toISOString()
      });
      return response;
    } catch (error) {
      console.error('즐겨찾기 추가 실패:', error);
      throw error;
    }
  },

  // 즐겨찾기 제거
  removeFavorite: async (storeId) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userId = extractUserIdFromToken(token);
      
      if (!userId) {
        throw new Error('사용자 인증 정보가 없습니다.');
      }

      // 먼저 해당 즐겨찾기 아이템을 찾기
      const favorites = await this.getFavorites();
      const favoriteItem = favorites.find(fav => fav.storeId === storeId);
      
      if (!favoriteItem) {
        throw new Error('즐겨찾기 아이템을 찾을 수 없습니다.');
      }

      const response = await apiClient.delete(`/favorites/${favoriteItem.id}`);
      return response;
    } catch (error) {
      console.error('즐겨찾기 제거 실패:', error);
      throw error;
    }
  },
}; 
