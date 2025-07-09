# 민감한 키워드 설정 파일

## 개요

`src/config/sensitiveKeys.json` 파일은 클라이언트 스토리지에 저장되지 않아야 하는 민감한 정보의 키워드 목록을 관리합니다.

## 파일 구조

```json
{
  "sensitiveKeys": [
    "token",
    "auth",
    "password",
    "secret",
    "key",
    "credential",
    // ... 기타 민감한 키워드들
  ],
  "description": "민감한 정보로 간주되는 키워드 목록입니다.",
  "version": "1.0.0",
  "lastUpdated": "2024-01-01",
  "maintainer": "Security Team"
}
```

## 주요 키워드 카테고리

### 1. 인증 관련
- `token`, `auth`, `jwt`, `bearer`
- `access_token`, `refresh_token`, `authorization`
- `session`, `credential`

### 2. 암호화 관련
- `password`, `secret`, `key`
- `api_key`, `private_key`, `public_key`
- `encryption_key`, `signature`, `hash`

### 3. 결제 관련
- `payment_token`, `toss_payment_key`
- `order_secret`, `user_secret`

### 4. 암호화 알고리즘 관련
- `rsa_key`, `ecdsa_key`, `hmac_key`
- `aes_key`, `des_key`, `sha_key`
- 기타 다양한 암호화 알고리즘 키워드

## 사용 방법

### 1. 기본 사용

```javascript
import { securityUtils } from '../utils/securityUtils';

// 민감한 키워드인지 확인
const isSensitive = securityUtils.isSensitiveKey('user_token');
if (isSensitive) {
  console.error('민감한 정보는 스토리지에 저장할 수 없습니다.');
}

// 민감한 키워드 목록 조회
const sensitiveKeys = securityUtils.getSensitiveKeys();
console.log('민감한 키워드 목록:', sensitiveKeys);
```

### 2. 개발 환경에서 키워드 추가

```javascript
// 개발 환경에서만 가능
securityUtils.updateSensitiveKeys([
  ...securityUtils.getSensitiveKeys(),
  'new_sensitive_key'
]);
```

## 보안 정책

### 1. 저장 금지 원칙
- 민감한 키워드가 포함된 데이터는 `localStorage`나 `sessionStorage`에 저장되지 않습니다.
- 대신 HttpOnly 쿠키나 서버 측 세션을 사용하세요.

### 2. 검증 프로세스
- 키워드 매칭은 대소문자 구분 없이 수행됩니다.
- 부분 문자열 매칭을 사용하여 `user_token`도 `token` 키워드에 매칭됩니다.

### 3. 에러 처리
- 민감한 정보 저장 시도 시 즉시 에러를 발생시킵니다.
- 상세한 에러 메시지로 개발자에게 안전한 대안을 제시합니다.

## 유지보수

### 1. 키워드 추가
새로운 민감한 키워드를 추가할 때:

1. `src/config/sensitiveKeys.json` 파일을 열기
2. `sensitiveKeys` 배열에 새로운 키워드 추가
3. `lastUpdated` 필드 업데이트
4. 변경 사항을 커밋하고 팀에 알리기

### 2. 키워드 제거
더 이상 민감하지 않은 키워드를 제거할 때:

1. 해당 키워드가 정말 안전한지 확인
2. 관련 코드에서 사용 중인지 검토
3. `sensitiveKeys` 배열에서 제거
4. `lastUpdated` 필드 업데이트

### 3. 버전 관리
- `version` 필드를 통해 설정 파일의 버전을 추적
- 주요 변경 시 버전 번호를 증가
- 변경 이력을 커밋 메시지에 기록

## 테스트

### 1. 단위 테스트

```javascript
import { securityUtils } from '../utils/securityUtils';

describe('Sensitive Keys', () => {
  test('should detect sensitive keys', () => {
    expect(securityUtils.isSensitiveKey('user_token')).toBe(true);
    expect(securityUtils.isSensitiveKey('api_key')).toBe(true);
    expect(securityUtils.isSensitiveKey('user_name')).toBe(false);
  });

  test('should return sensitive keys list', () => {
    const keys = securityUtils.getSensitiveKeys();
    expect(Array.isArray(keys)).toBe(true);
    expect(keys).toContain('token');
    expect(keys).toContain('password');
  });
});
```

### 2. 통합 테스트

```javascript
test('should prevent storing sensitive data', () => {
  expect(() => {
    securityUtils.secureStore('user_token', 'sensitive_data');
  }).toThrow('민감 정보는 스토리지에 저장할 수 없습니다');
});
```

## 모니터링

### 1. 로그 확인
- 민감한 정보 저장 시도 시 콘솔에 에러 로그 출력
- 개발 환경에서 상세한 디버깅 정보 제공

### 2. 알림 설정
- 프로덕션 환경에서 민감한 정보 저장 시도 시 알림
- 보안 팀에 자동 보고 시스템 구축 고려

## 관련 문서

- [보안 유틸리티 가이드](./SECURITY_UTILS.md)
- [스토리지 보안 정책](./STORAGE_SECURITY.md)
- [토큰 관리 가이드](./TOKEN_MANAGEMENT.md) 
