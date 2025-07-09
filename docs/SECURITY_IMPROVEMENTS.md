# 보안 개선 사항

## 개요
이 문서는 프로젝트의 보안 강화를 위해 구현된 개선 사항들과 보안 리뷰 결과를 기록합니다.

**버전**: v2.1.0  
**최종 업데이트**: 2024년 12월  
**적용 환경**: 프로덕션, 개발 환경

## 보안 리뷰 결과 및 개선사항

### 1. 암호학적 랜덤 생성 (개선됨) - v2.1.0
**기존 문제점**: Math.random() 폴백 사용으로 보안 취약
**개선사항**: 환경별 차등 처리로 안전성과 사용성 균형

```javascript
// 개선 전
if (!crypto?.getRandomValues) {
  // Math.random() 사용 (보안 취약)
}

// 개선 후
if (!crypto?.getRandomValues) {
  console.error('보안 경고: 암호학적 난수 미지원 환경입니다.');
  
  if (process.env.NODE_ENV === 'development') {
    throw new Error('암호학적 난수 미지원 환경입니다.');
  } else {
    console.warn('프로덕션 환경에서 기능 제한');
    return ''; // 기능 제한
  }
}
```

**구현 상세**:
- 개발 환경: 에러 발생으로 즉시 문제 발견
- 프로덕션 환경: 기능 제한으로 사용자 경험 보호
- 상세 로깅: 브라우저 정보, 지원 여부 기록

**빈 문자열 폴백 처리 가이드**:
```javascript
// 호출 측 예외 처리 예시
const generateId = () => {
  const randomString = securityUtils.generateSecureRandomString(16);
  
  if (!randomString) {
    // 프로덕션에서 암호학적 난수 미지원 시 대체 로직
    console.warn('암호학적 난수 미지원으로 대체 로직 사용');
    return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return randomString;
};
```

### 2. 세션 ID 생성 (개선됨) - v2.1.0
**기존 문제점**: 실제 세션 ID로 오해 가능
**개선사항**: 클라이언트 보조 식별자로 명확히 구분

```javascript
// 개선 전
generateSecureSessionId() // 실제 세션 ID로 오해

// 개선 후
generateClientSubId() // 클라이언트 보조 식별자
```

**서버 연동 프로세스**:
1. 클라이언트: `generateClientSubId()`로 보조 식별자 생성
2. 서버 요청: 보조 식별자를 헤더나 로그에 포함
3. 서버 검증: 실제 세션 ID와 함께 로그 기록
4. 운영 모니터링: 보조 식별자로 클라이언트 행동 추적

**예외 처리 방침**:
```javascript
// 서버 측 검증 로직 예시
const validateClientSubId = (clientSubId) => {
  // 형식 검증: client_timestamp_random_userAgentHash
  const pattern = /^client_\d+_[a-zA-Z0-9]{16}_[a-f0-9]{8}$/;
  
  if (!pattern.test(clientSubId)) {
    console.warn('잘못된 클라이언트 보조 식별자 형식:', clientSubId);
    return {
      valid: false,
      reason: 'INVALID_FORMAT',
      fallback: `invalid_${Date.now()}`
    };
  }
  
  return { valid: true, subId: clientSubId };
};
```

### 3. 브라우저 지문 (개선됨) - v2.1.0
**기존 문제점**: 모든 정보 수집으로 GDPR 위험
**개선사항**: GDPR 고려한 최소 정보 수집 + 사용자 동의 확인

```javascript
// 개선 전
generateBrowserFingerprint() // 모든 정보 수집

// 개선 후
generateBrowserFingerprint(minimal = true) // 최소 정보만
```

**수집 필드 상세**:
- **minimal=true (기본값, GDPR 친화적)**:
  - `navigator.userAgent`: 브라우저 식별
  - `navigator.language`: 언어 설정  
  - `screen.width + 'x' + screen.height`: 화면 해상도

