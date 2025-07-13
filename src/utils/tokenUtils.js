// 토큰 관리 유틸리티
// ⚠️ 주의: 이 파일은 하위 호환성을 위해 유지됩니다.
// 새로운 코드에서는 AuthService를 사용하는 것을 권장합니다.
// import AuthService from '../services/authService';

import { STORAGE_KEYS } from './logger';

/**
 * 토큰 데이터 구조
 * @typedef {Object} TokenData
 * @property {string} token - 실제 토큰 값
 * @property {number} expiresAt - 만료 시간 (timestamp)
 * @property {number} issuedAt - 발급 시간 (timestamp)
 */

/**
 * 토큰 데이터 구조 검증
 * @param {any} data - 검증할 데이터
 * @returns {boolean} 유효한 토큰 데이터인지 여부
 */
export const validateTokenData = (data) => {
  try {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // 필수 필드 존재 확인
    if (!data.token || typeof data.token !== 'string') {
      return false;
    }
    if (!data.expiresAt || typeof data.expiresAt !== 'number') {
      return false;
    }
    if (!data.issuedAt || typeof data.issuedAt !== 'number') {
      return false;
    }

    // 시간 값 유효성 확인
    if (data.expiresAt <= 0 || data.issuedAt <= 0) {
      return false;
    }
    if (data.issuedAt > data.expiresAt) {
      return false;
    }

    // 토큰 값 유효성 확인 (최소 길이 등)
    if (data.token.length < 10) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('토큰 데이터 검증 실패:', error);
    return false;
  }
};

/**
 * 토큰 데이터 검증 결과 상세 분석
 * @param {any} data - 검증할 데이터
 * @returns {Object} 검증 결과와 상세 정보
 */
export const validateTokenDataDetailed = (data) => {
  const result = {
    isValid: false,
    errors: [],
    warnings: []
  };

  try {
    if (!data) {
      result.errors.push('데이터가 없습니다');
      return result;
    }

    if (typeof data !== 'object') {
      result.errors.push('데이터가 객체가 아닙니다');
      return result;
    }

    // 필수 필드 존재 확인
    if (!data.token) {
      result.errors.push('토큰 필드가 없습니다');
    } else if (typeof data.token !== 'string') {
      result.errors.push('토큰이 문자열이 아닙니다');
    } else if (data.token.length < 10) {
      result.errors.push('토큰이 너무 짧습니다 (최소 10자)');
    }

    if (!data.expiresAt) {
      result.errors.push('만료 시간 필드가 없습니다');
    } else if (typeof data.expiresAt !== 'number') {
      result.errors.push('만료 시간이 숫자가 아닙니다');
    } else if (data.expiresAt <= 0) {
      result.errors.push('만료 시간이 유효하지 않습니다');
    }

    if (!data.issuedAt) {
      result.errors.push('발급 시간 필드가 없습니다');
    } else if (typeof data.issuedAt !== 'number') {
      result.errors.push('발급 시간이 숫자가 아닙니다');
    } else if (data.issuedAt <= 0) {
      result.errors.push('발급 시간이 유효하지 않습니다');
    }

    // 시간 관계 검증
    if (data.issuedAt && data.expiresAt && data.issuedAt > data.expiresAt) {
      result.errors.push('발급 시간이 만료 시간보다 늦습니다');
    }

    // 경고 사항
    if (data.expiresAt && Date.now() > data.expiresAt) {
      result.warnings.push('토큰이 이미 만료되었습니다');
    }

    if (data.token && data.token.length > 1000) {
      result.warnings.push('토큰이 비정상적으로 깁니다');
    }

    result.isValid = result.errors.length === 0;
    return result;
  } catch (error) {
    result.errors.push(`검증 중 오류 발생: ${error.message}`);
    return result;
  }
};

/**
 * 토큰을 안전한 형식으로 저장
 * @param {string} token - 저장할 토큰
 * @param {number} expiresIn - 만료 시간 (밀리초, 기본값: 24시간)
 * @deprecated AuthService.setToken() 사용을 권장합니다
 */
export const saveToken = (token, expiresIn = 24 * 60 * 60 * 1000) => {
  if (!token || typeof token !== 'string') {
    throw new Error('유효한 토큰이 제공되지 않았습니다.');
  }

  if (token.length < 10) {
    throw new Error('토큰이 너무 짧습니다.');
  }

  if (expiresIn <= 0) {
    throw new Error('만료 시간은 0보다 커야 합니다.');
  }

  const tokenData = {
    token,
    expiresAt: Date.now() + expiresIn,
    issuedAt: Date.now()
  };

  // 저장 전 검증
  if (!validateTokenData(tokenData)) {
    throw new Error('생성된 토큰 데이터가 유효하지 않습니다.');
  }

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
 * @deprecated AuthService.getToken() 사용을 권장합니다
 */
export const getTokenData = () => {
  try {
    const tokenData = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!tokenData) return null;

    // 먼저 JSON 파싱 시도
    let parsed;
    try {
      parsed = JSON.parse(tokenData);
    } catch (parseError) {
      // JSON 파싱 실패 시 문자열로 처리 (JWT 토큰의 정상적인 경우)
      // JWT 토큰에서 만료 시간 추출 시도
      let expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 기본값: 24시간
      try {
        const parts = tokenData.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp) {
            expiresAt = payload.exp * 1000; // JWT exp는 초 단위
          }
        }
      } catch (e) {
        // JWT 파싱 실패 시 기본값 사용
      }
      return {
        token: tokenData,
        expiresAt: expiresAt,
        issuedAt: Date.now()
      };
    }
    
    // 기존 형식 호환성 (문자열로 저장된 경우)
    if (typeof parsed === 'string') {
      // JWT 토큰에서 만료 시간 추출 시도
      let expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 기본값: 24시간
      try {
        const parts = parsed.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp) {
            expiresAt = payload.exp * 1000; // JWT exp는 초 단위
          }
        }
      } catch (e) {
        // JWT 파싱 실패 시 기본값 사용
      }
      return {
        token: parsed,
        expiresAt: expiresAt,
        issuedAt: Date.now()
      };
    }

    // 객체 구조 검증
    if (typeof parsed === 'object' && parsed !== null) {
      if (!parsed.token || typeof parsed.token !== 'string') {
        // logger.warn('토큰 데이터에 유효한 토큰이 없습니다:', parsed); // Original code had this line commented out
        return null;
      }
      return parsed;
    }

    // logger.warn('알 수 없는 토큰 데이터 형식:', parsed); // Original code had this line commented out
    return null;
  } catch (error) {
    // logger.error('토큰 데이터 조회 중 오류 발생:', error); // Original code had this line commented out
    return null;
  }
};

