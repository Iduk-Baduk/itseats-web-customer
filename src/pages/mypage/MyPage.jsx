import { useNavigate } from "react-router-dom";
import styles from "./MyPage.module.css";

export default function MyPage() {
  const navigate = useNavigate();

  // 더미데이터
  const user = {
    name: "송준경",
    phone: "010-1234-6888",
    reviewCount: 3,
    helpCount: 0,
    favoriteCount: 12,
  };

  const maskedPhone = user.phone.replace(
    /(\d{3})-(\d{2})\d{2}-(\d{4})/,
    "$1-****-$3"
  );

  const menuItems = [
    { icon: "list", label: "주소 관리", path: "/address" },
    { icon: "heart", label: "즐겨찾기", path: "/favorites" },
    { icon: "tag", label: "할인쿠폰", path: "/coupons" },
    { icon: "percent", label: "진행중인 이벤트", path: "/events" },
    { icon: "people", label: "친구 초대" },
    { icon: "credit", label: "결제관리", path: "/payments" },
    { icon: "settings", label: "설정", path: "/mypage/settings" },
    { icon: "megaphone", label: "공지사항" },
    { icon: "paper", label: "약관 및 정책" },
    { icon: "sheild", label: "개인정보 처리방침" },
    { icon: "sheild", label: "쿠팡페이 개인정보 처리방침" },
  ];

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

      <button
        className={styles.detailButton}
        onClick={() => navigate("/mypage/details")}
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
