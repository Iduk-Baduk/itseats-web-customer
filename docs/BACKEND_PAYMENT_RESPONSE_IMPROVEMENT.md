# 백엔드 결제 응답 데이터 개선 가이드

## 📋 개요

현재 백엔드 결제 승인 API(`/api/orders/confirm`)가 성공적으로 연동되었으나, 응답 데이터가 `data: null`로 반환되고 있습니다. 토스페이먼츠 결제 정보를 포함한 상세한 응답 데이터로 개선이 필요합니다.

## 🔍 현재 상태

### 현재 응답 구조
```json
{
  "success": true,
  "message": "결제가 성공적으로 처리되었습니다.",
  "data": null
}
```

### 문제점
- 토스페이먼츠 결제 정보 누락
- 카드 정보, 결제 수단 등 상세 정보 부재
- 프론트엔드에서 결제 상세 정보 표시 불가

## 🎯 개선 목표

### 1. 토스페이먼츠 응답 데이터 포함
- 결제 키, 주문 ID, 결제 금액
- 결제 상태 및 승인 시간
- 결제 수단 정보

### 2. 카드 정보 추가
- 카드사, 카드 번호 마스킹
- 할부 정보
- 승인 번호

### 3. 주문 정보 연동
- 주문 상태 업데이트
- 배달 정보 연동
- 사용자 정보 포함

## 📊 권장 응답 구조

### 성공 응답 예시
```json
{
  "success": true,
  "message": "결제가 성공적으로 처리되었습니다.",
  "data": {
    "orderId": "order_20241201_001",
    "paymentKey": "5zJ4xY7m0kZny6Qo",
    "amount": 15000,
    "status": "DONE",
    "approvedAt": "2024-12-01T10:30:00+09:00",
    "paymentMethod": {
      "type": "CARD",
      "card": {
        "company": "신한카드",
        "number": "123456******1234",
        "installmentPlanMonths": 0,
        "isInterestFree": false,
        "approveNo": "00000000",
        "useCardPoint": false,
        "cardType": "CREDIT",
        "ownerType": "PERSONAL",
        "acquireStatus": "APPROVED",
        "amount": 15000
      }
    },
    "order": {
      "id": "order_20241201_001",
      "orderStatus": "WAITING",
      "storeName": "테스트 매장",
      "totalAmount": 15000,
      "deliveryAddress": "서울시 강남구 테스트로 123",
      "createdAt": "2024-12-01T10:29:30+09:00",
      "updatedAt": "2024-12-01T10:30:00+09:00"
    },
    "customer": {
      "id": "user_001",
      "name": "홍길동",
      "phone": "010-1234-5678"
    }
  }
}
```

### 에러 응답 예시
```json
{
  "success": false,
  "message": "결제 처리 중 오류가 발생했습니다.",
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "잔액 부족으로 결제가 실패했습니다.",
    "details": {
      "paymentKey": "5zJ4xY7m0kZny6Qo",
      "orderId": "order_20241201_001",
      "amount": 15000
    }
  },
  "data": null
}
```

## 🔧 구현 가이드

### 1. 토스페이먼츠 API 응답 처리

```javascript
// 백엔드 결제 승인 처리 로직
async function confirmPayment(paymentData) {
  try {
    // 1. 토스페이먼츠 API 호출
    const tossResponse = await tossPaymentsAPI.confirmPayment({
      paymentKey: paymentData.paymentKey,
      orderId: paymentData.orderId,
      amount: paymentData.amount
    });

    // 2. 응답 데이터 구조화
    const responseData = {
      orderId: tossResponse.orderId,
      paymentKey: tossResponse.paymentKey,
      amount: tossResponse.totalAmount,
      status: tossResponse.status,
      approvedAt: tossResponse.approvedAt,
      paymentMethod: {
        type: tossResponse.method,
        card: tossResponse.card || null,
        transfer: tossResponse.transfer || null,
        virtualAccount: tossResponse.virtualAccount || null,
        mobilePhone: tossResponse.mobilePhone || null,
        giftCertificate: tossResponse.giftCertificate || null,
        cashReceipt: tossResponse.cashReceipt || null
      }
    };

    // 3. 주문 정보 업데이트
    const orderData = await updateOrderStatus(paymentData.orderId, 'WAITING');
    responseData.order = orderData;

    // 4. 사용자 정보 포함
    const userData = await getUserInfo(orderData.userId);
    responseData.customer = userData;

    return {
      success: true,
      message: "결제가 성공적으로 처리되었습니다.",
      data: responseData
    };

  } catch (error) {
    return {
      success: false,
      message: "결제 처리 중 오류가 발생했습니다.",
      error: {
        code: error.code || "PAYMENT_FAILED",
        message: error.message,
        details: {
          paymentKey: paymentData.paymentKey,
          orderId: paymentData.orderId,
          amount: paymentData.amount
        }
      },
      data: null
    };
  }
}
```

