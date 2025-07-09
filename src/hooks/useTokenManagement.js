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

  // Redux 상태
  const token = useSelector(selectToken);
  const isValid = useSelector(selectIsTokenValid);
  const isLoading = useSelector(selectIsTokenLoading);
  const error = useSelector(selectTokenError);
  const timeRemaining = useSelector(selectTokenTimeRemaining);
  const isExpiringSoon = useSelector(selectIsTokenExpiringSoon);
  const lastChecked = useSelector(selectTokenLastChecked);

  // 토큰 저장
  const saveToken = useCallback((tokenValue, expiresIn) => {
    return dispatch(saveTokenAsync({ token: tokenValue, expiresIn }));
  }, [dispatch]);

  // 토큰 검증
  const validateToken = useCallback(() => {
    return dispatch(validateTokenAsync());
  }, [dispatch]);

  // 토큰 갱신
  const refreshToken = useCallback(() => {
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

  // 자동 갱신 스케줄링
  const scheduleRefresh = useCallback(() => {
    if (!autoRefresh || !isValid || isLoading) return;

    const minutesRemaining = Math.floor(timeRemaining / (60 * 1000));
    
    // 만료 5분 전에 갱신 시도
    if (minutesRemaining <= warningMinutes && minutesRemaining > 0) {
      const refreshDelay = (minutesRemaining - 1) * 60 * 1000; // 1분 전에 갱신
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        refreshToken().then((result) => {
          if (result.error) {
            console.warn('토큰 자동 갱신 실패:', result.error);
            if (autoLogout) {
              handleLogout();
            }
          }
        });
      }, refreshDelay);
    }
  }, [autoRefresh, isValid, isLoading, timeRemaining, warningMinutes, refreshToken, autoLogout, handleLogout]);

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
  }, [dispatch, startTokenMonitoring, stopTokenMonitoring]);

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

  // 토큰 정보 (디버깅용)
  const tokenInfo = {
    token: token ? `${token.substring(0, 10)}...` : null,
    isValid,
    isLoading,
    error,
    timeRemaining,
    minutesRemaining: Math.floor(timeRemaining / (60 * 1000)),
    isExpiringSoon,
    lastChecked: lastChecked ? new Date(lastChecked).toLocaleTimeString() : null
  };

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
