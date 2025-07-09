# 🔐 토큰 관리 시스템

## 개요

이 문서는 React 기반 음식 배달 웹앱의 토큰 관리 시스템에 대한 설명입니다. 보안을 강화하고 사용자 경험을 개선하기 위해 토큰 만료 시간 관리, 자동 갱신, Redux 상태 관리 통합을 구현했습니다.

## 🏗️ 아키텍처

### 1. 토큰 유틸리티 (`src/utils/tokenUtils.js`)

토큰의 저장, 조회, 검증을 담당하는 핵심 유틸리티입니다.

#### 주요 기능
- **안전한 토큰 저장**: 만료 시간과 함께 JSON 형태로 저장
- **유효성 검사**: 만료 시간 자동 확인 및 만료된 토큰 삭제
- **기존 형식 호환성**: 문자열로 저장된 기존 토큰과의 호환성 유지
- **시간 관리**: 만료까지 남은 시간 계산 및 경고 기능

#### 사용 예시
```javascript
import { saveToken, getToken, isTokenValid, clearToken } from '../utils/tokenUtils';

// 토큰 저장 (24시간 만료)
saveToken('your-token-here', 24 * 60 * 60 * 1000);

// 토큰 조회
const token = getToken();

// 유효성 검사
if (isTokenValid()) {
  // 토큰이 유효한 경우
}

// 토큰 삭제
clearToken();
```

### 2. Redux 상태 관리 (`src/store/tokenSlice.js`)

토큰 상태를 전역적으로 관리하는 Redux slice입니다.

#### 상태 구조
```javascript
{
  token: string | null,        // 토큰 값
  isValid: boolean,           // 유효성 여부
  isLoading: boolean,         // 로딩 상태
  error: string | null,       // 에러 메시지
  expiresAt: string | null,   // 만료 시간
  issuedAt: string | null,    // 발급 시간
  timeRemaining: number,      // 남은 시간 (밀리초)
  isExpiringSoon: boolean,    // 곧 만료되는지 여부
  lastChecked: number | null  // 마지막 확인 시간
}
```

#### 주요 액션
- `saveTokenAsync`: 토큰 저장
- `validateTokenAsync`: 토큰 검증
- `refreshTokenAsync`: 토큰 갱신
- `logout`: 로그아웃

### 3. 토큰 관리 훅 (`src/hooks/useTokenManagement.js`)

컴포넌트에서 토큰 관리를 쉽게 사용할 수 있는 커스텀 훅입니다.

#### 설정 옵션
```javascript
const { tokenInfo } = useTokenManagement({
  checkInterval: 30 * 1000,    // 30초마다 확인
  warningMinutes: 5,           // 5분 전 경고
  autoRefresh: true,           // 자동 갱신 활성화
  autoLogout: true             // 만료 시 자동 로그아웃
});
```

#### 반환 값
```javascript
{
  // 상태
  token: string | null,
  isValid: boolean,
  isLoading: boolean,
  error: string | null,
  timeRemaining: number,
  isExpiringSoon: boolean,
  tokenInfo: object,

  // 액션
  saveToken: function,
  validateToken: function,
  refreshToken: function,
  logout: function,
  updateTokenStatus: function,

  // 모니터링 제어
  startTokenMonitoring: function,
  stopTokenMonitoring: function
}
```

## 🔄 자동 갱신 시스템

### 동작 원리
1. **주기적 모니터링**: 설정된 간격(기본 30초)마다 토큰 상태 확인
2. **만료 경고**: 만료 5분 전에 자동 갱신 시도
3. **자동 로그아웃**: 갱신 실패 시 자동 로그아웃
4. **페이지 포커스**: 페이지가 포커스될 때 토큰 상태 재확인

### 갱신 로직
```javascript
// 만료 5분 전에 갱신 시도
if (minutesRemaining <= warningMinutes && minutesRemaining > 0) {
  const refreshDelay = (minutesRemaining - 1) * 60 * 1000; // 1분 전에 갱신
  
  setTimeout(() => {
    refreshToken().then((result) => {
      if (result.error) {
        console.warn('토큰 자동 갱신 실패:', result.error);
        if (autoLogout) {
          handleLogout();
        }
      }
    });
  }, refreshDelay);
}
```

## 🔧 API 클라이언트 통합

### 요청 인터셉터
모든 API 요청에 자동으로 유효한 토큰을 추가합니다.

```javascript
apiClient.interceptors.request.use((config) => {
  // 로그인 요청은 토큰 제외
  if (config.url?.includes('/login')) return config;

  // 토큰 유효성 검사 후 추가
  if (isTokenValid()) {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
```

### 응답 인터셉터
인증 에러(401, 403) 발생 시 자동으로 토큰을 삭제하고 로그인 페이지로 리다이렉트합니다.

```javascript
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 🚀 사용 방법

### 1. 앱 초기화
`App.jsx`에서 토큰 관리 시스템을 초기화합니다.

```javascript
import { useTokenManagement } from "./hooks/useTokenManagement";

