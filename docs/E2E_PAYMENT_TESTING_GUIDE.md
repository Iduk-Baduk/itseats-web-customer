# E2E 결제 플로우 종합 테스트 가이드

## 📋 개요

토스페이먼츠 결제 연동이 완료된 후, 전체 결제 플로우의 안정성과 사용자 경험을 검증하기 위한 종합 테스트 가이드입니다.

## 🎯 테스트 목표

### 1. 기능적 테스트
- 장바구니 → 결제 → 성공/실패 페이지 전체 플로우
- 토스페이먼츠 위젯 정상 동작
- 백엔드 API 연동 검증
- 주문 상태 업데이트 확인

### 2. 사용자 경험 테스트
- 결제 과정의 부드러운 진행
- 에러 상황에서의 적절한 안내
- 로딩 상태 및 피드백 제공
- 모바일 환경 최적화

### 3. 안정성 테스트
- 네트워크 오류 상황 처리
- 중복 결제 방지
- 데이터 일관성 유지
- 메모리 누수 방지

## 🧪 테스트 시나리오

### 시나리오 1: 정상 결제 플로우

#### 1.1 장바구니 설정
```javascript
// 테스트 데이터 준비
const testCartData = {
  storeId: "store_001",
  items: [
    {
      menuId: "menu_001",
      menuName: "테스트 메뉴 1",
      quantity: 2,
      price: 8000
    },
    {
      menuId: "menu_002", 
      menuName: "테스트 메뉴 2",
      quantity: 1,
      price: 12000
    }
  ],
  totalAmount: 28000,
  deliveryFee: 0
};
```

#### 1.2 결제 페이지 접근
- [ ] 장바구니에서 "결제하기" 버튼 클릭
- [ ] 결제 페이지 정상 로드 확인
- [ ] 주문 정보 표시 확인
- [ ] 결제 수단 선택 가능 확인

#### 1.3 토스페이먼츠 위젯 테스트
- [ ] 위젯 정상 렌더링 확인
- [ ] 카드 정보 입력 가능 확인
- [ ] 유효성 검증 동작 확인
- [ ] 결제 버튼 활성화 확인

#### 1.4 결제 승인 테스트
- [ ] 결제 요청 전송 확인
- [ ] 백엔드 API 호출 확인
- [ ] 응답 데이터 처리 확인
- [ ] 성공 페이지 이동 확인

#### 1.5 성공 페이지 검증
- [ ] 결제 완료 메시지 표시
- [ ] 주문 번호 표시
- [ ] 결제 금액 표시
- [ ] 결제 수단 정보 표시
- [ ] 주문 내역 페이지 링크 동작

### 시나리오 2: 결제 실패 플로우

#### 2.1 카드 한도 초과
```javascript
// 테스트 카드 정보
const testCardData = {
  number: "4111-1111-1111-1111", // 한도 초과 카드
  expiry: "12/25",
  cvc: "123"
};
```

#### 2.2 실패 처리 검증
- [ ] 에러 메시지 표시 확인
- [ ] 실패 페이지 이동 확인
- [ ] 재시도 옵션 제공 확인
- [ ] 장바구니로 돌아가기 동작

#### 2.3 에러 페이지 UI
- [ ] 명확한 에러 설명
- [ ] 사용자 친화적 메시지
- [ ] 다음 단계 안내
- [ ] 고객 지원 연락처

### 시나리오 3: 네트워크 오류 상황

#### 3.1 네트워크 연결 끊김
```javascript
// 네트워크 오류 시뮬레이션
const simulateNetworkError = () => {
  // 개발자 도구에서 네트워크 오프라인 모드
  // 또는 네트워크 속도 제한
};
```

#### 3.2 오류 처리 검증
- [ ] 타임아웃 처리 확인
- [ ] 재시도 로직 동작
- [ ] 사용자에게 적절한 안내
- [ ] 데이터 손실 방지

### 시나리오 4: 중복 결제 방지

#### 4.1 동시 결제 시도
```javascript
// 중복 결제 테스트
const testDuplicatePayment = async () => {
  const paymentData = {
    orderId: "test_order_001",
    amount: 15000,
    paymentKey: "test_payment_key"
  };
  
  // 동시에 여러 번 결제 요청
  const promises = [
    orderAPI.confirmPayment(paymentData),
    orderAPI.confirmPayment(paymentData),
    orderAPI.confirmPayment(paymentData)
  ];
  
  const results = await Promise.allSettled(promises);
  return results;
};
```

#### 4.2 중복 방지 검증
- [ ] 첫 번째 결제만 성공
- [ ] 나머지 요청은 에러 처리
- [ ] 중복 결제 에러 메시지
- [ ] 주문 상태 일관성 유지

## 🔧 테스트 도구 및 환경

### 1. 브라우저 개발자 도구
```javascript
// 콘솔에서 테스트 실행
const runPaymentTest = async () => {
  console.log('🧪 결제 플로우 테스트 시작');
  
  // 1. 장바구니 설정
  await setupTestCart();
  
  // 2. 결제 페이지 이동
  await navigateToPayment();
  
  // 3. 결제 위젯 테스트
  await testPaymentWidget();
  
  // 4. 결제 승인 테스트
  await testPaymentConfirmation();
  
  console.log('✅ 테스트 완료');
};
```

