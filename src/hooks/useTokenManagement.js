import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  initializeToken, 
  updateTokenState, 
  logout,
  saveTokenAsync,
  validateTokenAsync,
  refreshTokenAsync,
  selectToken,
  selectIsTokenValid,
  selectIsTokenLoading,
  selectTokenError,
  selectTokenTimeRemaining,
  selectIsTokenExpiringSoon,
  selectTokenLastChecked
} from '../store/tokenSlice';

/**
 * 토큰 관리 커스텀 훅
 * @param {Object} options - 설정 옵션
 * @param {number} options.checkInterval - 토큰 상태 확인 간격 (밀리초, 기본값: 30초)
 * @param {number} options.warningMinutes - 만료 경고 시간 (분, 기본값: 5분)
 * @param {boolean} options.autoRefresh - 자동 갱신 활성화 (기본값: true)
 * @param {boolean} options.autoLogout - 만료 시 자동 로그아웃 (기본값: true)
 * @returns {Object} 토큰 관리 상태 및 함수들
 */
export const useTokenManagement = (options = {}) => {
  const {
    checkInterval = 30 * 1000, // 30초
    warningMinutes = 5,
    autoRefresh = true,
    autoLogout = true
  } = options;

  const dispatch = useDispatch();
  const intervalRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  // Redux 상태 (안전한 접근)
  const token = useSelector(selectToken) || null;
  const isValid = useSelector(selectIsTokenValid) || false;
  const isLoading = useSelector(selectIsTokenLoading) || false;
  const error = useSelector(selectTokenError) || null;
  const timeRemaining = useSelector(selectTokenTimeRemaining) || 0;
  const isExpiringSoon = useSelector(selectIsTokenExpiringSoon) || false;
  const lastChecked = useSelector(selectTokenLastChecked) || null;

  // 토큰 저장
  const saveToken = useCallback((tokenValue, expiresIn) => {
    return dispatch(saveTokenAsync({ token: tokenValue, expiresIn }));
  }, [dispatch]);

  // 토큰 검증
  const validateToken = useCallback(() => {
    return dispatch(validateTokenAsync());
  }, [dispatch]);

  // 토큰 갱신 (현재 백엔드 지원 대기 중)
  const refreshToken = useCallback(() => {
    console.warn('토큰 갱신 기능은 현재 지원되지 않습니다. 백엔드 구현 대기 중입니다.');
    return dispatch(refreshTokenAsync());
  }, [dispatch]);

  // 로그아웃
  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  // 토큰 상태 업데이트
  const updateTokenStatus = useCallback(() => {
    dispatch(updateTokenState());
  }, [dispatch]);

  // 자동 갱신 스케줄링 (현재 백엔드 지원 대기 중)
  const scheduleRefresh = useCallback(() => {
    if (!autoRefresh || !isValid || isLoading) return;

    // 갱신 시점 계산 (warningMinutes 또는 1분 중 작은 값)
    const refreshBeforeMinutes = Math.min(warningMinutes, 1);
    const refreshThreshold = refreshBeforeMinutes * 60 * 1000;
    
    if (timeRemaining > 0 && timeRemaining <= warningMinutes * 60 * 1000) {
      const refreshDelay = Math.max(timeRemaining - refreshThreshold, 0);
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        const minutesRemaining = Math.floor(timeRemaining / (60 * 1000));
        // 현재는 갱신 시도하지 않고 경고만 표시
        console.warn(`토큰이 곧 만료됩니다 (${minutesRemaining}분 남음). 백엔드 갱신 API 구현 대기 중입니다.`);
        
        // TODO: 백엔드 API 구현 후 아래 주석 해제
        // refreshToken().then((result) => {
        //   if (result.error) {
        //     console.warn('토큰 자동 갱신 실패:', result.error);
        //     if (autoLogout) {
        //       handleLogout();
        //   }
        //   }
        // });
      }, refreshDelay);
    }
  }, [autoRefresh, isValid, isLoading, timeRemaining, warningMinutes, autoLogout, handleLogout]);

  // 주기적 토큰 상태 확인
  const startTokenMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      updateTokenStatus();
      scheduleRefresh();
    }, checkInterval);
  }, [checkInterval, updateTokenStatus, scheduleRefresh]);

  // 토큰 모니터링 중지
  const stopTokenMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    dispatch(initializeToken());
    startTokenMonitoring();

    return () => {
      stopTokenMonitoring();
    };
  }, []); // 의존성 배열을 빈 배열로 변경

  // 토큰 상태 변경 시 갱신 스케줄링
  useEffect(() => {
    scheduleRefresh();
  }, [scheduleRefresh]);

  // 토큰이 만료되면 자동 로그아웃
  useEffect(() => {
    if (autoLogout && !isValid && token) {
      console.warn('토큰이 만료되어 자동 로그아웃됩니다.');
      handleLogout();
    }
  }, [autoLogout, isValid, token, handleLogout]);

  // 페이지 포커스 시 토큰 상태 확인
  useEffect(() => {
    const handleFocus = () => {
      updateTokenStatus();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [updateTokenStatus]);

  // 토큰 정보 (디버깅용 - 개발 환경에서만)
  const tokenInfo = import.meta.env.DEV ? {
    token: token ? `${token.substring(0, 10)}...` : null,
    isValid,
    isLoading,
    error,
    timeRemaining,
    minutesRemaining: Math.floor(timeRemaining / (60 * 1000)),
    isExpiringSoon,
    lastChecked: lastChecked ? new Date(lastChecked).toLocaleTimeString() : null
  } : null;

  return {
    // 상태
    token,
    isValid,
    isLoading,
    error,
    timeRemaining,
    isExpiringSoon,
    tokenInfo,

    // 액션
    saveToken,
    validateToken,
    refreshToken,
    logout: handleLogout,
    updateTokenStatus,

    // 모니터링 제어
    startTokenMonitoring,
    stopTokenMonitoring
  };
}; 
