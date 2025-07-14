/**
 * JWT 설정 예시 파일
 * 
 * ⚠️ 보안 주의사항:
 * - 이 파일은 예시용입니다. 실제 시크릿 키를 포함하지 마세요.
 * - 실제 사용 시에는 jwt.config.js 파일을 생성하고 .gitignore에 추가하세요.
 * - 시크릿 키는 환경 변수나 안전한 설정 관리 시스템을 사용하세요.
 */

// JWT 설정 예시 (실제 시크릿 키는 포함하지 않음)
export const jwtConfig = {
  // ⚠️ 실제 시크릿 키를 여기에 직접 입력하지 마세요!
  // secret: 'your_actual_secret_key_here',
  
  // 대신 환경 변수 사용 권장
  secret: process.env.JWT_SECRET || 'development_secret_key',
  
  // 토큰 만료 시간 설정
  expiration: {
    access: 900,      // 15분 (초)
    refresh: 2592000  // 30일 (초)
  },
  
  // 토큰 발급자 및 대상 설정
  issuer: 'itseats-backend',
  audience: 'itseats-frontend',
  
  // 알고리즘 설정
  algorithm: 'HS256'
};

// 개발 환경용 설정
export const devJwtConfig = {
  secret: 'development_only_secret_key_do_not_use_in_production',
  expiration: {
    access: 3600,     // 1시간 (개발용)
    refresh: 604800   // 7일 (개발용)
  },
  issuer: 'itseats-dev',
  audience: 'itseats-dev',
  algorithm: 'HS256'
};

// 환경별 설정 선택
export const getJwtConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    return jwtConfig;
  }
  return devJwtConfig;
}; 