### 2. 카드 정보 마스킹 처리

```javascript
function maskCardNumber(cardNumber) {
  if (!cardNumber) return null;
  const length = cardNumber.length;
  if (length <= 8) return cardNumber;
  
  const prefix = cardNumber.substring(0, 6);
  const suffix = cardNumber.substring(length - 4);
  const masked = '*'.repeat(length - 10);
  
  return `${prefix}${masked}${suffix}`;
}

function formatCardInfo(tossCardData) {
  if (!tossCardData) return null;
  
  return {
    company: tossCardData.company,
    number: maskCardNumber(tossCardData.number),
    installmentPlanMonths: tossCardData.installmentPlanMonths,
    isInterestFree: tossCardData.isInterestFree,
    approveNo: tossCardData.approveNo,
    useCardPoint: tossCardData.useCardPoint,
    cardType: tossCardData.cardType,
    ownerType: tossCardData.ownerType,
    acquireStatus: tossCardData.acquireStatus,
    amount: tossCardData.amount
  };
}
```

### 3. 에러 코드 정의

```javascript
const PAYMENT_ERROR_CODES = {
  PAYMENT_FAILED: "결제 실패",
  INSUFFICIENT_BALANCE: "잔액 부족",
  CARD_EXPIRED: "카드 만료",
  INVALID_CARD: "유효하지 않은 카드",
  PAYMENT_CANCELED: "결제 취소",
  DUPLICATE_PAYMENT: "중복 결제",
  INVALID_AMOUNT: "잘못된 금액",
  ORDER_NOT_FOUND: "주문을 찾을 수 없음",
  PAYMENT_TIMEOUT: "결제 시간 초과"
};
```

## 🧪 테스트 시나리오

### 1. 정상 결제 플로우
```bash
# 1. 테스트 주문 생성
POST /api/orders
{
  "storeId": "store_001",
  "items": [...],
  "totalAmount": 15000
}

# 2. 결제 승인
POST /api/orders/confirm
{
  "orderId": "order_001",
  "amount": 15000,
  "paymentKey": "test_payment_key"
}

# 3. 응답 검증
{
  "success": true,
  "data": {
    "orderId": "order_001",
    "paymentKey": "test_payment_key",
    "amount": 15000,
    "status": "DONE",
    "paymentMethod": {...},
    "order": {...},
    "customer": {...}
  }
}
```

### 2. 에러 케이스 테스트
```bash
# 잘못된 주문 ID
POST /api/orders/confirm
{
  "orderId": "invalid_order",
  "amount": 15000,
  "paymentKey": "test_key"
}

# 응답
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "주문을 찾을 수 없습니다."
  }
}
```

## 📱 프론트엔드 연동

### 1. 결제 성공 페이지 개선
```javascript
// TossPaymentSuccess.jsx
const handlePaymentSuccess = (paymentData) => {
  if (paymentData.paymentMethod?.card) {
    const cardInfo = paymentData.paymentMethod.card;
    setPaymentDetails({
      cardCompany: cardInfo.company,
      cardNumber: cardInfo.number,
      approveNo: cardInfo.approveNo,
      installment: cardInfo.installmentPlanMonths > 0 
        ? `${cardInfo.installmentPlanMonths}개월 할부` 
        : '일시불'
    });
  }
};
```

### 2. 주문 내역 페이지 개선
```javascript
// OrderCard.jsx
const renderPaymentInfo = (order) => {
  if (order.paymentInfo) {
    return (
      <div className="payment-info">
        <span>{order.paymentInfo.cardCompany}</span>
        <span>{order.paymentInfo.cardNumber}</span>
        <span>{order.paymentInfo.approveNo}</span>
      </div>
    );
  }
};
```

## 🚀 배포 계획

### Phase 1: 기본 데이터 추가 (1-2일)
- [ ] 토스페이먼츠 응답 데이터 포함
- [ ] 기본 결제 정보 구조화
- [ ] 에러 응답 개선

### Phase 2: 상세 정보 추가 (2-3일)
- [ ] 카드 정보 마스킹 처리
- [ ] 주문 정보 연동
- [ ] 사용자 정보 포함

### Phase 3: 테스트 및 검증 (1-2일)
- [ ] 전체 플로우 테스트
- [ ] 에러 케이스 테스트
- [ ] 프론트엔드 연동 확인

## 📞 연락처

백엔드 팀과의 협업이 필요한 경우:
- 이슈 트래커: [프로젝트 이슈 페이지]
- 문서 업데이트: 이 가이드 문서를 참고하여 구현 진행
- 테스트 결과: TestOrder 페이지에서 확인 가능

---

**마지막 업데이트**: 2024-12-01
**버전**: 1.0.0 
