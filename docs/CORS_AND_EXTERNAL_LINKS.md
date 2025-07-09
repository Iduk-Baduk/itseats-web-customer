# CORS 및 외부 링크 처리 가이드

## 개요

ITSeats 웹 애플리케이션에서 외부 링크 처리 및 CORS 관련 사항을 설명합니다.

## 현재 외부 링크 설정

### 홈 화면 배너
- **대상 URL**: https://deepdive.goorm.io/
- **동작**: 새 탭에서 열기 (`_blank`)
- **보안 옵션**: `noopener,noreferrer` 적용

## CORS 상태 확인

### 구름톤 DEEP DIVE 사이트
```bash
curl -I https://deepdive.goorm.io/
```

**응답 헤더**:
- HTTP/1.1 200 OK
- Content-Type: text/html
- strict-transport-security: max-age=63072000; includeSubDomains; preload
- x-content-type-options: nosniff

**결론**: CORS 문제 없음, 정상 접근 가능

## 외부 링크 처리 방식

### 1. 보안 강화
```javascript
// 안전한 외부 링크 열기
window.open(url.href, '_blank', 'noopener,noreferrer');
```

**보안 옵션 설명**:
- `noopener`: 새 창이 원본 창에 접근할 수 없도록 함
- `noreferrer`: HTTP 리퍼러 정보를 전송하지 않음

### 2. 에러 처리
```javascript
try {
  const url = new URL(targetUrl);
  window.open(url.href, '_blank', 'noopener,noreferrer');
} catch (error) {
  // 폴백: 현재 탭에서 열기
  window.location.href = targetUrl;
}
```

### 3. 접근성 개선
- 키보드 네비게이션 지원 (Enter, Space 키)
- 스크린 리더 지원 (aria-label)
- 포커스 표시 스타일

## 외부 링크 추가 방법

### 1. 배너 설정 수정
```javascript
// src/config/bannerConfig.js
onClick: {
  enabled: true,
  action: "external",
  target: "https://example.com",
  analytics: {
    event: "banner_click",
    category: "home_banner",
    label: "external_link"
  }
}
```

### 2. CORS 확인
새로운 외부 링크 추가 시 다음 명령어로 CORS 상태 확인:
```bash
curl -I https://example.com
```

### 3. 테스트
- 클릭 시 새 탭에서 열리는지 확인
- 키보드로 접근 가능한지 확인
- 스크린 리더에서 정상 인식되는지 확인

## 주의사항

1. **보안**: 항상 `noopener,noreferrer` 옵션 사용
2. **사용자 경험**: 새 탭에서 열기로 현재 페이지 유지
3. **접근성**: 키보드 및 스크린 리더 지원 필수
4. **에러 처리**: 링크 열기 실패 시 폴백 제공

## 모니터링

외부 링크 클릭 시 콘솔에서 다음 정보 확인:
- 성공: "외부 링크 열기 성공: [URL]"
- 실패: "외부 링크 열기 실패: [에러]"
- 분석: Analytics event 로그 