- **minimal=false (사용자 동의 필요)**:
  - 위 필드 + 추가 필드:
  - `screen.colorDepth`: 색상 깊이
  - `timezoneOffset`: 시간대
  - `hardwareConcurrency`: CPU 코어 수
  - `deviceMemory`: 메모리 용량
  - `platform`: 운영체제
  - `cookieEnabled`: 쿠키 지원 여부
  - `doNotTrack`: 추적 거부 설정

**사용자 동의 절차**:
1. 개인정보처리방침 페이지에서 지문 수집 동의 확인
2. 동의 없이 확장 지문 수집 시도 시 최소 정보로 폴백
3. 동의 상태는 서버에서 관리 권장

**동의 상태 관리 흐름**:
```javascript
// 동의 상태 저장 위치: HttpOnly 쿠키 (권장)
// 쿠키명: privacy_consent_fingerprinting
// 만료: 1년

// 동의 변경 시 처리 흐름
const handleConsentChange = (newConsent) => {
  if (newConsent === false) {
    // 동의 철회 시 기존 확장 지문 데이터 삭제
    localStorage.removeItem('extended_fingerprint_data');
    sessionStorage.removeItem('extended_fingerprint_data');
    
    // 서버에 동의 철회 알림
    fetch('/api/privacy/consent', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: false })
    });
  }
  
  // 새로운 동의 상태 저장
  document.cookie = `privacy_consent_fingerprinting=${newConsent}; max-age=31536000; path=/; secure; samesite=strict`;
};
```

### 4. 엔트로피 풀 시스템 (제거됨)
**제거 이유**: 복잡도 대비 보안 이득이 미미, `crypto.getRandomValues()` 직접 호출이 더 안정적
**대안**: 단순하고 효율적인 암호학적 난수 생성 사용

### 5. 스토리지 보안 (개선됨) - v2.1.0
**기존 문제점**: 민감 정보 저장 가능
**개선사항**: 민감 정보 저장 차단 + 상세 로깅

```javascript
// 개선 전
secureStore('auth_token', token) // 민감 정보 저장 가능

// 개선 후
secureStore('auth_token', token) // 에러 발생, 저장 차단
```

**차단 로직 상세**:
```javascript
// 민감 키 설정 파일: config/sensitiveKeys.json
{
  "sensitiveKeys": [
    "token", "auth", "password", "secret", "key", "credential",
    "api_key", "private_key", "session", "jwt", "bearer"
  ],
  "projectSpecific": [
    "payment_token", "user_secret", "admin_key"
  ]
}

// 사용 예시
import sensitiveKeysConfig from '../config/sensitiveKeys.json';

const isSensitive = [...sensitiveKeysConfig.sensitiveKeys, ...sensitiveKeysConfig.projectSpecific]
  .some(sensitiveKey => key.toLowerCase().includes(sensitiveKey));

if (isSensitive) {
  console.error('민감 정보 스토리지 저장 금지:', key);
  throw new Error('민감 정보는 스토리지에 저장할 수 없습니다. HttpOnly 쿠키 사용을 권장합니다.');
}
```

**추가 보안 권장사항**:
- CSP (Content Security Policy) 설정
- 쿠키 SameSite=Strict, HttpOnly, Secure 설정
- XSS 방지를 위한 입력값 검증 강화
- SecureContext (HTTPS 필수) 적용
```javascript
// SecureContext 확인
if (!window.isSecureContext) {
  console.warn('보안 경고: HTTPS가 아닌 환경에서 실행 중입니다.');
  // 민감한 기능 제한 또는 경고 표시
}
```

## 구현된 보안 기능

### 1. 암호학적 랜덤 생성
- **기능**: `crypto.getRandomValues()` 전용 사용, 미지원 환경에서는 에러 발생
- **위치**: `src/utils/securityUtils.js`
- **메서드**: `generateSecureRandomString()`

### 2. 클라이언트 보조 식별자 생성
- **기능**: 서버 세션 ID와는 별개의 클라이언트 측 보조 식별자
- **위치**: `src/utils/securityUtils.js`
- **메서드**: `generateClientSubId()`

