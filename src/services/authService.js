import { logger } from '../utils/logger';

// 토큰 저장 키
const TOKEN_KEY = 'itseats_access_token';
const REFRESH_TOKEN_KEY = 'itseats_refresh_token';
const USER_KEY = 'itseats_user_info';

class AuthService {
  /**
   * 액세스 토큰 설정
   * @param {string} token - JWT 액세스 토큰
   */
  static setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      logger.log('🔐 액세스 토큰 저장됨');
    }
  }

  /**
   * 액세스 토큰 가져오기
   * @returns {string|null} 저장된 액세스 토큰
   */
  static getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * 리프레시 토큰 설정
   * @param {string} refreshToken - JWT 리프레시 토큰
   */
  static setRefreshToken(refreshToken) {
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      logger.log('🔄 리프레시 토큰 저장됨');
    }
  }

  /**
   * 리프레시 토큰 가져오기
   * @returns {string|null} 저장된 리프레시 토큰
   */
  static getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * 사용자 정보 설정
   * @param {Object} userInfo - 사용자 정보 객체
   */
  static setUserInfo(userInfo) {
    if (userInfo) {
      localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
      logger.log('👤 사용자 정보 저장됨:', userInfo);
    }
  }

  /**
   * 사용자 정보 가져오기
   * @returns {Object|null} 저장된 사용자 정보
   */
  static getUserInfo() {
    try {
      const userInfo = localStorage.getItem(USER_KEY);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      logger.error('사용자 정보 파싱 실패:', error);
      return null;
    }
  }

  /**
   * 인증 상태 확인
   * @returns {boolean} 로그인 여부
   */
  static isAuthenticated() {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // 토큰 만료 시간 확인 (JWT 토큰인 경우)
    try {
      if (token.includes('.')) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp && payload.exp < currentTime) {
          logger.warn('토큰이 만료됨');
          this.removeToken();
          return false;
        }
      }
    } catch (error) {
      logger.error('토큰 검증 실패:', error);
      this.removeToken();
      return false;
    }

    return true;
  }

  /**
   * 모든 인증 정보 제거 (로그아웃)
   */
  static removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    logger.log('🔓 모든 인증 정보 제거됨');
  }

  /**
   * 토큰 갱신 시도
   * @returns {Promise<boolean>} 갱신 성공 여부
   */
  static async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      // 리프레시 토큰으로 새 액세스 토큰 요청
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.setToken(data.accessToken);
        logger.log('🔄 토큰 갱신 성공');
        return true;
      } else {
        logger.warn('토큰 갱신 실패');
        this.removeToken();
        return false;
      }
    } catch (error) {
      logger.error('토큰 갱신 중 오류:', error);
      this.removeToken();
      return false;
    }
  }

  /**
   * 로그인 페이지로 리다이렉트
   */
  static redirectToLogin() {
    const currentPath = window.location.pathname;
    const loginPath = '/login';
    
    // 현재 페이지 정보를 state로 전달
    window.location.href = `${loginPath}?redirect=${encodeURIComponent(currentPath)}`;
  }

  /**
   * 인증이 필요한 페이지인지 확인
   * @param {string} pathname - 현재 경로
   * @returns {boolean} 인증 필요 여부
   */
  static requiresAuth(pathname) {
    const publicPaths = [
      '/',
      '/login',
      '/register',
      '/stores',
      '/search'
    ];
    
    return !publicPaths.some(path => pathname.startsWith(path));
  }
}

export default AuthService; 
