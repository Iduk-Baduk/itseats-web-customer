# 테스트 카드 설정 파일

## 개요

`src/config/testCards.json` 파일은 토스페이먼츠 결제 테스트를 위한 공식 테스트 카드 번호들을 관리합니다.

## 파일 구조

```json
{
  "testCards": {
    "success": {
      "number": "5200-0000-0000-1001",
      "expiry": "12/25",
      "cvc": "123",
      "description": "토스페이먼츠 정상 승인 테스트 카드",
      "expectedResult": "결제 성공"
    }
  },
  "metadata": {
    "provider": "TossPayments",
    "version": "1.0.0",
    "source": "https://docs.tosspayments.com/reference/testing"
  },
  "testScenarios": {
    "success": "정상적인 결제 승인 시나리오"
  }
}
```

## 테스트 카드 목록

### 1. 정상 승인 (success)
- **카드 번호**: `5200-0000-0000-1001`
- **유효기간**: `12/25`
- **CVC**: `123`
- **예상 결과**: 결제 성공
- **용도**: 정상적인 결제 플로우 테스트

### 2. 잔액 부족 (insufficient)
- **카드 번호**: `5200-0000-0000-1019`
- **유효기간**: `12/25`
- **CVC**: `123`
- **예상 결과**: 잔액 부족 오류
- **용도**: 카드 잔액 부족 상황 테스트

### 3. 카드 만료 (expired)
- **카드 번호**: `5200-0000-0000-1027`
- **유효기간**: `12/20`
- **CVC**: `123`
- **예상 결과**: 카드 만료 오류
- **용도**: 만료된 카드 처리 테스트

### 4. 유효하지 않은 카드 (invalid)
- **카드 번호**: `5200-0000-0000-1035`
- **유효기간**: `12/25`
- **CVC**: `123`
- **예상 결과**: 유효하지 않은 카드 오류
- **용도**: 잘못된 카드 정보 처리 테스트

### 5. 타임아웃 (timeout)
- **카드 번호**: `5200-0000-0000-1043`
- **유효기간**: `12/25`
- **CVC**: `123`
- **예상 결과**: 요청 타임아웃
- **용도**: 네트워크 지연 상황 테스트

### 6. 네트워크 오류 (network)
- **카드 번호**: `5200-0000-0000-1051`
- **유효기간**: `12/25`
- **CVC**: `123`
- **예상 결과**: 네트워크 오류
- **용도**: 네트워크 연결 실패 상황 테스트

### 7. 결제 취소 (canceled)
- **카드 번호**: `5200-0000-0000-1069`
- **유효기간**: `12/25`
- **CVC**: `123`
- **예상 결과**: 결제 취소
- **용도**: 사용자 결제 취소 상황 테스트

## 사용 방법

### 1. 기본 사용

```javascript
import { PaymentTestUtils } from '../utils/paymentTestUtils';

const paymentTest = new PaymentTestUtils();

// 기본 테스트 카드 정보
const card = paymentTest.getTestCard('success');
console.log(card); // { number: '5200-0000-0000-1001', expiry: '12/25', cvc: '123' }

// 상세 정보 포함
const details = paymentTest.getTestCardDetails('success');
console.log(details);
// {
//   number: '5200-0000-0000-1001',
//   expiry: '12/25',
//   cvc: '123',
//   description: '토스페이먼츠 정상 승인 테스트 카드',
//   expectedResult: '결제 성공',
//   scenario: '정상적인 결제 승인 시나리오',
//   provider: 'TossPayments',
//   version: '1.0.0'
// }
```

### 2. 사용 가능한 시나리오 조회

```javascript
// 모든 테스트 시나리오 목록
const scenarios = paymentTest.getAvailableTestScenarios();
console.log(scenarios);
// [
//   {
//     type: 'success',
//     description: '정상적인 결제 승인 시나리오',
//     cardNumber: '5200-0000-0000-1001',
//     expectedResult: '결제 성공'
//   },
//   // ... 기타 시나리오들
// ]
```