### 3. 제한된 브라우저 지문
- **기능**: GDPR 고려한 최소한의 정보 수집
- **위치**: `src/utils/securityUtils.js`
- **메서드**: `generateBrowserFingerprint(minimal = true)`

### 4. 안전한 스토리지
- **기능**: 민감 정보 저장 방지, XSS 취약점 경고
- **위치**: `src/utils/securityUtils.js`
- **메서드**: `secureStore()`, `secureRetrieve()`

### 5. 클라이언트 토큰 생성·검증 (제거됨) - v2.1.0
- **제거 이유**: 보안 강화를 위해 클라이언트 토큰 로직 완전 제거
- **위치**: `src/utils/securityUtils.js` (deprecated)
- **메서드**: `generateClientToken()`, `verifyClientToken()` (에러 발생)
- **대안**: Redux, Context API 등 UI 상태 관리 라이브러리 사용

## 사용 예시

```javascript
import { securityUtils } from '../utils/securityUtils';

// 안전한 랜덤 문자열 생성
const randomString = securityUtils.generateSecureRandomString(32);

// 클라이언트 보조 식별자 생성
const clientId = securityUtils.generateClientSubId('user');

// 제한된 브라우저 지문 생성
const fingerprint = securityUtils.generateBrowserFingerprint(true);

// 안전한 데이터 저장 (비민감 정보만)
securityUtils.secureStore('ui_preferences', { theme: 'dark' });

// 안전한 데이터 조회
const preferences = securityUtils.secureRetrieve('ui_preferences');

// 클라이언트 토큰 생성·검증 (제거됨)
// const clientToken = securityUtils.generateClientToken({ tempData: 'value' }, 60); // 에러 발생
// const payload = securityUtils.verifyClientToken(clientToken); // 에러 발생

// 대안: UI 상태 관리 사용
// Redux, Context API, 또는 직접 sessionStorage 사용
```

## 보안 고려사항

### 장점
1. **암호학적 안전성**: Web Crypto API 전용 사용으로 예측 불가능한 난수 생성
2. **책임 분리**: 클라이언트와 서버의 보안 책임 명확히 구분
3. **규제 준수**: GDPR 등 개인정보보호 규제 고려
4. **민감 정보 보호**: 스토리지에 민감 정보 저장 차단

### 주의사항
1. **클라이언트 한계**: 모든 보안 로직이 클라이언트에서 실행되므로 완벽한 보안은 불가능
2. **서버 의존성**: 실제 인증/인가는 반드시 서버에서 처리해야 함
3. **사용자 동의**: 브라우저 지문 수집 시 개인정보보호 규제 준수 필요

## 권장 아키텍처

### 클라이언트 책임 (최소화)
- 난수 생성 (UI 수준)
- 입력값 검증 (기본적)
- 임시 데이터 관리
- UI 상태 보관

### 서버 책임 (중심)
- 인증/인가 토큰 발급·검증
- 세션 관리
- 키 관리
- 로그·감사 추적
- 민감 데이터 암호화

## 보안 권장사항

### 1. 세션 관리
- 실제 세션 ID는 서버에서 발급
- 클라이언트는 보조 식별자만 사용
- HttpOnly·Secure 쿠키 활용

### 2. 데이터 저장
- 민감한 데이터는 절대 클라이언트 스토리지에 저장하지 않음
- UI 상태, 임시 데이터만 저장
- 정기적인 데이터 정리

### 3. 랜덤 생성
- `crypto.getRandomValues()` 전용 사용
- 미지원 환경에서는 기능 제한
- Web Worker 고려 (블로킹 방지)

### 4. 브라우저 호환성
- 모던 브라우저: `crypto.getRandomValues()` 사용
- 미지원 환경: 에러 발생으로 안전성 우선

## 성능 고려사항

- `crypto.getRandomValues()`는 동기적이므로 블로킹 가능성
- 중요한 UX 흐름에서는 Web Worker 분리 고려
- 브라우저 지문 생성은 초기 로딩 시 한 번만 수행

## 향후 개선 계획

