import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useLogin from "../hooks/useLogin";
import TextInput from "../components/common/basic/TextInput";
import Button from "../components/common/basic/Button";
import LineButton from "../components/common/basic/LineButton";
import styles from "./Login.module.css";
import CheckBox from "../components/common/basic/CheckBox";

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error } = useLogin();
  const [username, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isAutoLogin, setAutoLogin] = useState(false);

  const handleLogin = async () => {
    const result = await login({ username, password });
    if (result) {
      alert(`${result.user.name}님, 환영합니다!`);
      navigate("/"); // 홈으로 이동
    }
  };

  const handleRegister = () => {
    navigate("/register");
  };

  return (
    <div className={styles.container}>
      <img src="/logo.svg" alt="logo" className="logo" />

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
          placeholder="email@example.com"
          value={username}
          onChange={(e) => setUserId(e.target.value)}
        />
        <TextInput
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

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
