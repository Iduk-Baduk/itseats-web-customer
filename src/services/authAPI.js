import apiClient from './apiClient';
import { STORAGE_KEYS, logger } from '../utils/logger';
import { API_ENDPOINTS } from '../config/api';
import AuthService from './authService';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

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

// 쿠키에서 refreshToken 추출
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// 로그인 전용 클라이언트 (baseURL에서 /api 제외)
const loginClient = axios.create({
  baseURL: API_CONFIG.BASE_URL.endsWith('/api') 
    ? API_CONFIG.BASE_URL.slice(0, -4) 
    : API_CONFIG.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 회원가입 API (백엔드 최종 명세에 맞게 수정)
export const regist = async (form) => {
  try {
    const sanitizedForm = { ...form, password: "[REDACTED]" };
    logger.log("📡 회원가입 요청 데이터:", sanitizedForm);

    // 백엔드 최종 명세에 맞는 요청 데이터 형식으로 변환
    const requestData = {
      username: form.username,
      password: form.password,
      name: form.name,
      nickname: form.nickname || form.name, // 닉네임이 없으면 이름 사용
      email: form.email,
      phone: form.phone // phoneNumber가 아님! phone으로 유지
    };

    const response = await retryRequest(() => 
      apiClient.post(API_ENDPOINTS.AUTH_REGISTER, requestData)
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

// 로그인 API (백엔드 최종 명세에 맞게 수정)
export const login = async ({ username, password, isAutoLogin }) => {
  try {
      if (!username || !password) {
    throw new Error('아이디와 비밀번호를 모두 입력해주세요.');
  }

  logger.log("📡 로그인 요청:", { username, password: "[REDACTED]" });

    // 백엔드 최종 명세: POST /api/login (baseURL에 이미 /api가 포함되어 있으므로 /login만 사용)
    const response = await retryRequest(() => 
      axios.post(`${API_CONFIG.BASE_URL}/login`, { username, password }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      })
    );
    
    logger.log("📡 로그인 응답 헤더:", response.headers);
    
    // 백엔드에서 Access-Token 헤더로 전송 (대소문자 구분 없이)
    const accessToken = response.headers['access-token'] || 
                       response.headers['Access-Token'] ||
                       response.headers['authorization'] ||
                       response.headers['Authorization'];
    
    // 쿠키에서 Refresh Token 추출
    const refreshToken = getCookie('REFRESH_TOKEN') || getCookie('refresh-token');
    
    logger.log("🔐 토큰 추출 결과:", { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length 
    });
    
    if (!accessToken) {
      logger.error('토큰을 받지 못했습니다. 응답 헤더:', response.headers);
      throw new Error('로그인 토큰을 받지 못했습니다.');
    }
    
    // Bearer 접두사 제거 (있는 경우)
    const cleanToken = accessToken.replace('Bearer ', '');
    
    // AuthService를 사용하여 토큰 저장
    AuthService.setToken(cleanToken);
    if (refreshToken) {
      AuthService.setRefreshToken(refreshToken);
    }

    // 사용자 정보 조회 및 저장 (인증 필요) - 이제 정상 작동할 것
    const currentMember = await retryRequest(() => 
      apiClient.get(API_ENDPOINTS.AUTH_ME)
    );

    const userInfo = {
      id: currentMember.data.memberId,
      username: currentMember.data.username,
      name: currentMember.data.name,
      nickname: currentMember.data.nickname,
      email: currentMember.data.email,
      phone: currentMember.data.phone, // phone으로 유지
      reviewCount: currentMember.data.reviewCount || 0,
      favoriteCount: currentMember.data.favoriteCount || 0,
    };

    // 사용자 정보 저장
    AuthService.setUserInfo(userInfo);

    logger.log("✅ 로그인 성공:", userInfo);

    return {
      success: true,
      user: userInfo,
      accessToken: cleanToken,
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

// 내 정보 조회 API (백엔드 최종 명세에 맞게 수정)
export const getCurrentUser = async () => {
  try {
    // 먼저 저장된 사용자 정보 확인
    const savedUserInfo = AuthService.getUserInfo();
    if (savedUserInfo) {
      return savedUserInfo;
    }

    // 저장된 정보가 없으면 API 호출 (인증 필요) - 이제 정상 작동할 것
    const response = await retryRequest(() => 
      apiClient.get(API_ENDPOINTS.AUTH_ME)
    );
    
    const userInfo = {
      id: response.data.memberId,
      username: response.data.username,
      name: response.data.name,
      email: response.data.email,
      phone: response.data.phone, // phone으로 유지
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

// 로그아웃 API (백엔드 명세에 맞게 수정)
export const logout = async () => {
  try {
    const userInfo = AuthService.getUserInfo();
    const memberId = userInfo?.id;
    
    if (memberId) {
      // 백엔드 명세: POST /api/auths/logout?memberId={memberId}
      await retryRequest(() => 
        apiClient.post(`${API_ENDPOINTS.AUTH_LOGOUT}?memberId=${memberId}`)
      );
    }
  } catch (error) {
    logger.warn('백엔드 로그아웃 실패, 로컬에서만 로그아웃:', error);
  } finally {
    // AuthService를 사용하여 모든 인증 정보 제거
    AuthService.removeToken();
  }
  
  return { success: true, message: '로그아웃되었습니다.' };
};

// 토큰 갱신 API (백엔드 명세에 맞게 수정)
export const refreshToken = async () => {
  try {
    const userInfo = AuthService.getUserInfo();
    const memberId = userInfo?.id;
    const refreshToken = AuthService.getRefreshToken();
    
    if (!memberId || !refreshToken) {
      throw new Error('사용자 정보 또는 리프레시 토큰이 없습니다.');
    }
    
    // 백엔드 명세: GET /api/auths/reissue?memberId={memberId}
    const response = await retryRequest(() => 
      apiClient.get(`${API_ENDPOINTS.AUTH_REFRESH}?memberId=${memberId}`, {
        headers: {
          'Refresh-Token': refreshToken
        }
      })
    );
    
    const newAccessToken = response.headers?.["authorization"] || response.data?.accessToken;
    
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