### 3. 메타데이터 조회

```javascript
// 테스트 카드 메타데이터
const metadata = paymentTest.getTestCardsMetadata();
console.log(metadata);
// {
//   provider: 'TossPayments',
//   version: '1.0.0',
//   lastUpdated: '2024-01-01',
//   description: '토스페이먼츠 공식 테스트 카드 번호 목록',
//   source: 'https://docs.tosspayments.com/reference/testing',
//   availableScenarios: ['success', 'insufficient', 'expired', ...],
//   totalCards: 7
// }
```

### 4. 결제 시뮬레이션

```javascript
// 특정 시나리오로 결제 시뮬레이션
try {
  const result = await paymentTest.simulatePayment('success');
  console.log('결제 성공:', result);
} catch (error) {
  console.error('결제 실패:', error.message);
}
```

## 보안 주의사항

### 1. 테스트 환경에서만 사용
- 이 카드들은 **테스트 환경에서만** 사용해야 합니다.
- 실제 결제에는 절대 사용하지 마세요.

### 2. 환경 변수 설정
```bash
# .env 파일
VITE_PAYMENT_TEST_MODE=true
```

### 3. 프로덕션 환경 확인
```javascript
// 프로덕션 환경에서는 테스트 카드 사용 불가
if (process.env.NODE_ENV === 'production') {
  console.error('프로덕션 환경에서는 테스트 카드를 사용할 수 없습니다.');
}
```

## 테스트 시나리오별 사용법

### 1. 정상 결제 테스트
```javascript
const card = paymentTest.getTestCard('success');
// 결제 폼에 입력하여 정상 승인 테스트
```

### 2. 오류 상황 테스트
```javascript
// 잔액 부족 테스트
const insufficientCard = paymentTest.getTestCard('insufficient');

// 카드 만료 테스트
const expiredCard = paymentTest.getTestCard('expired');

// 유효하지 않은 카드 테스트
const invalidCard = paymentTest.getTestCard('invalid');
```

### 3. 네트워크 오류 테스트
```javascript
// 타임아웃 테스트
const timeoutCard = paymentTest.getTestCard('timeout');

// 네트워크 오류 테스트
const networkCard = paymentTest.getTestCard('network');
```

## 유지보수

### 1. 새로운 테스트 카드 추가
1. `src/config/testCards.json` 파일 열기
2. `testCards` 객체에 새로운 카드 정보 추가
3. `testScenarios`에 시나리오 설명 추가
4. `metadata.lastUpdated` 필드 업데이트

### 2. 기존 카드 정보 수정
1. 해당 카드의 정보 수정
2. `expectedResult` 필드 업데이트
3. `metadata.version` 증가
4. 변경 사항 커밋

### 3. 카드 제거
1. 사용하지 않는 카드 정보 제거
2. 관련 시나리오 설명 제거
3. 코드에서 해당 카드 참조 제거

## 모니터링

### 1. 테스트 카드 사용 로그
```javascript
// 테스트 카드 사용 시 로그 출력
logger.log('테스트 카드 사용:', {
  type: 'success',
  cardNumber: card.number,
  timestamp: new Date().toISOString()
});
```

### 2. 오류 상황 모니터링
```javascript
// 예상과 다른 결과 발생 시 알림
if (result.status !== expectedResult) {
  logger.warn('테스트 결과가 예상과 다릅니다:', {
    expected: expectedResult,
    actual: result.status,
    cardType: type
  });
}
```

## 관련 문서

- [토스페이먼츠 공식 문서](https://docs.tosspayments.com/reference/testing)
- [결제 테스트 유틸리티 가이드](./PAYMENT_TEST_UTILS.md)
- [결제 시뮬레이션 가이드](./PAYMENT_SIMULATION.md) 
