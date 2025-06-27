import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';

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
  
  if (process.env.NODE_ENV === 'development') {
    console.log("📡 API 요청 URL:", API_ENDPOINTS.AUTH_REGISTER);
    console.log("📡 API 요청 데이터:", requestData);
  }
  
  return await apiClient.post(API_ENDPOINTS.AUTH_REGISTER, requestData);
};

// 로그인 API
export const login = async ({ username, password }) => {
  try {
    // 간단한 로그인 시뮬레이션 (실제 환경에서는 서버 API 호출)
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
    console.error('로그인 실패:', error);
    throw error;
  }
};

// 현재 사용자 정보 조회
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }
    
    // 토큰에서 사용자 ID 추출 (간단한 구현)
    const userId = token.split('_')[1];
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
    console.error('사용자 정보 조회 실패:', error);
    throw error;
  }
};

// 로그아웃
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  return { success: true, message: '로그아웃되었습니다.' };
};


