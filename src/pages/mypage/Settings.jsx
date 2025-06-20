import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Settings.module.css";
import Header from "../../components/common/Header";
import useAppVersion from "../../hooks/useAppVersion";

export default function Settings() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { version: currentVer } = useAppVersion();

  const handleLogout = () => {
    localStorage.clear();
    alert("로그아웃 되었습니다");
    navigate("/login");
  };

  return (
    <div className={styles.container}>
      <Header
        title="설정"
        leftButtonAction={() => {
          navigate(-1);
        }}
        rightIcon=""
      />

      <div className={styles.row}>
        <span>주문 현황 알림</span>
        <input type="checkbox" className={styles.toggle} />
      </div>

      <div className={styles.rowColumn}>
        <div className={styles.rowColumnInner}>
          <span>마케팅 목적의 개인정보 수집 및 이용 동의</span>
          <input type="checkbox" className={styles.toggle} />
        </div>
        <a className={styles.subLink}>전문보기</a>
      </div>

      <div className={styles.rowColumn}>
        <div className={styles.rowColumnInner}>
          <span>쿠폰&혜택 정보 알림</span>
          <input type="checkbox" className={styles.toggle} />
        </div>
        <a className={styles.subLink}>전문보기</a>
      </div>

      <div className={styles.row} onClick={() => setShowLogoutConfirm(true)}>
        <span>로그아웃</span>
      </div>
      <div className={styles.footer}>
        <div className={styles.footerRight}>
          <p>App ver. {currentVer}</p>
          <a
            href="https://your-withdraw-url.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.withdraw}
          >
            회원탈퇴
          </a>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <p>로그아웃 하시겠습니까?</p>
            <div className={styles.confirmButtons}>
              <button onClick={() => setShowLogoutConfirm(false)}>취소</button>
              <button onClick={handleLogout}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
