import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authAPI';
import { userAPI } from '../services/userAPI';
import { ENV_CONFIG } from '../config/api';

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

  // 로컬스토리지에서 사용자 정보 가져오기
  const getCachedUser = () => {
    try {
      const cachedUser = localStorage.getItem('currentUser');
      return cachedUser ? JSON.parse(cachedUser) : null;
    } catch (error) {
      console.warn('캐시된 사용자 정보 파싱 실패:', error);
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

        // API에서 최신 사용자 정보 가져오기
        try {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          
          // 로컬스토리지 업데이트
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } catch (authError) {
          console.warn('API 사용자 정보 조회 실패, 기본 사용자 설정:', authError);
          
          // 개발 환경이거나 캐시된 사용자가 없는 경우 기본 사용자 설정
          if (ENV_CONFIG.isDevelopment || !cachedUser) {
            const defaultUser = {
              id: "user-001",
              name: "송준경",
              email: "user@example.com",
              phone: "010-1234-6888"
            };
            setUser(defaultUser);
            localStorage.setItem('currentUser', JSON.stringify(defaultUser));
            
            // 기본 토큰도 설정
            if (!localStorage.getItem('authToken')) {
              const defaultToken = 'token_user-001_default';
              localStorage.setItem('authToken', defaultToken);
            }
          }
        }

        // 사용자 통계 정보 로드
        try {
          const stats = await userAPI.getStats();
          setUserStats(stats);
        } catch (statsError) {
          console.warn('사용자 통계 로딩 실패:', statsError);
          // 통계 로딩 실패는 치명적이지 않으므로 기본값 유지
        }

      } catch (error) {
        console.error('사용자 데이터 로딩 실패:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    // 항상 사용자 정보 로드 (토큰이 없으면 기본 사용자 설정)
    loadUserData();
  }, []);

  // 로그인 상태 확인
  const isLoggedIn = () => {
    const token = localStorage.getItem('authToken');
    return !!(token && user);
  };

  // 사용자 정보 새로고침
  const refreshUserData = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      setLoading(true);
      const [currentUser, stats] = await Promise.all([
        getCurrentUser(),
        userAPI.getStats()
      ]);
      
      setUser(currentUser);
      setUserStats(stats);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
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
