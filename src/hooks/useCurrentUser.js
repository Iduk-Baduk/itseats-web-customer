import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authAPI';
import { userAPI } from '../services/userAPI';
import { ENV_CONFIG } from '../config/api';
import { STORAGE_KEYS, logger } from '../utils/logger';

export default function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState({
    reviewCount: 0,
    helpCount: 0,
    favoriteCount: 0,
    orderCount: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 캐시된 사용자 정보 가져오기
  const getCachedUser = () => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('캐시된 사용자 정보 파싱 실패:', error);
      return null;
    }
  };

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 먼저 캐시된 사용자 정보 사용
        const cachedUser = getCachedUser();
        if (cachedUser) {
          setUser(cachedUser);
        }

        // 토큰이 없으면 사용자 정보 로드하지 않음
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (!token) {
          setLoading(false);
          return;
        }

        // API에서 최신 사용자 정보 가져오기 (항상 백엔드 연동)
        try {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          setUserStats({
            reviewCount: currentUser.reviewCount || 0,
            helpCount: currentUser.helpCount || 0,
            favoriteCount: currentUser.favoriteCount || 0,
            orderCount: currentUser.orderCount || 0,
            totalSpent: currentUser.totalSpent || 0
          });

          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
        } catch (authError) {
          logger.error('API 사용자 정보 조회 실패:', authError);
          setError(authError.message);
        }

      } catch (error) {
        logger.error('사용자 데이터 로딩 실패:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    // 컴포넌트 마운트 시 사용자 정보 로드
    loadUserData();
  }, []);

  // 로그인 상태 확인
  const isLoggedIn = () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return !!(token && user);
  };

  // 사용자 정보 새로고침
  const refreshUserData = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return;

    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      
      setUser(currentUser);
      setUserStats({
        reviewCount: currentUser.reviewCount || 0,
        helpCount: currentUser.helpCount || 0,
        favoriteCount: currentUser.favoriteCount || 0,
        orderCount: currentUser.orderCount || 0,
        totalSpent: currentUser.totalSpent || 0
      });
      
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } catch (error) {
      console.error('사용자 정보 새로고침 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    userStats,
    loading,
    error,
    isLoggedIn: isLoggedIn(),
    refreshUserData,
  };
} 
