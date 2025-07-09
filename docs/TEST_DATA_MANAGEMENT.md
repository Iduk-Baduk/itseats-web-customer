# 테스트 데이터 관리 가이드

## 개요

이 문서는 `paymentTestUtils`의 테스트 데이터 관리 시스템에 대한 설명과 사용법을 다룹니다.

## 주요 기능

### 1. 자동 정리 시스템

테스트 데이터는 다음 상황에서 자동으로 정리됩니다:

#### 페이지 언로드 시
- 사용자가 페이지를 떠날 때 즉시 정리
- 브라우저 탭을 닫거나 새로고침할 때

#### 장시간 비활성 상태 시
- **5분간 비활성 상태**일 때만 정리
- 탭 전환 시 즉시 정리하지 않음 (테스트 진행 중 방해 방지)
- 다시 활성화되면 타이머가 취소됨

### 2. 수동 정리

```javascript
import paymentTestUtils from '../utils/paymentTestUtils';

// 테스트 데이터 수동 정리
paymentTestUtils.cleanupTestData();
```

## 개선된 자동 정리 로직

### 이전 문제점
- 탭 전환 시마다 즉시 테스트 데이터 삭제
- 진행 중인 테스트가 중단될 수 있음
- 사용자 경험 저하

### 개선사항
- **5분 비활성 타이머** 도입
- 탭 전환 시 즉시 정리하지 않음
- 다시 활성화되면 타이머 취소
- 메모리 누수 방지를 위한 타이머 정리

### 구현 세부사항

```javascript
// 장시간 비활성 상태일 때만 정리 (5분)
let inactivityTimer;
const handleVisibilityChange = () => {
  if (document.hidden) {
    // 5분 후 정리
    inactivityTimer = setTimeout(() => {
      this.cleanupTestData();
    }, 5 * 60 * 1000);
  } else {
    // 다시 활성화되면 타이머 취소
    clearTimeout(inactivityTimer);
  }
};
```

## 테스트 데이터 상태 확인

```javascript
// 테스트 데이터 상태 확인
const status = paymentTestUtils.getTestDataStatus();
console.log(status);
// {
//   valid: true,
//   hasAutoCleanup: true,
//   isTestEnvironment: true,
//   timestamp: "2024-01-01T00:00:00.000Z"
// }
```

## 환경별 동작

### 개발 환경
- 자동 정리 활성화
- 5분 비활성 타이머 적용
- 상세한 로깅

### 프로덕션 환경
- 자동 정리 비활성화
- 테스트 데이터 생성/정리 불가
- 보안상 안전

## 메모리 관리

### 타이머 정리
- 컴포넌트 언마운트 시 타이머 정리
- 이벤트 리스너 제거
- 메모리 누수 방지

### 세션 격리
- 세션별 고유 ID 생성
- 세션 불일치 시 데이터 무효화
- 보안 강화

## 사용 예시

### 기본 사용법
```javascript
// 테스트 데이터 초기화
paymentTestUtils.initializeTestData();

// 테스트 카드 정보 가져오기
const testCard = paymentTestUtils.getTestCard('success');

// 테스트 완료 후 정리
paymentTestUtils.cleanupTestData();
```

### React 컴포넌트에서 사용
```javascript
import { useEffect } from 'react';
import paymentTestUtils from '../utils/paymentTestUtils';

function PaymentTestComponent() {
  useEffect(() => {
    // 컴포넌트 마운트 시 테스트 데이터 초기화
    paymentTestUtils.initializeTestData();
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      paymentTestUtils.cleanupTestData();
    };
  }, []);
  
  // 컴포넌트 로직...
}
```

## 주의사항

1. **테스트 환경에서만 사용**: 프로덕션에서는 자동으로 비활성화됩니다.
2. **타이머 관리**: 컴포넌트 언마운트 시 반드시 정리해야 합니다.
3. **세션 일관성**: 세션이 변경되면 기존 테스트 데이터는 무효화됩니다.
4. **메모리 누수 방지**: 이벤트 리스너와 타이머를 적절히 정리해야 합니다.

## 문제 해결

### 자동 정리가 작동하지 않는 경우
1. 개발 환경인지 확인
2. 브라우저 콘솔에서 로그 확인
3. 이벤트 리스너 등록 상태 확인

### 메모리 누수 의심 시
1. 타이머 정리 확인
2. 이벤트 리스너 제거 확인
3. 컴포넌트 언마운트 시 정리 호출 확인

## 관련 파일

- `src/utils/paymentTestUtils.js`: 메인 테스트 유틸리티
- `src/config/testCards.json`: 테스트 카드 설정
- `docs/TEST_CARDS_CONFIG.md`: 테스트 카드 설정 가이드 