### 2. 네트워크 모니터링
```javascript
// 네트워크 요청 모니터링
const monitorNetworkRequests = () => {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('/api/orders/confirm')) {
        console.log('🔍 결제 API 호출:', entry);
      }
    });
  });
  
  observer.observe({ entryTypes: ['resource'] });
};
```

### 3. 성능 측정
```javascript
// 결제 플로우 성능 측정
const measurePaymentPerformance = () => {
  const startTime = performance.now();
  
  return {
    start: () => {
      startTime = performance.now();
    },
    end: () => {
      const duration = performance.now() - startTime;
      console.log(`⏱️ 결제 완료 시간: ${duration.toFixed(2)}ms`);
      return duration;
    }
  };
};
```

## 📊 테스트 체크리스트

### 기능 테스트
- [ ] 장바구니에서 결제 페이지 이동
- [ ] 결제 수단 선택 및 입력
- [ ] 토스페이먼츠 위젯 렌더링
- [ ] 결제 승인 API 호출
- [ ] 성공/실패 페이지 표시
- [ ] 주문 내역 업데이트
- [ ] 결제 정보 저장

### UI/UX 테스트
- [ ] 로딩 스피너 표시
- [ ] 에러 메시지 명확성
- [ ] 버튼 상태 변경
- [ ] 반응형 디자인
- [ ] 접근성 준수
- [ ] 다국어 지원

### 성능 테스트
- [ ] 페이지 로딩 시간 < 3초
- [ ] 결제 위젯 로딩 < 2초
- [ ] API 응답 시간 < 5초
- [ ] 메모리 사용량 안정성
- [ ] 네트워크 요청 최적화

### 보안 테스트
- [ ] 카드 정보 암호화
- [ ] HTTPS 통신 확인
- [ ] XSS 공격 방지
- [ ] CSRF 토큰 검증
- [ ] 입력값 검증

### 호환성 테스트
- [ ] Chrome (최신 버전)
- [ ] Safari (최신 버전)
- [ ] Firefox (최신 버전)
- [ ] Edge (최신 버전)
- [ ] 모바일 브라우저

## 🚨 에러 케이스 테스트

### 1. 결제 실패 시나리오
```javascript
const testPaymentFailures = [
  {
    name: "잔액 부족",
    cardNumber: "4111-1111-1111-1111",
    expectedError: "잔액이 부족합니다"
  },
  {
    name: "카드 만료",
    cardNumber: "4111-1111-1111-1112", 
    expectedError: "만료된 카드입니다"
  },
  {
    name: "잘못된 CVC",
    cardNumber: "4111-1111-1111-1113",
    expectedError: "잘못된 보안코드입니다"
  }
];
```

### 2. 네트워크 오류 시나리오
```javascript
const testNetworkErrors = [
  {
    name: "타임아웃",
    delay: 10000,
    expectedError: "요청 시간이 초과되었습니다"
  },
  {
    name: "서버 오류",
    status: 500,
    expectedError: "서버 오류가 발생했습니다"
  },
  {
    name: "네트워크 끊김",
    offline: true,
    expectedError: "네트워크 연결을 확인해주세요"
  }
];
```

## 📈 테스트 결과 분석

### 1. 성공률 측정
```javascript
const calculateSuccessRate = (testResults) => {
  const total = testResults.length;
  const success = testResults.filter(r => r.status === 'success').length;
  const rate = (success / total) * 100;
  
  console.log(`📊 테스트 성공률: ${rate.toFixed(2)}%`);
  return rate;
};
```

### 2. 성능 지표
```javascript
const analyzePerformance = (metrics) => {
  const avgLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length;
  const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
  
  console.log(`⚡ 평균 로딩 시간: ${avgLoadTime.toFixed(2)}ms`);
  console.log(`⚡ 평균 응답 시간: ${avgResponseTime.toFixed(2)}ms`);
};
```

### 3. 에러 패턴 분석
```javascript
const analyzeErrorPatterns = (errors) => {
  const errorCounts = {};
  errors.forEach(error => {
    errorCounts[error.type] = (errorCounts[error.type] || 0) + 1;
  });
  
  console.log('🚨 에러 패턴 분석:', errorCounts);
  return errorCounts;
};
```

## 🚀 테스트 실행 방법

### 1. 자동화된 테스트 실행
```bash
# TestOrder 페이지에서 테스트 실행
npm run test:payment

# 또는 브라우저에서 직접 실행
http://localhost:5173/test-order
```

### 2. 수동 테스트 시나리오
1. 장바구니에 메뉴 추가
2. 결제 페이지로 이동
3. 테스트 카드 정보 입력
4. 결제 실행
5. 결과 확인

### 3. 모니터링 및 로깅
```javascript
// 테스트 로그 활성화
localStorage.setItem('debug', 'payment:*');

// 성능 모니터링 활성화
localStorage.setItem('performance', 'true');
```

## 📝 테스트 리포트 템플릿

### 테스트 결과 요약
```
📋 테스트 결과 요약
- 테스트 날짜: 2024-12-01
- 테스트 환경: Chrome 120.0.6099.109
- 총 테스트 케이스: 25개
- 성공: 23개
- 실패: 2개
- 성공률: 92%

🚨 발견된 이슈
1. 네트워크 오류 시 재시도 로직 개선 필요
2. 모바일 환경에서 위젯 렌더링 지연

✅ 개선 사항
1. 결제 성공률 92% 달성
2. 평균 응답 시간 2.3초 달성
3. 사용자 경험 개선 완료
```

---

**마지막 업데이트**: 2024-12-01
**버전**: 1.0.0 
