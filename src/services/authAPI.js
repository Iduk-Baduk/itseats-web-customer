import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { STORAGE_KEYS, logger } from '../utils/logger';

// 토큰에서 사용자 ID 추출 유틸리티
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

export const regist = async (form) => {
  const { username, password, nickname, email, phone, usertype } = form;
  
  const requestData = {
    username,
    password,
    nickname,
    email,
    phone,
    usertype
  };
  
  logger.log("📡 API 요청 URL:", API_ENDPOINTS.AUTH_REGISTER);
  logger.log("📡 API 요청 데이터:", requestData);
  
  return await apiClient.post(API_ENDPOINTS.AUTH_REGISTER, requestData);
};

// 로그인 API
// ⚠️ 주의: 이 구현은 개발 환경에서만 사용되며, 실제 프로덕션에서는 서버 측 인증을 사용해야 합니다.
// 프로덕션 환경에서는 평문 비밀번호를 클라이언트로 전송하지 않고,
// 서버에서 해시된 비밀번호와 비교하여 JWT 토큰을 발급해야 합니다.
export const login = async ({ username, password }) => {
  try {
    // 개발 환경에서만 사용하는 클라이언트 측 인증
    // 실제 환경에서는 다음과 같이 구현해야 함:
    // const response = await apiClient.post('/auth/login', { username, password });
    // return response.data;
    
    const response = await apiClient.get('/users');
    const users = response || [];
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
    
    // 가짜 토큰 생성 (실제 환경에서는 서버에서 제공)
    const token = `token_${user.id}_${Date.now()}`;
    
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      accessToken: token,
      message: '로그인에 성공했습니다.'
    };
  } catch (error) {
    logger.error('로그인 실패:', error);
    throw error;
  }
};

// 현재 사용자 정보 조회
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }
    
    // 안전한 토큰 파싱
    const userId = extractUserIdFromToken(token);
    if (!userId) {
      throw new Error('유효하지 않은 토큰입니다.');
    }
    
    const response = await apiClient.get('/users');
    const users = response || [];
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };
  } catch (error) {
    logger.error('사용자 정보 조회 실패:', error);
    throw error;
  }
};

// 로그아웃
export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  return { success: true, message: '로그아웃되었습니다.' };
};


