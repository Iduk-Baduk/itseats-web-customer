# 🔧 백엔드 API 연동 디버깅 가이드

## 📋 현재 상황

프론트엔드에서 백엔드 API 연동을 시도하고 있으나 500 에러가 발생하고 있습니다.

## 🎯 요청 정보

### API 엔드포인트
- **URL**: `http://localhost:8080/api/orders/confirm`
- **Method**: `POST`
- **Content-Type**: `application/json`

### 요청 데이터 형식
```json
{
  "orderId": "test_order_1752112875932",
  "amount": 15000,
  "paymentKey": "test_payment_1752112875932"
}
```

### 요청 헤더
```
Content-Type: application/json
Authorization: Bearer {token} (자동 추가됨)
```

## 🔍 에러 정보

### 에러 응답
- **Status Code**: 500 (Internal Server Error)
- **Error Type**: SERVER_ERROR
- **Message**: "서버 오류가 발생했습니다."

### 프론트엔드 로그
```
백엔드 결제 승인 요청: {
  url: "http://localhost:8080/api/orders/confirm",
  method: "POST",
  data: {
    orderId: "test_order_1752112875932",
    amount: 15000,
    paymentKey: "test_payment_1752112875932"
  },
  headers: {
    "Content-Type": "application/json"
  }
}
```

## 🚨 백엔드 확인 사항

### 1. 엔드포인트 존재 여부
- `/api/orders/confirm` 엔드포인트가 구현되어 있는지 확인
- HTTP Method가 POST로 설정되어 있는지 확인

### 2. 요청 데이터 검증
- `orderId`, `amount`, `paymentKey` 필드가 모두 필수인지 확인
- 데이터 타입이 올바른지 확인 (amount는 숫자)
- 요청 데이터 검증 로직이 있는지 확인

### 3. 인증 처리
- `Authorization: Bearer {token}` 헤더를 처리하는 로직이 있는지 확인
- 토큰 검증 로직이 정상 작동하는지 확인

### 4. 토스페이먼츠 API 연동
- 토스페이먼츠 API 키가 올바르게 설정되어 있는지 확인
- 토스페이먼츠 API 호출이 정상 작동하는지 확인

## 🧪 테스트 방법

### 1. 백엔드 서버 상태 확인
```bash
curl -X GET http://localhost:8080/health
```

### 2. 엔드포인트 존재 확인
```bash
curl -X POST http://localhost:8080/api/orders/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test_order_123",
    "amount": 15000,
    "paymentKey": "test_payment_123"
  }'
```

### 3. 토큰 없이 테스트
```bash
curl -X POST http://localhost:8080/api/orders/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test_order_123",
    "amount": 15000,
    "paymentKey": "test_payment_123"
  }'
```

## 📝 백엔드 구현 가이드

### 1. 엔드포인트 구조
```java
@PostMapping("/api/orders/confirm")
public ResponseEntity<?> confirmPayment(@RequestBody PaymentConfirmRequest request) {
    // 1. 요청 데이터 검증
    // 2. 토큰 검증
    // 3. 토스페이먼츠 API 호출
    // 4. 응답 반환
}
```

### 2. 요청 DTO
```java
public class PaymentConfirmRequest {
    private String orderId;
    private Long amount;
    private String paymentKey;
    
    // getters, setters, validation
}
```

### 3. 토스페이먼츠 API 호출
```java
// 토스페이먼츠 결제 승인 API 호출
String tossApiUrl = "https://api.tosspayments.com/v1/payments/confirm";
// POST 요청으로 paymentKey, orderId, amount 전송
```

## 🔧 프론트엔드 설정

### 환경 변수
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_API_TIMEOUT=10000
```

### API 클라이언트 설정
- Base URL: `http://localhost:8080/api`
- Timeout: 10초
- 자동 토큰 추가: `Authorization: Bearer {token}`

## 📊 로그 분석

### 성공적인 요청 예시
```
백엔드 결제 승인 요청: {
  url: "http://localhost:8080/api/orders/confirm",
  method: "POST",
  data: { orderId: "...", amount: 15000, paymentKey: "..." },
  headers: { "Content-Type": "application/json" }
}
백엔드 결제 승인 성공: { ... }
```

### 실패한 요청 예시
```
백엔드 결제 승인 실패: {
  error: "서버 일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  status: 500,
  statusText: "Internal Server Error",
  data: { ... }
}
```

## 🎯 다음 단계

1. **백엔드 서버 상태 확인**
2. **엔드포인트 구현 여부 확인**
3. **요청 데이터 형식 검증**
4. **토스페이먼츠 API 연동 확인**
5. **에러 로그 상세 분석**

## 📞 연락처

백엔드 팀과 협업하여 다음 정보를 공유해주세요:
- 백엔드 서버 로그
- 엔드포인트 구현 상태
- 토스페이먼츠 API 연동 상태
- 요청 데이터 검증 로직 
