# API 문제 해결 체크리스트

## 로그인 관련 문제

### ✅ 로그인 요청이 500 에러를 반환하는 경우
- [ ] 요청 URL이 `/login`인지 확인
- [ ] Content-Type이 `application/json`인지 확인
- [ ] 요청 본문에 `email`과 `password` 필드가 있는지 확인
- [ ] 이메일과 비밀번호가 올바른 형식인지 확인
- [ ] 회원가입이 완료된 계정인지 확인

### ✅ 로그인 후 토큰이 저장되지 않는 경우
- [ ] 응답 헤더에서 `Access-Token`을 확인
- [ ] localStorage에 토큰이 저장되는지 확인
- [ ] 토큰 저장 코드가 실행되는지 확인

## 인증 관련 문제

### ✅ 401 Unauthorized 에러가 발생하는 경우
- [ ] 요청 헤더에 `Authorization: Bearer {token}`이 포함되어 있는지 확인
- [ ] 토큰이 localStorage에 저장되어 있는지 확인
- [ ] 토큰이 만료되지 않았는지 확인
- [ ] 토큰 형식이 올바른지 확인

### ✅ 500 에러와 함께 "userDetails is null" 메시지가 나오는 경우
- [ ] 요청 헤더에 Authorization 토큰이 포함되어 있는지 확인
- [ ] 토큰이 유효한지 확인
- [ ] 로그인 상태인지 확인

## API 요청 문제

### ✅ 모든 API 요청이 500 에러를 반환하는 경우
- [ ] 서버가 실행 중인지 확인 (http://localhost:8080/health)
- [ ] 네트워크 연결 상태 확인
- [ ] CORS 설정 확인
- [ ] 요청 URL이 올바른지 확인

### ✅ 특정 API만 404 에러를 반환하는 경우
- [ ] API 엔드포인트 URL이 올바른지 확인
- [ ] HTTP 메서드(GET, POST, PUT, DELETE)가 올바른지 확인
- [ ] 백엔드에서 해당 엔드포인트가 구현되어 있는지 확인

### ✅ API 요청 시 토큰이 전송되지 않는 경우
- [ ] Axios 인터셉터가 설정되어 있는지 확인
- [ ] localStorage에 토큰이 저장되어 있는지 확인
- [ ] 인터셉터 코드가 올바르게 작동하는지 확인

## 데이터 관련 문제

### ✅ 회원가입 시 400 에러가 발생하는 경우
- [ ] 모든 필수 필드가 포함되어 있는지 확인
- [ ] 이메일 형식이 올바른지 확인
- [ ] 비밀번호가 최소 길이를 만족하는지 확인
- [ ] 전화번호 형식이 올바른지 확인
- [ ] 이미 가입된 이메일인지 확인

### ✅ API 응답 데이터가 예상과 다른 경우
- [ ] 응답 형식이 문서와 일치하는지 확인
- [ ] 필드명이 올바른지 확인
- [ ] 데이터 타입이 올바른지 확인

## 개발 환경 문제

### ✅ 개발 서버에서 API 호출이 안 되는 경우
- [ ] 백엔드 서버가 실행 중인지 확인
- [ ] 포트 번호가 올바른지 확인 (기본: 8080)
- [ ] 환경 변수 설정이 올바른지 확인
- [ ] 프록시 설정이 필요한지 확인

### ✅ 프로덕션 환경에서 API 호출이 안 되는 경우
- [ ] API 서버 URL이 올바른지 확인
- [ ] HTTPS 설정이 올바른지 확인
- [ ] CORS 설정이 프로덕션 도메인을 허용하는지 확인

## 디버깅 단계

### 1단계: 브라우저 개발자 도구 확인
- [ ] Network 탭에서 요청/응답 확인
- [ ] Console 탭에서 에러 메시지 확인
- [ ] Application 탭에서 localStorage 확인

### 2단계: 요청 헤더 확인
- [ ] Content-Type이 올바른지 확인
- [ ] Authorization 헤더가 포함되어 있는지 확인
- [ ] CORS 관련 헤더가 올바른지 확인

### 3단계: 요청 본문 확인
- [ ] JSON 형식이 올바른지 확인
- [ ] 필수 필드가 포함되어 있는지 확인
- [ ] 데이터 타입이 올바른지 확인

### 4단계: 응답 확인
- [ ] HTTP 상태 코드 확인
- [ ] 응답 본문 확인
- [ ] 에러 메시지 확인

## 일반적인 해결 방법

### 토큰 관련 문제 해결
```javascript
// 1. 토큰 저장 확인
console.log('Stored token:', localStorage.getItem('accessToken'));

// 2. 토큰 유효성 확인
const token = localStorage.getItem('accessToken');
if (!token) {
  console.log('No token found, redirecting to login');
  window.location.href = '/login';
}

// 3. 토큰 갱신 시도
if (error.response.status === 401) {
  localStorage.removeItem('accessToken');
  window.location.href = '/login';
}
```

### API 요청 디버깅
```javascript
// 1. 요청 로깅
console.log('Request URL:', config.url);
console.log('Request Method:', config.method);
console.log('Request Headers:', config.headers);
console.log('Request Data:', config.data);

// 2. 응답 로깅
console.log('Response Status:', response.status);
console.log('Response Data:', response.data);
```

### 에러 처리 개선
```javascript
// 1. 네트워크 에러 처리
if (error.code === 'NETWORK_ERROR') {
  alert('네트워크 연결을 확인해주세요.');
  return;
}

// 2. 서버 에러 처리
if (error.response.status >= 500) {
  alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  return;
}

// 3. 클라이언트 에러 처리
if (error.response.status >= 400 && error.response.status < 500) {
  alert('잘못된 요청입니다. 입력 정보를 확인해주세요.');
  return;
}
```

## 백엔드 팀 문의 시 필요한 정보

문제를 백엔드 팀에 문의할 때 다음 정보를 포함하세요:

### 필수 정보
- [ ] 에러 발생 시간
- [ ] 요청 URL
- [ ] HTTP 메서드
- [ ] 요청 헤더 (Authorization 포함)
- [ ] 요청 본문
- [ ] 응답 상태 코드
- [ ] 응답 본문
- [ ] 브라우저 콘솔 에러 메시지

### 추가 정보
- [ ] 사용자 계정 정보 (개인정보 제외)
- [ ] 재현 단계
- [ ] 예상 동작
- [ ] 실제 동작
- [ ] 브라우저 정보
- [ ] 운영체제 정보

## 예방 방법

### 코드 리뷰 체크리스트
- [ ] 모든 API 요청에 에러 처리가 있는지 확인
- [ ] 토큰 관리 로직이 올바른지 확인
- [ ] 환경 변수 설정이 올바른지 확인
- [ ] API 엔드포인트 URL이 올바른지 확인

### 테스트 체크리스트
- [ ] 로그인/로그아웃 플로우 테스트
- [ ] 토큰 만료 시나리오 테스트
- [ ] 네트워크 오류 시나리오 테스트
- [ ] 각 API 엔드포인트별 테스트
- [ ] 다양한 브라우저에서 테스트 