export default function App() {
  const { tokenInfo } = useTokenManagement({
    checkInterval: 30 * 1000,
    warningMinutes: 5,
    autoRefresh: true,
    autoLogout: true
  });

  // 개발 환경에서 토큰 상태 로깅
  useEffect(() => {
    if (import.meta.env.DEV && tokenInfo) {
      console.log("🔐 토큰 상태:", tokenInfo);
    }
  }, [tokenInfo]);

  return <Router><Root /></Router>;
}
```

### 2. 로그인 처리
로그인 성공 시 토큰을 저장합니다.

```javascript
import { saveToken } from '../utils/tokenUtils';

export const login = async ({ username, password, isAutoLogin }) => {
  const response = await apiClient.post("/login", { username, password });
  const accessToken = response.headers["access-token"];
  
  // 토큰 저장 (자동 로그인 여부에 따라 만료 시간 설정)
  const expiresIn = isAutoLogin ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  saveToken(accessToken, expiresIn);

  return { success: true, accessToken };
};
```

### 3. 컴포넌트에서 토큰 상태 확인
컴포넌트에서 토큰 상태를 확인하고 필요한 액션을 수행합니다.

```javascript
import { useSelector } from 'react-redux';
import { selectIsTokenValid, selectIsTokenExpiringSoon } from '../store/tokenSlice';

function MyComponent() {
  const isValid = useSelector(selectIsTokenValid);
  const isExpiringSoon = useSelector(selectIsTokenExpiringSoon);

  if (!isValid) {
    return <div>로그인이 필요합니다.</div>;
  }

  if (isExpiringSoon) {
    return <div>세션이 곧 만료됩니다. 자동 갱신을 시도합니다.</div>;
  }

  return <div>정상적인 사용자입니다.</div>;
}
```

## 🔒 보안 고려사항

### 1. 토큰 저장
- **안전한 형식**: JSON 형태로 만료 시간과 함께 저장
- **자동 정리**: 만료된 토큰 자동 삭제
- **에러 처리**: 저장 실패 시 적절한 에러 처리

### 2. 토큰 검증
- **실시간 검증**: API 요청 시마다 유효성 확인
- **만료 시간 확인**: 서버 시간과 클라이언트 시간 동기화 고려
- **자동 삭제**: 만료된 토큰 즉시 삭제

### 3. 자동 갱신
- **안전한 갱신**: 갱신 실패 시 자동 로그아웃
- **사용자 알림**: 갱신 상태에 대한 적절한 피드백
- **무한 루프 방지**: 갱신 실패 시 재시도 제한

## 🧪 테스트

### 토큰 유틸리티 테스트
```javascript
// 토큰 저장 테스트
const testToken = 'test-token-123';
saveToken(testToken, 60 * 1000); // 1분 후 만료

// 유효성 검사 테스트
console.log('토큰 유효:', isTokenValid());
console.log('남은 시간:', getTokenMinutesRemaining());

// 만료 테스트
setTimeout(() => {
  console.log('만료 후 유효성:', isTokenValid()); // false
}, 61 * 1000);
```

### Redux 상태 테스트
```javascript
// 토큰 저장 액션 테스트
dispatch(saveTokenAsync({ token: 'test-token', expiresIn: 60000 }));

// 상태 확인
const state = store.getState();
console.log('토큰 상태:', state.token);
```

## 📝 로그 및 디버깅

### 개발 환경 로그
개발 환경에서는 토큰 상태가 자동으로 콘솔에 출력됩니다.

```
🔐 토큰 상태: {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  isValid: true,
  isLoading: false,
  error: null,
  timeRemaining: 86340000,
  minutesRemaining: 1439,
  isExpiringSoon: false,
  lastChecked: "14:30:25"
}
```

### 토큰 정보 조회
```javascript
import { getTokenInfo } from '../utils/tokenUtils';

const info = getTokenInfo();
console.log('토큰 정보:', info);
```

## 🔄 마이그레이션 가이드

### 기존 토큰 형식에서 새 형식으로
기존에 문자열로 저장된 토큰은 자동으로 새 형식으로 변환됩니다.

```javascript
// 기존 형식 (문자열)
localStorage.setItem('authToken', 'token-value');

// 새 형식 (JSON)
{
  token: 'token-value',
  expiresAt: 1640995200000,
  issuedAt: 1640908800000
}
```

### 호환성 보장
`getTokenData()` 함수에서 기존 형식을 자동으로 감지하고 새 형식으로 변환합니다.

## 🚨 주의사항

1. **서버 시간 동기화**: 클라이언트와 서버 시간이 다를 수 있으므로 서버에서 토큰 만료 시간을 확인하는 것이 중요합니다.

2. **자동 갱신 실패**: 자동 갱신이 실패하면 사용자가 갑자기 로그아웃될 수 있으므로 적절한 사용자 알림이 필요합니다.

3. **네트워크 오류**: 네트워크 오류로 인한 갱신 실패와 실제 토큰 만료를 구분해야 합니다.

4. **보안 토큰**: 민감한 정보가 포함된 토큰은 암호화하여 저장하는 것을 고려하세요.

## 📚 관련 문서

- [보안 개선사항](./SECURITY_IMPROVEMENTS.md)
- [API 클라이언트 설정](./API_CLIENT.md)
- [Redux 상태 관리](./REDUX_STORE.md) 