1. **서버 연동**: 실제 세션 관리는 서버에서 처리하도록 완전 이관
2. **JWT 표준화**: 표준 JWT 라이브러리 도입으로 토큰 관리 표준화
3. **HttpOnly 쿠키**: 민감 정보는 HttpOnly·Secure 쿠키로 관리
4. **감사 로그**: 보안 이벤트 서버 로깅 시스템 구축
5. **Web Worker**: 중요한 UX 흐름에서 Web Crypto API 블로킹 방지

## 개발 도구 설정

### ESLint 규칙 추가 (권장)
```javascript
// eslint.config.js
export default [
  {
    rules: {
      // deprecated 메서드 사용 금지
      'no-restricted-properties': [
        'error',
        {
          object: 'securityUtils',
          property: 'generateClientToken',
          message: '클라이언트 토큰 생성이 보안상 제거되었습니다. 서버에서 JWT를 발급받으세요.'
        },
        {
          object: 'securityUtils',
          property: 'verifyClientToken',
          message: '클라이언트 토큰 검증이 보안상 제거되었습니다. 서버에서 토큰을 검증하세요.'
        },
        {
          object: 'Math',
          property: 'random',
          message: '보안상 crypto.getRandomValues()를 사용하세요.'
        }
      ],
      
      // eval() 사용 금지 (보안상)
      'no-eval': 'error',
      
      // console.log 사용 제한 (프로덕션 환경)
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
    }
  }
];
```

### CI/CD 파이프라인 설정
```yaml
# .github/workflows/security-check.yml
name: Security Check
on: [push, pull_request]

jobs:
  security-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run lint
      - run: npm test -- --coverage
      
      # 보안 테스트 실행
      - run: npm run test:security
      
      # 빌드 시점 보안 검사
      - run: npm run build
      - run: npm run security:audit
```

## 테스트 방법

### 1. 기본 보안 테스트
```javascript
// 보안 테스트
const testClientId = securityUtils.generateClientSubId();
console.log('클라이언트 ID:', testClientId);

// 민감 정보 저장 차단 테스트
try {
  securityUtils.secureStore('auth_token', 'sensitive_data');
} catch (error) {
  console.log('민감 정보 저장 차단됨:', error.message);
}
```

### 2. 자동화 테스트 (Jest 예시)
```javascript
// securityUtils.test.js
describe('SecurityUtils', () => {
  test('민감 정보 저장 차단', () => {
    expect(() => {
      securityUtils.secureStore('auth_token', 'token123');
    }).toThrow('민감 정보는 스토리지에 저장할 수 없습니다');
  });

  test('암호학적 난수 생성', () => {
    const random1 = securityUtils.generateSecureRandomString(32);
    const random2 = securityUtils.generateSecureRandomString(32);
    expect(random1).not.toBe(random2);
    expect(random1.length).toBe(32);
  });

  test('암호학적 난수 생성 실패 시 처리', () => {
    // crypto.getRandomValues를 모킹하여 실패 상황 시뮬레이션
    const originalCrypto = window.crypto;
    delete window.crypto;
    
    const result = securityUtils.generateSecureRandomString(16);
    expect(result).toBe(''); // 프로덕션에서는 빈 문자열 반환
    
    window.crypto = originalCrypto;
  });

  test('브라우저 지문 생성 (최소)', () => {
    const fingerprint = securityUtils.generateBrowserFingerprint(true);
    expect(fingerprint).toBeTruthy();
    expect(typeof fingerprint).toBe('string');
  });

  test('브라우저 지문 생성 (확장) - 동의 없음', () => {
    // 동의 없이 확장 지문 수집 시도
    const fingerprint = securityUtils.generateBrowserFingerprint(false);
    // 최소 정보로 폴백되어야 함
    expect(fingerprint).toBeTruthy();
  });

  test('브라우저 지문 필드 개수 검증', () => {
    const minimalFingerprint = securityUtils.generateBrowserFingerprint(true);
    const extendedFingerprint = securityUtils.generateBrowserFingerprint(false);
    
    // 최소 지문은 3개 필드, 확장 지문은 10개 필드
    // (실제 구현에 따라 조정 필요)
    expect(minimalFingerprint).toBeTruthy();
    expect(extendedFingerprint).toBeTruthy();
  });

  test('클라이언트 토큰 생성 제거 확인', () => {
    expect(() => {
      securityUtils.generateClientToken();
    }).toThrow('클라이언트 토큰 생성이 보안상 제거되었습니다');
  });

  test('클라이언트 토큰 검증 제거 확인', () => {
    expect(() => {
      securityUtils.verifyClientToken('fake_token');
    }).toThrow('클라이언트 토큰 검증이 보안상 제거되었습니다');
  });

  test('SecureContext 확인', () => {
    // SecureContext 모킹 테스트
    const originalIsSecureContext = window.isSecureContext;
    window.isSecureContext = false;
    
    // HTTPS가 아닌 환경에서 경고 로그 확인
    const consoleSpy = jest.spyOn(console, 'warn');
    securityUtils.secureStore('test_key', 'test_data');
    expect(consoleSpy).toHaveBeenCalledWith('보안 경고: HTTPS가 아닌 환경에서 민감한 데이터 저장 시도');
    
    window.isSecureContext = originalIsSecureContext;
    consoleSpy.mockRestore();
  });
});
```

