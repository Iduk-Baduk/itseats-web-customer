# ITSeats Web Customer

음식 배달 서비스 고객용 웹 애플리케이션

## 주요 기능

- 🍽️ 음식점 검색 및 메뉴 주문
- 🛒 장바구니 및 결제 시스템
- 💳 토스페이먼츠 연동 결제
- 📱 반응형 디자인
- 🗺️ 실시간 주문 추적
- ⭐ 리뷰 및 평점 시스템

## 기술 스택

- **Frontend**: React 18, Vite
- **Styling**: CSS Modules
- **State Management**: Redux Toolkit
- **Payment**: TossPayments API
- **Maps**: Kakao Maps API

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 토스페이먼츠 API 설정
VITE_TOSS_SECRET_KEY=your_actual_secret_key_here

# API 설정
VITE_API_BASE_URL=http://localhost:3000
VITE_API_TIMEOUT=10000
```

자세한 설정 방법은 [환경 변수 설정 가이드](docs/ENVIRONMENT_SETUP.md)를 참조하세요.

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 빌드

```bash
npm run build
```

## 프로젝트 구조

```
src/
├── components/     # 재사용 가능한 컴포넌트
├── pages/         # 페이지 컴포넌트
├── services/      # API 서비스
├── store/         # Redux 스토어
├── utils/         # 유틸리티 함수
└── styles/        # 공통 스타일
```

## 주요 기능

### 결제 시스템
- 토스페이먼츠 SDK 연동
- 결제 성공/실패 처리
- 주문 상태 추적

### 사용자 경험
- 반응형 디자인
- 로딩 상태 및 에러 처리
- 직관적인 네비게이션

## 라이선스

MIT License
