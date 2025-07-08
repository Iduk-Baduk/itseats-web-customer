# 🚀 PR: 토스페이먼츠 결제위젯 연동 및 API 에러 처리 개선

## 📋 개요
토스페이먼츠 결제위젯을 장바구니 결제 시스템에 연동하고, API 호출 방식을 통일하며, 결제 실패 시 사용자 경험을 개선하는 종합적인 작업을 완료했습니다.

## ✨ 주요 기능

### 1. 토스페이먼츠 결제위젯 연동
- **토스페이먼츠 SDK 설치 및 초기화**
- **결제 UI 및 이용약관 UI 렌더링**
- **동적 결제 금액 업데이트**
- **결제 방법 선택 섹션에 토스페이먼츠 옵션 추가**
- **쿠폰 할인 정보 표시**

### 2. 토스페이먼츠 전용 API 서비스
- **`tossPaymentAPI.js` 생성**: 결제 승인, 조회, 취소 API
- **Mock 모드 지원**: 개발 환경에서 실제 API 없이도 테스트 가능
- **통일된 에러 처리 및 로깅**
- **토스페이먼츠 전용 결제 성공 페이지** (`TossPaymentSuccess.jsx`)

### 3. API 호출 방식 통일
- **중앙화된 API 서비스**: 모든 토스페이먼츠 API 호출이 `tossPaymentAPI` 서비스 사용
- **코드 일관성 향상**: 유지보수성 및 가독성 개선
- **서비스 인덱스 파일 업데이트**: 통합된 API 관리

### 4. 결제 실패 시 장바구니 리다이렉트
- **자연스러운 플로우**: 결제 실패 → 장바구니 → 재주문
- **토스페이먼츠 실패 URL 설정**: `redirect=/cart` 파라미터 추가
- **사용자 친화적 버튼**: "장바구니로 돌아가기" 버튼으로 의도 명확화

### 5. API 에러 처리 강화
- **API 재시도 유틸리티** (`apiRetry.js`): 지수 백오프를 사용한 스마트 재시도
- **주문 API 재시도 로직**: 500 에러 시 자동으로 2회 재시도
- **사용자 친화적 에러 메시지**: 기술적 용어 대신 이해하기 쉬운 메시지
- **통합 에러 핸들러** (`ApiErrorHandler.jsx`): 장바구니 이동 버튼 지원

### 6. 주문 상태 페이지 개선
- **에러 시 장바구니 이동**: 주문 정보 로드 실패 시 장바구니로 이동 옵션
- **전용 에러 UI**: 명확한 에러 메시지와 액션 버튼
- **에러 상태 CSS 스타일**: 사용자 친화적인 디자인

## 🔧 기술적 구현

### 토스페이먼츠 결제위젯
```javascript
// 결제위젯 초기화 및 렌더링
const widgets = await loadPaymentWidget(clientKey, customerKey);
widgets.renderPaymentMethods('#payment-method', { value: amount });
widgets.renderAgreement('#agreement', { variantKey: 'DEFAULT' });

// 결제 요청
await widgets.requestPayment({
  orderId: orderId,
  orderName: orderName,
  successUrl: window.location.origin + "/payments/toss-success",
  failUrl: window.location.origin + "/payments/failure?redirect=/cart",
  customerEmail: customerEmail,
  customerName: customerName,
  customerMobilePhone: customerMobilePhone,
});
```

### API 재시도 로직
```javascript
// 지수 백오프를 사용한 재시도
export async function retryApiCall(apiCall, options = {}) {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }
      const waitTime = delay * Math.pow(backoff, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}
```

### 토스페이먼츠 API 서비스
```javascript
class TossPaymentAPI {
  async confirmPayment(paymentData) {
    const response = await fetch(`${this.baseURL}/api/payments/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa('test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6:')}`,
      },
      body: JSON.stringify(paymentData),
    });
    
    if (!response.ok) {
      throw new Error(result.message || '결제 승인에 실패했습니다.');
    }
    
    return result;
  }
}
```

## 📁 변경된 파일

### 새로 생성된 파일
- `src/components/payment/TossPaymentWidget.jsx` - 토스페이먼츠 결제위젯 컴포넌트
- `src/pages/payments/TossPaymentSuccess.jsx` - 토스페이먼츠 전용 성공 페이지
- `src/services/tossPaymentAPI.js` - 토스페이먼츠 API 서비스
- `src/utils/apiRetry.js` - API 재시도 유틸리티
- `src/components/common/ApiErrorHandler.jsx` - 통합 에러 처리 컴포넌트