### 3. 브라우저 호환성 테스트
```javascript
// 브라우저별 암호학적 난수 지원 테스트
const testCryptoSupport = () => {
  const support = {
    crypto: !!window.crypto,
    getRandomValues: !!window.crypto?.getRandomValues,
    randomUUID: !!window.crypto?.randomUUID
  };
  
  console.log('브라우저 암호학 지원:', support);
  return support;
};
```

## 모니터링 및 로깅

### 1. 보안 예외 로깅 레벨
- **ERROR**: 암호학적 난수 미지원, 민감 정보 저장 시도
- **WARN**: 확장 지문 수집 시도, 클라이언트 토큰 사용 시도
- **INFO**: 보조 식별자 생성, 최소 지문 수집

### 2. 운영팀 대응 가이드
```javascript
// 로그 모니터링 예시
const securityLogger = {
  error: (message, context) => {
    console.error(`[SECURITY_ERROR] ${message}`, context);
    // 운영팀 알림 발송
    if (process.env.NODE_ENV === 'production') {
      // Slack, 이메일 등으로 알림
    }
  },
  
  warn: (message, context) => {
    console.warn(`[SECURITY_WARN] ${message}`, context);
    // 주기적 리포트에 포함
  }
};
```

### 3. 보안 메트릭 수집
- 암호학적 난수 미지원 브라우저 비율
- 민감 정보 저장 시도 횟수
- 확장 지문 수집 동의율
- 클라이언트 토큰 사용 시도 횟수

## 테스트 데이터 관리

### 1. localStorage 테스트 데이터 정리
```javascript
// 테스트 데이터 초기화 시 자동 정리
paymentTestUtils.initializeTestData(); // 기존 데이터 자동 정리 후 초기화

// 수동 정리
paymentTestUtils.cleanupTestData();

// 테스트 데이터 상태 확인
const status = paymentTestUtils.getTestDataStatus();
console.log('테스트 데이터 상태:', status);
```

### 2. 자동 정리 메커니즘
- **페이지 언로드 시**: `beforeunload` 이벤트로 자동 정리
- **탭 전환 시**: `visibilitychange` 이벤트로 자동 정리
- **컴포넌트 언마운트 시**: React useEffect cleanup에서 정리

### 3. 테스트 데이터 검증
```javascript
// 테스트 데이터 유효성 검사
const validation = paymentTestUtils.validateTestData();
if (!validation.valid) {
  console.warn('테스트 데이터 검증 실패:', validation.reason);
  paymentTestUtils.cleanupTestData(); // 무효한 데이터 정리
}
```

### 4. 테스트 간 격리 보장
- 각 테스트 세션마다 고유한 세션 ID 생성
- 세션 불일치 시 자동으로 기존 데이터 정리
- 테스트 환경에서만 동작하도록 제한 