/**
 * 토큰 값만 조회
 * @returns {string|null} 토큰 값 또는 null
 * @deprecated AuthService.getToken() 사용을 권장합니다
 */
export const getToken = () => {
  const tokenData = getTokenData();
  return tokenData ? tokenData.token : null;
};

/**
 * 토큰 유효성 검사
 * @returns {boolean} 토큰이 유효한지 여부
 * @deprecated AuthService.isAuthenticated() 사용을 권장합니다
 */
export const isTokenValid = () => {
  const tokenData = getTokenData();
  if (!tokenData) return false;

  // 만료 시간 확인
  if (Date.now() > tokenData.expiresAt) {
    console.warn('토큰이 만료되었습니다');
    clearToken();
    return false;
  }

  // 토큰 값 유효성 확인
  if (!tokenData.token || tokenData.token.length < 10) {
    console.warn('토큰 값이 유효하지 않습니다');
    clearToken();
    return false;
  }

  return true;
};

/**
 * 토큰 만료까지 남은 시간 (밀리초)
 * @returns {number} 남은 시간 (밀리초), 만료된 경우 0
 * @deprecated AuthService를 사용하여 토큰 만료 시간을 확인하세요
 */
export const getTokenTimeRemaining = () => {
  const tokenData = getTokenData();
  if (!tokenData) return 0;

  const remaining = tokenData.expiresAt - Date.now();
  return Math.max(0, remaining);
};

/**
 * 토큰 만료까지 남은 시간 (분)
 * @returns {number} 남은 시간 (분), 만료된 경우 0
 * @deprecated AuthService를 사용하여 토큰 만료 시간을 확인하세요
 */
export const getTokenMinutesRemaining = () => {
  const timeRemaining = getTokenTimeRemaining();
  return Math.floor(timeRemaining / (60 * 1000));
};

/**
 * 토큰이 곧 만료되는지 확인
 * @param {number} warningMinutes - 경고 시간 (분, 기본값: 5)
 * @returns {boolean} 곧 만료되는지 여부
 * @deprecated AuthService를 사용하여 토큰 만료 시간을 확인하세요
 */
export const isTokenExpiringSoon = (warningMinutes = 5) => {
  const minutesRemaining = getTokenMinutesRemaining();
  return minutesRemaining <= warningMinutes && minutesRemaining > 0;
};

/**
 * 토큰 삭제
 * @deprecated AuthService.removeToken() 사용을 권장합니다
 */
export const clearToken = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    console.log('토큰이 삭제되었습니다');
  } catch (error) {
    console.error('토큰 삭제 실패:', error);
  }
};

/**
 * 토큰 정보 조회 (디버깅용)
 * @returns {Object} 토큰 정보
 * @deprecated AuthService를 사용하여 토큰 정보를 확인하세요
 */
export const getTokenInfo = () => {
  const tokenData = getTokenData();
  if (!tokenData) {
    return {
      hasToken: false,
      isValid: false,
      message: '토큰이 없습니다'
    };
  }

  const now = Date.now();
  const isExpired = now > tokenData.expiresAt;
  const timeRemaining = Math.max(0, tokenData.expiresAt - now);
  const minutesRemaining = Math.floor(timeRemaining / (60 * 1000));

  return {
    hasToken: true,
    isValid: !isExpired && tokenData.token.length >= 10,
    isExpired,
    timeRemaining,
    minutesRemaining,
    expiresAt: new Date(tokenData.expiresAt).toISOString(),
    issuedAt: new Date(tokenData.issuedAt).toISOString(),
    tokenLength: tokenData.token.length,
    message: isExpired 
      ? '토큰이 만료되었습니다' 
      : `토큰이 유효합니다 (${minutesRemaining}분 남음)`
  };
};

/**
 * 토큰 복구 시도 (오류 발생 시)
 * @returns {boolean} 복구 성공 여부
 * @deprecated AuthService를 사용하여 토큰을 관리하세요
 */
export const attemptTokenRecovery = () => {
  try {
    const tokenData = getTokenData();
    if (!tokenData) {
      console.log('복구할 토큰이 없습니다');
      return false;
    }

    // 토큰 데이터 검증
    const validation = validateTokenDataDetailed(tokenData);
    if (!validation.isValid) {
      console.warn('토큰 데이터 검증 실패:', validation.errors);
      clearToken();
      return false;
    }

    // 만료 확인
    if (Date.now() > tokenData.expiresAt) {
      console.warn('토큰이 만료되어 복구할 수 없습니다');
      clearToken();
      return false;
    }

    console.log('토큰 복구 성공');
    return true;
  } catch (error) {
    console.error('토큰 복구 실패:', error);
    clearToken();
    return false;
  }
}; 