### 수정된 파일
- `src/pages/orders/Cart.jsx` - 토스페이먼츠 결제 방법 추가
- `src/pages/orders/Cart.module.css` - 토스페이먼츠 스타일 추가
- `src/Root.jsx` - 토스페이먼츠 성공 페이지 라우터 추가
- `src/services/index.js` - 토스페이먼츠 API 서비스 export 추가
- `src/services/apiClient.js` - 에러 처리 강화
- `src/services/orderAPI.js` - 재시도 로직 적용
- `src/pages/payments/PaymentFailure.jsx` - 장바구니 이동 버튼 추가
- `src/pages/orders/OrderStatus.jsx` - 에러 시 장바구니 이동 옵션
- `src/pages/orders/OrderStatus.module.css` - 에러 상태 스타일 추가

## 🎯 사용자 경험 개선

### Before (기존)
- 토스페이먼츠 결제 시스템 미연동
- 결제 실패 시 홈으로 이동하여 재주문 프로세스 재시작
- API 에러 시 기술적 메시지 표시
- 서버 오류 시 수동 새로고침 필요

### After (개선)
- 토스페이먼츠 결제 시스템 완전 연동
- 결제 실패 → 장바구니로 자동 이동 → 바로 재주문 가능
- 친화적인 에러 메시지로 상황 명확히 안내
- 자동 재시도로 일시적 서버 오류 해결

## 🧪 테스트 시나리오

### 1. 토스페이먼츠 결제 플로우
1. 장바구니에서 토스페이먼츠 결제 방법 선택
2. 결제위젯 렌더링 및 결제 정보 입력
3. 결제 진행 및 성공/실패 처리
4. 성공 시 토스페이먼츠 전용 성공 페이지
5. 실패 시 장바구니로 자동 리다이렉트

### 2. API 에러 처리
1. 서버 500 에러 발생 시나리오
2. 자동 재시도 로직 동작 확인
3. 사용자 친화적 에러 메시지 표시
4. 장바구니 이동 버튼 동작 확인

### 3. 결제 실패 복구
1. 결제 취소 또는 실패 시나리오
2. 장바구니로 자동 이동 확인
3. 재주문 프로세스 원활성 검증

## 🔍 코드 품질

- **타입 안전성**: 에러 객체에 명확한 타입 정의
- **재사용성**: ApiErrorHandler 컴포넌트로 통합 에러 처리
- **성능**: 지수 백오프로 서버 부하 최소화
- **유지보수성**: 중앙화된 API 처리 로직
- **확장성**: 다른 결제 수단 추가 시 쉽게 확장 가능

## 📊 성능 영향

### 긍정적 영향
- 자동 재시도로 사용자 대기 시간 단축
- 토스페이먼츠 SDK로 안정적인 결제 처리
- 사용자 친화적 에러 처리로 만족도 향상

### 최적화
- 재시도 횟수와 간격을 적절히 조정하여 균형 유지
- Mock 모드로 개발 환경 최적화

## ⚠️ 주의사항

- **환경 설정**: 토스페이먼츠 클라이언트 키 설정 필요
- **Mock 모드**: 개발 환경에서는 Mock API 사용
- **실제 서버**: 운영 환경에서만 실제 토스페이먼츠 API 호출
- **테스트**: 실제 결제 전 충분한 테스트 필요

## 📋 다음 단계

- [ ] 실제 토스페이먼츠 서버 환경에서 테스트
- [ ] 결제 성공/실패 로그 분석 시스템 구축
- [ ] 다른 결제 수단과의 통합 검토
- [ ] 사용자 피드백 수집 및 개선

## 📝 커밋 히스토리

| 커밋 해시 | 제목 | 설명 |
|-----------|------|------|
| `a238d48` | feat: 토스페이먼츠 결제위젯 연동 구현 | 토스페이먼츠 SDK 설치 및 기본 연동 |
| `b555e02` | fix: 토스페이먼츠 결제위젯 파라미터 수정 | 파라미터 오류 수정 및 중복 키 경고 해결 |
| `a9549a0` | refactor: 토스페이먼츠 API 호출 방식 통일 | API 서비스 중앙화 및 코드 일관성 개선 |
| `74ce8ca` | feat: 결제 실패 시 장바구니 리다이렉트 및 API 에러 처리 개선 | 사용자 경험 개선 및 에러 처리 강화 |

---

**브랜치**: `feat/#106-toss-api-v3`  
**커밋 범위**: `a238d48` ~ `74ce8ca` (4개 커밋)  
**변경 파일**: 15개 파일 (약 800줄 추가, 50줄 삭제)  
**주요 기능**: 토스페이먼츠 연동, API 통일, 에러 처리 개선, 사용자 경험 향상 
