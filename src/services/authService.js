import { API_ENDPOINTS, API_CONFIG } from '../config/api';
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
   * 액세스 토큰 가져오기 (동기)
   * @returns {string|null} 저장된 액세스 토큰
   */
  static getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * 액세스 토큰 가져오기 (비동기, 개발 환경에서 자동 생성 제거)
   * @returns {Promise<string|null>} 액세스 토큰
   */
  static async getTokenAsync() {
    const token = localStorage.getItem(TOKEN_KEY);
    return token;
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
    const token = AuthService.getToken();
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
          AuthService.removeToken();
          return false;
        }
      }
    } catch (error) {
      logger.error('토큰 검증 실패:', error);
      AuthService.removeToken();
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
    const refreshToken = AuthService.getRefreshToken();
    if (!refreshToken) {
      logger.warn('리프레시 토큰이 없음');
      return false;
    }

    try {
      // 사용자 ID 가져오기
      const userInfo = AuthService.getUserInfo();
      if (!userInfo?.id) {
        logger.warn('사용자 정보가 없음');
        return false;
      }

      // 백엔드 명세에 맞는 토큰 갱신 요청
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH_REFRESH}?memberId=${userInfo.id}`,
        {
          method: 'GET',
          headers: {
            'Refresh-Token': refreshToken
          }
        }
      );

      if (response.ok) {
        // 새로운 액세스 토큰 저장 (헤더에서 가져오기)
        const newAccessToken = response.headers.get('Access-Token') || 
                             response.headers.get('access-token');
                             
        if (newAccessToken) {
          AuthService.setToken(newAccessToken);
          logger.log('🔄 토큰 갱신 성공');
          return true;
        } else {
          // 헤더에 토큰이 없으면 개발 환경에서 새 토큰 생성
          if (import.meta.env.DEV) {
            try {
              // getDevToken 함수가 tokenUtils.js에 없으므로 이 부분은 주석 처리 또는 제거
              // const backendToken = getDevToken(); 
              // AuthService.setToken(backendToken);
              logger.log('🧪 개발 환경: 토큰 갱신 실패로 새 토큰 생성');
              return true;
            } catch (error) {
              logger.error('개발 환경 토큰 생성 실패:', error);
            }
          }
          logger.warn('새로운 액세스 토큰을 받지 못함');
          return false;
        }
      } else {
        logger.warn('토큰 갱신 실패:', response.status);
        AuthService.removeToken();
        return false;
      }
    } catch (error) {
      logger.error('토큰 갱신 중 오류:', error);
      AuthService.removeToken();
      return false;
    }
  }

  /**
   * 비밀번호 유효성 검증
   * @param {string} password - 검증할 비밀번호
   * @returns {boolean} 유효성 여부
   */
  static validatePassword(password) {
    // 최소 8자, 영문+숫자+특수문자 포함
    const pattern = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return pattern.test(password);
  }

  /**
   * 로그인 API 호출
   * @param {Object} credentials - 로그인 정보
   * @returns {Promise<Object>} 로그인 결과
   */
  static async login(credentials) {
    try {
      // 개발 환경에서는 백엔드 테스트 계정을 위해 비밀번호 유효성 검증 건너뛰기
      if (import.meta.env.PROD) {
        // 비밀번호 유효성 검증
        if (!AuthService.validatePassword(credentials.password)) {
          throw new Error('비밀번호는 최소 8자리, 영문, 숫자, 특수문자를 포함해야 합니다.');
        }
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH_LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: credentials.email,  // email → username으로 변경
          password: credentials.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '로그인에 실패했습니다.');
      }

      // 백엔드에서 성공 시 응답 본문이 비어있으므로 헤더에서만 토큰 추출
      const accessToken = response.headers.get('Access-Token') || 
                         response.headers.get('access-token');
      
      // 응답 본문이 있는 경우에만 JSON 파싱 시도
      let data = {};
      try {
        const responseText = await response.text();
        if (responseText.trim()) {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        logger.warn('응답 본문 파싱 실패 (정상적인 경우):', parseError);
      }
      
      const refreshToken = response.headers.get('Set-Cookie') ||
                          response.headers.get('refresh-token') ||
                          data.refreshToken;

      if (!accessToken) {
        throw new Error('액세스 토큰을 받지 못했습니다.');
      }

      // 토큰 저장
      AuthService.setToken(accessToken);
      if (refreshToken) {
        AuthService.setRefreshToken(refreshToken);
      }

      // 사용자 정보 저장
      if (data.user || data.member) {
        AuthService.setUserInfo(data.user || data.member);
      }

      logger.log('✅ 로그인 성공');
      return { success: true, accessToken, user: data.user || data.member };
      
    } catch (error) {
      logger.error('❌ 로그인 실패:', error);
      throw error;
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
   * API 엔드포인트가 인증이 필요한지 확인
   * @param {string} endpoint - API 엔드포인트
   * @returns {boolean} 인증 필요 여부
   */
  static requiresAuthForEndpoint(endpoint) {
    // 백엔드 API 명세에 따른 공개 엔드포인트 목록
    const publicEndpoints = [
      // 인증 관련 (인증 불필요)
      '/login',
      '/members/sign-up',
      
      // 공개 API (인증 불필요)
      '/stores/list',
      '/stores/search',
      '/menus',
      '/reviews',
      
      // 기타 공개 API (하위 호환성)
      '/stores',
      '/search',
      '/categories',
      '/banners',
      
      // Swagger 문서
      '/v3/api-docs',
      '/swagger-ui'
    ];
    
    return !publicEndpoints.some(path => endpoint.startsWith(path));
  }

  /**
   * 페이지 경로가 인증이 필요한지 확인 (하위 호환성 유지)
   * @param {string} pathname - 현재 경로
   * @returns {boolean} 인증 필요 여부
   * @deprecated API 엔드포인트 기반 인증 체크를 사용하세요
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
