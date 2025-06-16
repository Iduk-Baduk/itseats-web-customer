import LineButton from "../components/common/LineButton";

export default function Login() {
  return (
    <div>
      <img src="/logo.png" alt="logo" className="logo" />

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <input type="text" placeholder="아이디" />
        <input type="password" placeholder="비밀번호" />

        <div>
          <label>
            <input type="checkbox" /> 자동로그인
          </label>
          <div>
            <a href="#">아이디 찾기</a> | <a href="#">비밀번호 찾기</a>
          </div>
        </div>

        <LineButton>로그인</LineButton>
        <LineButton>회원가입</LineButton>
      </div>
    </div>
  );
}
