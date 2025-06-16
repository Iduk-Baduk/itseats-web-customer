import { useState } from "react";
import useLogin from "../hooks/useLogin"; 

export default function Login() {
  const { login, loading, error } = useLogin();
  const [username, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    
    const result = await login({username, password});
    if (result) {
      // localStorage.setItem("accessToken", result.accessToken); // 토큰이 있을 경우
      alert("로그인 성공");
    }
  }

  return (
    <div>
      <img src="/logo.svg" alt="logo" className="logo" />

      <div
          style = {{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
      }}
      >
      <input 
          type="text" 
          placeholder="email@example.com"
          value={username}
          onChange={(e) => setUserId(e.target.value)} 
      />
      <input 
          type="password" 
          placeholder="비밀번호" 
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
      />

      <div>
      <label>
          <input type="checkbox" /> 자동로그인
      </label>
      <div>
          <a href="#">아이디 찾기</a> | <a href="#">비밀번호 찾기</a>
      </div>
      </div>

      <button onClick={handleLogin} disabled={loading}>
        {loading ? "로그인 중..." : "로그인"}
      </button>
      <button>회원가입</button>

      </div>
    </div>
  );
}
