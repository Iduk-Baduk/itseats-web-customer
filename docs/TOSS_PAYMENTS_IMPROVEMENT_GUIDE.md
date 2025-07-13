# 토스페이먼츠 결제 연동 개선 가이드

## 📋 현재 구현 상태 분석

### ✅ 잘 구현된 부분
1. **토스페이먼츠 SDK v2 사용**: 최신 SDK를 올바르게 사용
2. **결제위젯 연동**: `widgets()` 메서드와 `setAmount()` 사용이 공식 문서에 맞음
3. **에러 처리**: 재시도 로직과 사용자 친화적 에러 메시지 구현
4. **보안**: API 키 관리와 멱등성 키 사용이 적절

### ⚠️ 개선이 필요한 부분

## 🚀 권장 개선사항

### 1. 결제위젯 초기화 최적화

#### 현재 문제점
- 복잡한 전역 인스턴스 관리
- 불필요한 SDK 재로드 로직
- 메모리 누수 가능성

#### 개선 방안
```javascript
// 공식 문서 권장 방식으로 단순화
const loadPaymentWidget = async (clientKey, customerKey) => {
  const tossPayments = await loadTossPayments(clientKey);
  return tossPayments.widgets({ customerKey });
};

// 컴포넌트에서 사용
const [widgets, setWidgets] = useState(null);

useEffect(() => {
  const initWidget = async () => {
    try {
      const widgetInstance = await loadPaymentWidget(clientKey, customerKey);
      setWidgets(widgetInstance);
    } catch (error) {
      console.error('위젯 초기화 실패:', error);
    }
  };
  
  initWidget();
}, []);
```

### 2. 결제 금액 설정 방식 개선

#### 현재 문제점
- `setAmount()` 호출 시점이 렌더링 중
- 타입 변환 로직이 복잡함

#### 개선 방안
```javascript
// 공식 문서 권장 방식
useEffect(() => {
  if (widgets && amount) {
    widgets.setAmount({
      value: Number(amount),
      currency: 'KRW'
    });
  }
}, [widgets, amount]);
```

### 3. 결제 요청 데이터 구조 개선

#### 현재 문제점
- `orderId` 형식이 토스페이먼츠 요구사항과 다를 수 있음
- 불필요한 파라미터 전달

#### 개선 방안
```javascript
// 토스페이먼츠 요구사항에 맞는 orderId 생성
const generateTossOrderId = () => {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 결제 요청 시 필수 파라미터만 전달
await widgets.requestPayment({
  orderId: tossOrderId, // 6~64자, 영문 대소문자, 숫자, 특수문자(-,_)
  orderName: orderName,
  successUrl: `${window.location.origin}/payments/toss-success`,
  failUrl: `${window.location.origin}/payments/failure?redirect=/cart`,
  customerEmail: customerEmail,
  customerName: customerName,
  customerMobilePhone: customerMobilePhone,
});
```

### 4. 결제 성공 처리 개선

#### 현재 문제점
- `paymentId` 타입 변환 문제
- 복잡한 fallback 로직

#### 개선 방안
```javascript
// 결제 성공 페이지에서 안전한 데이터 처리
const getPaymentId = () => {
  // 1. URL 파라미터 우선
  const urlPaymentId = searchParams.get("paymentId");
  if (urlPaymentId && urlPaymentId !== 'null' && urlPaymentId !== 'undefined') {
    return String(urlPaymentId).trim();
  }
  
  // 2. sessionStorage fallback
  const storedData = sessionStorage.getItem('paymentData');
  if (storedData) {
    try {
      const parsed = JSON.parse(storedData);
      return String(parsed.backendPaymentId || '').trim();
    } catch (error) {
      console.warn('sessionStorage 파싱 실패:', error);
    }
  }
  
  throw new Error('결제 정보를 찾을 수 없습니다.');
};
```

### 5. 웹훅 연동 추가

#### 권장사항
```javascript
// 웹훅 이벤트 처리
const handleWebhookEvent = (event) => {
  switch (event.eventType) {
    case 'PAYMENT_STATUS_CHANGED':
      // 결제 상태 변경 처리
      break;
    case 'PAYMENT_CANCELED':
      // 결제 취소 처리
      break;
    default:
      console.log('알 수 없는 웹훅 이벤트:', event.eventType);
  }
};
```

### 6. 결제 취소 기능 추가

#### 구현 방안
```javascript
// 결제 취소 API 연동
const cancelPayment = async (paymentKey, cancelReason, cancelAmount = null) => {
  const requestData = {
    cancelReason,
    ...(cancelAmount && { cancelAmount })
  };
  
  const response = await fetch(`/api/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${apiKey}:`)}`
    },
    body: JSON.stringify(requestData)
  });
  
  if (!response.ok) {
    throw new Error('결제 취소에 실패했습니다.');
  }
  
  return response.json();
};
```

## 🔧 구체적인 개선 작업

### 1단계: 결제위젯 컴포넌트 단순화
- [ ] 전역 인스턴스 관리 로직 제거
- [ ] SDK 재로드 로직 단순화
- [ ] 메모리 누수 방지 로직 개선

### 2단계: 결제 데이터 처리 개선
- [ ] `orderId` 생성 로직 표준화
- [ ] `paymentId` 타입 처리 개선
- [ ] 에러 처리 로직 강화

### 3단계: 웹훅 및 취소 기능 추가
- [ ] 웹훅 이벤트 처리 구현
- [ ] 결제 취소 기능 추가
- [ ] 결제 상태 폴링 개선

### 4단계: 테스트 및 검증
- [ ] 실제 토스페이먼츠 테스트 카드 사용
- [ ] 전체 결제 플로우 E2E 테스트
- [ ] 에러 케이스 테스트

## 📚 참고 문서

- [토스페이먼츠 결제위젯 가이드](https://docs.tosspayments.com/guides/v2/payment-widget.md)
- [결제창 연동 가이드](https://docs.tosspayments.com/guides/v2/payment-window.md)
- [웹훅 연결 가이드](https://docs.tosspayments.com/guides/v2/webhook.md)
- [결제 취소 가이드](https://docs.tosspayments.com/guides/v2/cancel-payment.md)
- [API 에러 코드](https://docs.tosspayments.com/reference/error-codes.md)

## 🎯 최종 목표

1. **안정성**: 결제 프로세스의 안정성 향상
2. **사용자 경험**: 더 부드러운 결제 플로우 제공
3. **유지보수성**: 코드 복잡도 감소 및 가독성 향상
4. **확장성**: 새로운 결제 기능 추가 용이성 확보

---

**마지막 업데이트**: 2024-12-01
**버전**: 1.0.0 
