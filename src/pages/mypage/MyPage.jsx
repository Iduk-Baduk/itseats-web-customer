import { useNavigate } from "react-router-dom";
import useCurrentUser from "../../hooks/useCurrentUser";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import styles from "./MyPage.module.css";

export default function MyPage() {
  const navigate = useNavigate();
  const { user, userStats, loading, error, isLoggedIn, refreshUserData } = useCurrentUser();

  // 로그인되지 않은 경우 로그인 페이지로 이동
  if (!isLoggedIn && !loading) {
    navigate("/login");
    return null;
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner message="사용자 정보를 불러오는 중..." />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={styles.container}>
        <ErrorState 
          message={error} 
          onPrimaryAction={refreshUserData}
          primaryActionText="다시 시도"
        />
      </div>
    );
  }

  // 사용자 정보가 없는 경우
  if (!user) {
    return (
      <div className={styles.container}>
        <ErrorState 
          message="사용자 정보를 찾을 수 없습니다." 
          onPrimaryAction={() => navigate("/login")}
          primaryActionText="로그인"
        />
      </div>
    );
  }

  // 전화번호 마스킹
  const maskedPhone = user.phone ? user.phone.replace(
    /(\d{3})-(\d{2})\d{2}-(\d{4})/,
    "$1-****-$3"
  ) : "전화번호 없음";

  const menuItems = [
    { icon: "list", label: "주소 관리", path: "/address" },
    { icon: "heart", label: "즐겨찾기", path: "/favorites" },
    { icon: "tag", label: "할인쿠폰", path: "/coupons" },
    { icon: "coupon", label: "내 쿠폰", path: "/mypage/my-coupons" },
    // { icon: "credit", label: "결제관리", path: "/payments" }, // 결제관리 비활성화
    { icon: "settings", label: "설정", path: "/mypage/settings" },
    { icon: "megaphone", label: "공지사항" },
    { icon: "paper", label: "약관 및 정책" },
    { icon: "sheild", label: "개인정보 처리방침" },
    { icon: "sheild", label: "잇츠페이 개인정보 처리방침" },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.name}>{user.name || "이름 없음"}</h2>
      <p className={styles.phone}>{maskedPhone}</p>

      <div className={styles.stats}>
        <div>
          <strong>{userStats.reviewCount}</strong>
          <p>내가 남긴 리뷰</p>
        </div>
        <div>
          <strong>{userStats.helpCount}</strong>
          <p>도움이 됐어요</p>
        </div>
        <div>
          <strong>{userStats.favoriteCount}</strong>
          <p>즐겨찾기</p>
        </div>
      </div>

      <button
        className={styles.detailButton}
        onClick={() => navigate("/mypage/details", { 
          state: { 
            user: {
              name: user.name,
              reviewCount: userStats.reviewCount,
              helpCount: userStats.helpCount,
              favoriteCount: userStats.favoriteCount,
            }
          } 
        })}
      >
        자세히 보기
      </button>

      <div className={styles.menu}>
        {menuItems.map(({ icon, label, path }) => (
          <div
            key={label}
            className={styles.menuItem}
            onClick={() => path && navigate(path)}
          >
            <img
              src={`/icons/mypage/${icon}.svg`}
              alt={label}
              className={styles.icon}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
