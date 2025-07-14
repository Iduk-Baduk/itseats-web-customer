# 환경 변수 설정 가이드

## 토스페이먼츠 API 설정

### 1. 환경 변수 파일 생성

프로젝트 루트 디렉토리에 `.env` 파일을 생성하세요:

```bash
# .env 파일 생성
touch .env
```

### 2. 환경 변수 설정

`.env` 파일에 다음 내용을 추가하세요:

```env
# 토스페이먼츠 API 설정
VITE_TOSS_SECRET_KEY=your_actual_secret_key_here

# API 설정
VITE_API_BASE_URL=http://localhost:8080
VITE_API_TIMEOUT=10000

# 개발 환경 설정
VITE_NODE_ENV=development
```

### 3. API 키 설정

#### 개발 환경
- 토스페이먼츠 대시보드에서 테스트용 시크릿 키를 복사
- `VITE_TOSS_SECRET_KEY`에 설정

#### 운영 환경
- **중요**: 반드시 실제 운영용 시크릿 키를 사용
- 테스트 키는 운영 환경에서 사용하지 마세요

### 4. 환경 변수 확인

환경 변수가 제대로 설정되었는지 확인:

```javascript
// 브라우저 콘솔에서 확인
console.log(import.meta.env.VITE_TOSS_SECRET_KEY);
```

### 5. 보안 주의사항

- `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다
- API 키는 절대 소스코드에 하드코딩하지 마세요
- 운영 환경에서는 환경 변수나 안전한 설정 관리 시스템을 사용하세요

### 6. 문제 해결

#### API 키가 설정되지 않은 경우
```
VITE_TOSS_SECRET_KEY가 설정되지 않았습니다. 테스트 키를 사용합니다.
```
- `.env` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인
- 개발 서버를 재시작

#### API 키가 유효하지 않은 경우
```
토스페이먼츠 API 키가 유효하지 않습니다. VITE_TOSS_SECRET_KEY를 확인해주세요.
```
- API 키가 비어있지 않은지 확인
- 토스페이먼츠 대시보드에서 올바른 키를 복사했는지 확인

## 추가 설정

### 개발 서버 재시작
환경 변수를 변경한 후에는 개발 서버를 재시작해야 합니다:

```bash
npm run dev
```

### 환경별 설정
- `.env.development`: 개발 환경 전용 설정
- `.env.production`: 운영 환경 전용 설정
- `.env.local`: 로컬 환경 전용 설정 (Git에 커밋되지 않음) 
