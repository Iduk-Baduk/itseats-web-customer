import apiClient from './apiClient';

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

  // 사용자 통계 정보 조회
  getStats: async () => {
    try {
      const response = await apiClient.get('/user/stats');
      return response.data;
    } catch (error) {
      console.error('사용자 통계 조회 실패:', error);
      throw error;
    }
  },

  // 사용자 즐겨찾기 목록 조회
  getFavorites: async () => {
    try {
      const response = await apiClient.get('/user/favorites');
      return response.data;
    } catch (error) {
      console.error('즐겨찾기 조회 실패:', error);
      throw error;
    }
  },

  // 즐겨찾기 추가
  addFavorite: async (storeId) => {
    try {
      const response = await apiClient.post('/user/favorites', { storeId });
      return response.data;
    } catch (error) {
      console.error('즐겨찾기 추가 실패:', error);
      throw error;
    }
  },

  // 즐겨찾기 제거
  removeFavorite: async (storeId) => {
    try {
      const response = await apiClient.delete(`/user/favorites/${storeId}`);
      return response.data;
    } catch (error) {
      console.error('즐겨찾기 제거 실패:', error);
      throw error;
    }
  },
}; 
