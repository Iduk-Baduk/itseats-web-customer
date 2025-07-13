# 프론트엔드 API 연동 가이드

## 개요
백엔드 서버와 프론트엔드 간의 API 연동 시 발생하는 문제들과 해결방안을 정리한 문서입니다.

## 1. 인증 관련 API

### 1.1 로그인 API
- **엔드포인트**: `POST /login`
- **Content-Type**: `application/json`
- **요청 본문**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **응답 헤더**:
  - `Access-Token`: JWT 액세스 토큰
  - `Refresh-Token`: 쿠키로 전달되는 리프레시 토큰

### 1.2 회원가입 API
- **엔드포인트**: `POST /api/members/sign-up`
- **Content-Type**: `application/json`
- **요청 본문**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "phone": "010-1234-5678"
}
```

### 1.3 현재 사용자 정보 조회
- **엔드포인트**: `GET /api/members/me`
- **인증 필요**: JWT 토큰 필요
- **헤더**: `Authorization: Bearer {access_token}`

## 2. 토큰 관리

### 2.1 토큰 저장
로그인 성공 후 받은 토큰 저장 방식:

**주의**: localStorage는 XSS 공격에 취약합니다. 프로덕션 환경에서는 httpOnly 쿠키 사용을 권장합니다.

```javascript
// 로그인 성공 후
const accessToken = response.headers.get('Access-Token');
// 개발 환경에서만 사용 권장
if (import.meta.env.DEV) {
  localStorage.setItem('accessToken', accessToken);
} else {
  // 프로덕션에서는 httpOnly 쿠키 사용 권장
  // 백엔드에서 Set-Cookie 헤더로 설정
}
```

### 2.2 토큰 자동 추가
API 요청에 토큰을 자동으로 추가하는 인터셉터 설정:

```javascript
// Axios 인터셉터 예시
axios.interceptors.request.use(
  (config) => {
    // 개발 환경: localStorage에서 토큰 가져오기
    if (import.meta.env.DEV) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // 프로덕션 환경: 쿠키가 자동으로 요청에 포함됨
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

### 2.3 토큰 갱신
액세스 토큰이 만료되면 리프레시 토큰을 사용하여 갱신하세요:
```javascript
// 쿠키에서 값을 가져오는 유틸리티 함수
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response.status === 401) {
      // 리프레시 토큰으로 새로운 액세스 토큰 요청
      const refreshToken = getCookie('Refresh-Token');
      if (refreshToken) {
        try {
          const response = await axios.post('/api/auths/refresh', {
            refreshToken: refreshToken
          });
          const newAccessToken = response.headers.get('Access-Token');
          localStorage.setItem('accessToken', newAccessToken);
          
          // 원래 요청 재시도
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios.request(error.config);
        } catch (refreshError) {
          // 리프레시 토큰도 만료된 경우 로그인 페이지로 이동
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

## 3. API 엔드포인트 목록

### 3.1 인증 관련
- `POST /login` - 로그인
- `POST /api/members/sign-up` - 회원가입
- `GET /api/members/me` - 현재 사용자 정보
- `POST /api/auths/refresh` - 토큰 갱신

### 3.2 매장 관련
- `GET /api/stores/list` - 매장 목록 조회
- `GET /api/stores/{id}` - 매장 상세 조회
- `GET /api/stores/{id}/menus` - 매장 메뉴 조회

### 3.3 주문 관련
- `POST /api/orders` - 주문 생성
- `GET /api/orders/{id}` - 주문 조회
- `POST /api/orders/confirm` - 주문 확인 (인증 불필요)

### 3.4 결제 관련
- `POST /api/payments` - 결제 생성
- `POST /api/payments/confirm` - 결제 확인

### 3.5 주소 관련
- `GET /api/member-addresses` - 주소 목록 조회
- `POST /api/member-addresses` - 주소 추가

## 4. 에러 처리

### 4.1 HTTP 상태 코드별 처리
- **200**: 성공
- **400**: 잘못된 요청 (요청 본문 확인)
- **401**: 인증 실패 (토큰 확인)
- **403**: 권한 없음
- **404**: 리소스 없음
- **500**: 서버 내부 오류

### 4.2 에러 응답 형식
```json
{
  "timestamp": "2025-07-10T22:23:24.161+09:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Cannot invoke \"org.springframework.security.core.userdetails.UserDetails.getUsername()\" because \"userDetails\" is null",
  "path": "/api/stores/2"
}
```

## 5. CORS 설정

백엔드에서 CORS가 설정되어 있으므로, 프론트엔드에서 별도 설정이 필요하지 않습니다.

## 6. 개발 환경 설정

### 6.1 환경 변수
```javascript
// .env 파일
REACT_APP_API_BASE_URL=http://localhost:8080
```

### 6.2 API 기본 설정
```javascript
// api/config.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

## 7. 디버깅 가이드

### 7.1 네트워크 탭 확인
1. 브라우저 개발자 도구 열기
2. Network 탭 선택
3. API 요청/응답 확인
4. 요청 헤더에 Authorization 토큰 포함 여부 확인

### 7.2 콘솔 로그 확인
```javascript
// API 요청 시 로그 추가
console.log('Request Headers:', config.headers);
console.log('Request Data:', config.data);
```

### 7.3 토큰 상태 확인
```javascript
// 개발 환경에서만 사용 권장
if (import.meta.env.DEV) {
  const token = localStorage.getItem('accessToken');
  console.log('Current Token:', token);
} else {
  // 프로덕션에서는 httpOnly 쿠키 사용
  console.log('Production: Using httpOnly cookies for token management');
}
```

## 8. 주의사항

### 8.1 토큰 보안
- 토큰을 URL 파라미터로 전송하지 마세요
- 토큰을 콘솔에 출력하지 마세요
- HTTPS 환경에서만 토큰을 전송하세요

### 8.2 요청 형식
- Content-Type을 정확히 설정하세요
- JSON 형식의 요청 본문을 올바르게 전송하세요
- 필수 필드가 누락되지 않도록 확인하세요

### 8.3 에러 처리
- 모든 API 요청에 적절한 에러 처리를 추가하세요
- 사용자에게 명확한 에러 메시지를 표시하세요
- 네트워크 오류와 서버 오류를 구분하여 처리하세요

## 9. 테스트 방법

### 9.1 Postman 테스트
1. Postman에서 API 요청 생성
2. Headers에 Authorization 추가: `Bearer {token}`
3. 요청 전송 후 응답 확인

### 9.2 브라우저 테스트
1. 로그인 후 토큰 저장 확인
2. API 요청 시 토큰 자동 추가 확인
3. 응답 데이터 정상 수신 확인

## 10. 연락처

문제 발생 시 백엔드 팀에 다음 정보와 함께 문의하세요:
- 에러 메시지
- 요청 URL
- 요청 헤더
- 요청 본문
- 응답 상태 코드
- 응답 본문
- 브라우저 콘솔 로그 
