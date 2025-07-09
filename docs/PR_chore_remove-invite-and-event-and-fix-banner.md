# 마이페이지 친구초대/이벤트 제거 및 홈 배너/카운터/스타일 오류 수정

## 주요 변경사항

### 1. 마이페이지 기능 정리
- **친구초대** 메뉴 및 관련 아이콘 완전 제거
- **진행중인 이벤트** 메뉴 및 관련 아이콘 완전 제거
- 마이페이지에서 불필요한 메뉴가 더 이상 노출되지 않음

### 2. 이벤트 관련 페이지/리소스 제거
- `/events`, `/events/:eventId` 라우트 및 컴포넌트 완전 삭제
- `src/pages/events/Events.jsx`, `EventsDetails.jsx`, `Events.module.css` 삭제
- 이벤트 관련 배너 이미지(`public/icons/banners/event1.jpg`, `event2.jpg`) 삭제
- 관련 아이콘(`percent.svg`, `people.svg`) 삭제

### 3. 홈 배너(VideoBanner) 개선
- **동영상 배너 컴포넌트** 재구현 및 default export 오류 수정
- 배너 높이 조절 기능 추가 (`height`, `minHeight`, `maxHeight`, `aspectRatio` 지원)
- 홈 배너 높이 180px로 조정 (더 컴팩트하게)
- 이벤트 페이지로 이동하는 배너 클릭 기능 제거

### 4. 카운터(Counter) 모듈 오류 수정
- `increment`, `decrement` → `increase`, `decrease`로 import/export 이름 일치화
- Counter 정상 동작

### 5. CSS import 오류 수정
- `@import` 구문을 `index.css` 최상단으로 이동하여 Vite/PostCSS 에러 해결

### 6. 기타
- 불필요한 설정, 리소스, 코드 일괄 정리
- 동영상 배너 가이드 문서(`docs/VIDEO_BANNER_GUIDE.md`) 추가

---

## 테스트 방법

1. **마이페이지**  
   - 친구초대, 진행중인 이벤트 메뉴가 보이지 않아야 함
2. **이벤트 관련 라우트**  
   - `/events` 및 `/events/:eventId` 접근 시 404 페이지 노출
3. **홈 배너**  
   - 동영상 배너가 180px 높이로 정상 표시
   - 클릭 시 아무 동작 없음
4. **카운터**  
   - +, - 버튼 정상 동작
5. **스타일**  
   - CSS import 관련 에러 없음

---

## 기타 참고

- [VideoBanner 가이드 문서](VIDEO_BANNER_GUIDE.md) 참고
- 불필요한 리소스/코드가 모두 정리되어 코드베이스가 더 깔끔해졌습니다.

---

리뷰 및 머지 부탁드립니다! 🙏 
