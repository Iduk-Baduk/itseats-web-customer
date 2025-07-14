import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useLogin from "../hooks/useLogin";
import TextInput from "../components/common/basic/TextInput";
import Button from "../components/common/basic/Button";
import LineButton from "../components/common/basic/LineButton";
import styles from "./Login.module.css";
import CheckBox from "../components/common/basic/CheckBox";
import AuthService from "../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error } = useLogin();
  const [username, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isAutoLogin, setAutoLogin] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      const redirectPath = new URLSearchParams(location.search).get('redirect') || '/';
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, location.search]);

  // 회원가입에서 전달받은 정보 처리
  useEffect(() => {
    if (location.state?.registeredUsername) {
      setUserId(location.state.registeredUsername);
    }
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // 3초 후 메시지 자동 숨김
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    }
  }, [location.state]);

  const handleLogin = async () => {
    try {
      // 입력값 검증
      if (!username || !password) {
        alert('아이디와 비밀번호를 입력해주세요.');
        return;
      }

      // 비밀번호 유효성 검증
      if (!AuthService.validatePassword(password)) {
        alert('비밀번호는 최소 8자리, 영문, 숫자, 특수문자를 포함해야 합니다.');
        return;
      }

      // 새로운 AuthService.login 사용
      const result = await AuthService.login({ 
        email: username, 
        password: password 
      });
      
      if (result.success) {
        // 리다이렉트 경로가 있으면 해당 경로로, 없으면 홈으로
        const redirectPath = new URLSearchParams(location.search).get('redirect') || '/';
        navigate(redirectPath, { replace: true });
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      alert(error.message || '로그인에 실패했습니다.');
    }
  };

  const handleRegister = () => {
    navigate("/register");
  };

  return (
    <div className={styles.container}>
      <img className={styles.logo} src="/logos/logo.png" alt="잇츠잇츠 로고" />

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <TextInput
          type="text"
          placeholder="아이디(이메일)"
          value={username}
          onChange={(e) => setUserId(e.target.value)}
        />
        <TextInput
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* 성공 메시지 표시 */}
        {successMessage && (
          <div className={styles.successMessage}>
            {successMessage}
          </div>
        )}

        {/* 에러 메시지 표시 */}
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <div className={styles.options}>
          <label>
            <CheckBox
              label="자동로그인"
              checked={isAutoLogin}
              onChange={(e) => setAutoLogin(e.target.checked)}
            />
          </label>
          <span className={styles.find}>
            <a href="#">아이디 찾기</a>
            <span></span>
            <a href="#">비밀번호 찾기</a>
          </span>
        </div>

        <Button onClick={handleLogin} disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </Button>
        
        <hr />
        <LineButton className={styles.grayButton} onClick={handleRegister}>회원가입</LineButton>
      </div>
    </div>
  );
}
