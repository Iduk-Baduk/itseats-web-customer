import apiClient from './apiClient';
import { STORAGE_KEYS, logger } from '../utils/logger';
import { API_ENDPOINTS } from '../config/api';
import AuthService from './authService';

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
      logger.warn(`📡 인증 API 재시도 ${retryCount + 1}/${RETRY_CONFIG.maxRetries} (${delay}ms 후)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retryCount + 1);
    }
    
    throw error;
  }
};

// 회원가입 API
export const regist = async (form) => {
  try {
    const sanitizedForm = { ...form, password: "[REDACTED]" };
    logger.log("📡 회원가입 요청 데이터:", sanitizedForm);

    const response = await retryRequest(() => 
      apiClient.post(API_ENDPOINTS.AUTH_REGISTER, form)
    );

    logger.log("✅ 회원가입 성공 응답:", response.data);

    return {
      success: true,
      user: {
        id: response.data.memberId,
        username: form.username,
        name: form.name,
        email: form.email,
        phone: form.phone,
      },
      message: '회원가입이 완료되었습니다.'
    };
  } catch (error) {
    logger.error('회원가입 실패:', error);
    
    // 백엔드 에러 메시지 처리
    if (error.originalError?.response?.data?.message) {
      error.message = error.originalError.response.data.message;
    } else if (error.statusCode === 409) {
      error.message = '이미 존재하는 사용자입니다.';
    } else if (error.statusCode === 422) {
      error.message = '입력 정보를 확인해주세요.';
    } else {
      error.message = '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.';
    }
    
    throw error;
  }
};

// 로그인 API
export const login = async ({ username, password, isAutoLogin }) => {
  try {
    if (!username || !password) {
      throw new Error('아이디와 비밀번호를 모두 입력해주세요.');
    }

    const response = await retryRequest(() => 
      apiClient.post(API_ENDPOINTS.AUTH_LOGIN, { username, password })
    );
    
    const accessToken = response.headers?.["access-token"] || response.data?.accessToken;
    const refreshToken = response.headers?.["refresh-token"] || response.data?.refreshToken;
    
    if (!accessToken) {
      throw new Error('로그인 토큰을 받지 못했습니다.');
    }
    
    // AuthService를 사용하여 토큰 저장
    AuthService.setToken(accessToken);
    if (refreshToken) {
      AuthService.setRefreshToken(refreshToken);
    }

    // 사용자 정보 조회 및 저장
    const currentMember = await retryRequest(() => 
      apiClient.get(API_ENDPOINTS.AUTH_ME)
    );

    const userInfo = {
      id: currentMember.data.memberId,
      username: currentMember.data.username,
      name: currentMember.data.name,
      nickname: currentMember.data.nickname,
      email: currentMember.data.email,
      phone: currentMember.data.phone,
      reviewCount: currentMember.data.reviewCount || 0,
      favoriteCount: currentMember.data.favoriteCount || 0,
    };

    // 사용자 정보 저장
    AuthService.setUserInfo(userInfo);

    return {
      success: true,
      user: userInfo,
      accessToken,
    };
  } catch (error) {
    logger.error('로그인 실패:', error);
    
    // 백엔드 에러 메시지 처리
    if (error.originalError?.response?.data?.message) {
      error.message = error.originalError.response.data.message;
    } else if (error.statusCode === 401) {
      error.message = '아이디 또는 비밀번호가 올바르지 않습니다.';
    } else if (error.statusCode === 404) {
      error.message = '존재하지 않는 사용자입니다.';
    } else {
      error.message = '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
    }
    
    throw error;
  }
}

// 내 정보 조회 API
export const getCurrentUser = async () => {
  try {
    // 먼저 저장된 사용자 정보 확인
    const savedUserInfo = AuthService.getUserInfo();
    if (savedUserInfo) {
      return savedUserInfo;
    }

    // 저장된 정보가 없으면 API 호출
    const response = await retryRequest(() => 
      apiClient.get(API_ENDPOINTS.AUTH_ME)
    );
    
    const userInfo = {
      id: response.data.memberId,
      username: response.data.username,
      name: response.data.name,
      email: response.data.email,
      phone: response.data.phone,
      nickname: response.data.nickname,
      reviewCount: response.data.reviewCount || 0,
      favoriteCount: response.data.favoriteCount || 0,
    };

    // 사용자 정보 저장
    AuthService.setUserInfo(userInfo);
    
    return userInfo;
  } catch (error) {
    logger.error('내 정보 조회 실패:', error);
    
    if (error.statusCode === 401) {
      error.message = '로그인이 필요합니다.';
    } else {
      error.message = '사용자 정보를 불러오는데 실패했습니다.';
    }
    
    throw error;
  }
};

// 로그아웃 API
export const logout = async () => {
  try {
    // 백엔드에 로그아웃 요청
    await retryRequest(() => 
      apiClient.post(API_ENDPOINTS.AUTH_LOGOUT)
    );
  } catch (error) {
    logger.warn('백엔드 로그아웃 실패, 로컬에서만 로그아웃:', error);
  } finally {
    // AuthService를 사용하여 모든 인증 정보 제거
    AuthService.removeToken();
  }
  
  return { success: true, message: '로그아웃되었습니다.' };
};

// 토큰 갱신 API
export const refreshToken = async () => {
  try {
    const response = await retryRequest(() => 
      apiClient.post(API_ENDPOINTS.AUTH_REFRESH)
    );
    
    const newAccessToken = response.headers?.["access-token"] || response.data?.accessToken;
    
    if (newAccessToken) {
      // AuthService를 사용하여 새 토큰 저장
      AuthService.setToken(newAccessToken);
      logger.log('토큰 갱신 성공');
      return newAccessToken;
    } else {
      throw new Error('새 토큰을 받지 못했습니다.');
    }
  } catch (error) {
    logger.error('토큰 갱신 실패:', error);
    
    if (error.statusCode === 401) {
      error.message = '토큰이 만료되었습니다. 다시 로그인해주세요.';
    } else {
      error.message = '토큰 갱신에 실패했습니다.';
    }
    
    throw error;
  }
};

export default {
  regist,
  login,
  getCurrentUser,
  logout,
  refreshToken,
};


