// 토큰 관리 유틸리티
import { STORAGE_KEYS } from './logger';

/**
 * 토큰 데이터 구조
 * @typedef {Object} TokenData
 * @property {string} token - 실제 토큰 값
 * @property {number} expiresAt - 만료 시간 (timestamp)
 * @property {number} issuedAt - 발급 시간 (timestamp)
 */

/**
 * 토큰을 안전한 형식으로 저장
 * @param {string} token - 저장할 토큰
 * @param {number} expiresIn - 만료 시간 (밀리초, 기본값: 24시간)
 */
export const saveToken = (token, expiresIn = 24 * 60 * 60 * 1000) => {
  if (!token) {
    throw new Error('토큰이 제공되지 않았습니다.');
  }

  const tokenData = {
    token,
    expiresAt: Date.now() + expiresIn,
    issuedAt: Date.now()
  };

  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(tokenData));
  } catch (error) {
    console.error('토큰 저장 실패:', error);
    throw new Error('토큰을 저장할 수 없습니다.');
  }
};

/**
 * 저장된 토큰 데이터 조회
 * @returns {TokenData|null} 토큰 데이터 또는 null
 */
export const getTokenData = () => {
  try {
    const tokenData = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!tokenData) return null;

    const parsed = JSON.parse(tokenData);
    
    // 기존 형식 호환성 (문자열로 저장된 경우)
    if (typeof parsed === 'string') {
      return {
        token: parsed,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24시간 후 만료로 가정
        issuedAt: Date.now()
      };
    }

    return parsed;
  } catch (error) {
    console.error('토큰 데이터 파싱 실패:', error);
    clearToken();
    return null;
  }
};

/**
 * 토큰 값만 조회
 * @returns {string|null} 토큰 값 또는 null
 */
export const getToken = () => {
  const tokenData = getTokenData();
  return tokenData?.token || null;
};

/**
 * 토큰 유효성 검사
 * @returns {boolean} 토큰 유효 여부
 */
export const isTokenValid = () => {
  const tokenData = getTokenData();
  if (!tokenData) return false;

  const now = Date.now();
  const isValid = tokenData.token && now < tokenData.expiresAt;

  // 만료된 토큰 자동 삭제
  if (!isValid && tokenData.token) {
    clearToken();
  }

  return isValid;
};

/**
 * 토큰 만료까지 남은 시간 (밀리초)
 * @returns {number} 남은 시간 (밀리초), 만료된 경우 0
 */
export const getTokenTimeRemaining = () => {
  const tokenData = getTokenData();
  if (!tokenData) return 0;

  const remaining = tokenData.expiresAt - Date.now();
  return Math.max(0, remaining);
};

/**
 * 토큰 만료까지 남은 시간 (분)
 * @returns {number} 남은 시간 (분)
 */
export const getTokenMinutesRemaining = () => {
  return Math.floor(getTokenTimeRemaining() / (60 * 1000));
};

/**
 * 토큰이 곧 만료되는지 확인 (기본값: 5분 전)
 * @param {number} warningMinutes - 경고할 시간 (분)
 * @returns {boolean} 곧 만료되는지 여부
 */
export const isTokenExpiringSoon = (warningMinutes = 5) => {
  const minutesRemaining = getTokenMinutesRemaining();
  return minutesRemaining > 0 && minutesRemaining <= warningMinutes;
};

/**
 * 토큰 삭제
 */
export const clearToken = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('토큰 삭제 실패:', error);
  }
};

/**
 * 토큰 정보 조회 (디버깅용)
 * @returns {Object} 토큰 정보
 */
export const getTokenInfo = () => {
  const tokenData = getTokenData();
  if (!tokenData) {
    return {
      hasToken: false,
      isValid: false,
      timeRemaining: 0,
      minutesRemaining: 0,
      isExpiringSoon: false
    };
  }

  const timeRemaining = getTokenTimeRemaining();
  const minutesRemaining = getTokenMinutesRemaining();

  return {
    hasToken: true,
    isValid: isTokenValid(),
    timeRemaining,
    minutesRemaining,
    isExpiringSoon: isTokenExpiringSoon(),
    issuedAt: new Date(tokenData.issuedAt).toISOString(),
    expiresAt: new Date(tokenData.expiresAt).toISOString()
  };
}; 
