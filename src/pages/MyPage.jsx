import { useNavigate } from "react-router-dom";
import styles from "./MyPage.module.css";

export default function MyPage() {
  const navigate = useNavigate();

  // 더미데이터
  const user = {
    name: "송준경",
    phone: "010-1234-6888",
    reviewCount: 0,
    helpCount: 0,
    favoriteCount: 0,
  };

  // 가운데 번호 마스킹
  const maskedPhone = user.phone.replace(/(\d{3})-(\d{2})\d{2}-(\d{4})/, "$1-****-$3");

  return (
    <div className={styles.container}>
      <h2 className={styles.name}>{user.name}</h2>
      <p className={styles.phone}>{maskedPhone}</p>

      <div className={styles.stats}>
        <div>
          <strong>{user.reviewCount}</strong>
          <p>내가 남긴 리뷰</p>
        </div>
        <div>
          <strong>{user.helpCount}</strong>
          <p>도움이 됐어요</p>
        </div>
        <div>
          <strong>{user.favoriteCount}</strong>
          <p>즐겨찾기</p>
        </div>
      </div>

      <button className={styles.detailButton} onClick={() => navigate("/mypage/details")}>
        자세히 보기
      </button>

      {/* 중단 리스트 */}
      <div className={styles.menu}>
        <div onClick={() => navigate("/address")}>주소 관리</div>
        <div onClick={() => navigate("/favorite")}>즐겨찾기</div>
        <div>할인쿠폰</div>
        <div>진행중인 이벤트</div>
        <div>친구 초대</div>
        <div>이츠 롤렛</div>
        <div>결제관리</div>
        <div>와우 멤버십</div>
        <div>배달파트너 모집</div>
        <div>자주 묻는 질문</div>
        <div>고객 지원</div>
        <div>설정</div>
        <div>공지사항</div>
        <div>약관 및 정책</div>
        <div>개인정보 처리방침</div>
        <div>쿠팡페이 개인정보 처리방침</div>
      </div>
    </div>
  );
}
