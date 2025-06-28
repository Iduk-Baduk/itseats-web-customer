import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { regist } from "../services/authAPI";

export default function useRegistForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    email: "",
    phone: "",
    usertype: "CUSTOMER", // 기본값을 CUSTOMER로 지정
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        const safeFormData = { ...form, password: '[REDACTED]', confirmPassword: '[REDACTED]' };
        console.log("🚀 회원가입 데이터 전송:", safeFormData);
      }
      const result = await regist(form);
      if (process.env.NODE_ENV === 'development') {
        console.log("✅ 회원가입 성공 응답:", result);
      }
      alert("회원가입이 완료되었습니다! 로그인 화면으로 이동합니다.");
      setError("");
      
      // 회원가입 성공 후 로그인 화면으로 이동 (가입한 아이디 전달)
      setTimeout(() => {
        navigate("/login", { 
          state: { 
            registeredUsername: form.username,
            message: "회원가입이 완료되었습니다! 로그인해주세요."
          } 
        });
      }, 100); // alert 이후 약간의 딜레이를 두고 이동
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("❌ 회원가입 실패:", err);
        console.error("에러 타입:", err.type);
        console.error("상태 코드:", err.statusCode);
        console.error("원본 에러:", err.originalError);
      }
      setError(`회원가입 실패: ${err.message}`);
    }
  };

  return { form, error, handleChange, handleSubmit };
}
