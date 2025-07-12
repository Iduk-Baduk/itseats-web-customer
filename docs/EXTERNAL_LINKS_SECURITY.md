# 🔒 외부 링크 보안 설정

## 개요

이 문서는 외부 링크 처리 시 보안을 강화하기 위한 설정과 구현 방법을 설명합니다.

## 🛡️ 보안 기능

### 1. 프로토콜 검증
- **기능**: 허용된 프로토콜만 사용 가능
- **기본값**: `https://`, `http://`
- **설정**: `externalLinksConfig.security.enableProtocolValidation`

### 2. 도메인 검증
- **기능**: 허용된 도메인만 접근 가능
- **기본값**: `deepdive.goorm.io`, `goorm.io`, `github.com`, `docs.github.com`
- **설정**: `externalLinksConfig.security.enableDomainValidation`

### 3. 팝업 폴백 처리
- **기능**: 팝업 차단 시 현재 탭에서 열기 여부
- **기본값**: `true`
- **설정**: `externalLinksConfig.security.enablePopupFallback`

### 4. 보안 위반 로깅
- **기능**: 보안 검증 실패 시 로그 기록
- **기본값**: `true`
- **설정**: `externalLinksConfig.security.logSecurityViolations`

## 📁 설정 파일

### `src/config/externalLinksConfig.json`

```json
{
  "allowedDomains": [
    "deepdive.goorm.io",
    "goorm.io",
    "github.com",
    "docs.github.com"
  ],
  "allowedProtocols": [
    "https://",
    "http://"
  ],
  "security": {
    "enableDomainValidation": true,
    "enableProtocolValidation": true,
    "enablePopupFallback": true,
    "logSecurityViolations": true
  }
}
```

## 🔧 사용 방법

### 1. 기본 사용법
```javascript
import { handleExternalLink } from '../config/bannerConfig';

// 안전한 외부 링크 열기
handleExternalLink('https://deepdive.goorm.io/');
```

### 2. 설정 커스터마이징
```javascript
// 새로운 도메인 추가
const config = {
  ...externalLinksConfig,
  allowedDomains: [
    ...externalLinksConfig.allowedDomains,
    'example.com'
  ]
};

// 보안 검증 비활성화 (개발 환경에서만)
const devConfig = {
  ...externalLinksConfig,
  security: {
    ...externalLinksConfig.security,
    enableDomainValidation: false
  }
};
```

## 🚨 보안 고려사항

### 1. 프로토콜 제한
- **권장**: `https://`만 허용
- **이유**: 데이터 전송 보안 강화
- **예외**: 개발 환경에서 `http://` 허용 가능

### 2. 도메인 화이트리스트
- **원칙**: 필요한 도메인만 허용
- **관리**: 정기적인 도메인 목록 검토
- **추가**: 새로운 도메인 추가 시 보안 검토

### 3. 팝업 폴백 처리
- **장점**: 사용자 경험 개선
- **단점**: 보안 위험 증가
- **권장**: 신뢰할 수 있는 도메인만 폴백 허용

## 📝 로그 및 모니터링

### 개발 환경 로그
```
외부 링크 열기 성공: https://deepdive.goorm.io/
팝업이 차단되었습니다. 현재 탭에서 열기로 폴백합니다.
보안 검증 실패로 링크를 열지 않습니다: 허용되지 않는 도메인입니다
```

### 프로덕션 환경 모니터링
- 보안 위반 로그 수집
- 허용되지 않는 도메인 접근 시도 추적
- 프로토콜 위반 패턴 분석

## 🔄 마이그레이션 가이드

### 기존 코드에서 새 보안 시스템으로
```javascript
// 기존 코드
const handleClick = () => {
  window.open('https://example.com', '_blank');
};

// 새 보안 시스템
const handleClick = () => {
  handleExternalLink('https://example.com');
};
```

### 설정 파일 업데이트
1. `externalLinksConfig.json` 파일 생성
2. 허용할 도메인과 프로토콜 설정
3. 보안 옵션 활성화/비활성화
4. 테스트 및 검증

## 🧪 테스트

### 보안 검증 테스트
```javascript
// 유효한 링크
handleExternalLink('https://deepdive.goorm.io/'); // 성공

// 허용되지 않는 프로토콜
handleExternalLink('ftp://example.com'); // 실패

// 허용되지 않는 도메인
handleExternalLink('https://malicious.com'); // 실패

// 잘못된 URL 형식
handleExternalLink('invalid-url'); // 실패
```

### 팝업 차단 테스트
```javascript
// 팝업 차단 시뮬레이션
// 브라우저에서 팝업 차단 설정 후 테스트
handleExternalLink('https://deepdive.goorm.io/');
// 예상 결과: "팝업이 차단되었습니다. 현재 탭에서 열기로 폴백합니다."
```

## 📚 관련 문서

- [CORS 및 외부 링크 처리](./CORS_AND_EXTERNAL_LINKS.md)
- [보안 개선사항](./SECURITY_IMPROVEMENTS.md)
- [배너 설정 가이드](./VIDEO_BANNER_GUIDE.md)

## ⚠️ 주의사항

1. **도메인 추가 시**: 새로운 도메인을 추가하기 전에 보안 검토 필수
2. **프로토콜 변경**: `http://`에서 `https://`로 변경 권장
3. **팝업 폴백**: 보안 위험을 고려하여 신중하게 설정
4. **정기 검토**: 허용된 도메인 목록을 정기적으로 검토하고 업데이트

## 🔄 버전 관리

- **v1.0.0**: 초기 보안 설정 구현
- **향후 계획**: 
  - CSP (Content Security Policy) 통합
  - 실시간 도메인 검증
  - 보안 이벤트 알림 시스템 
