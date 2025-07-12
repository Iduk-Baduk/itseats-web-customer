import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { regist } from "../services/authAPI";

// 비밀번호 검증 함수
const validatePassword = (password) => {
  const minLength = 8;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  
  if (password.length < minLength) {
    return { isValid: false, message: `비밀번호는 최소 ${minLength}자리 이상이어야 합니다.` };
  }
  if (!hasLetters) {
    return { isValid: false, message: "비밀번호는 영문자를 포함해야 합니다." };
  }
  if (!hasNumbers) {
    return { isValid: false, message: "비밀번호는 숫자를 포함해야 합니다." };
  }
  if (!hasSpecialChar) {
    return { isValid: false, message: "비밀번호는 특수문자를 포함해야 합니다." };
  }
  
  return { isValid: true, message: "비밀번호가 유효합니다." };
};

export default function useRegistForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    nickname: "",
    email: "",
    phone: "",
    terms: false,
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    if (process.env.NODE_ENV === 'development') {
      console.log("🔄 폼 필드 변경:", { name, type, value, checked, fieldValue });
    }
    
    setForm((prev) => ({ ...prev, [name]: fieldValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 입력값 검증
    if (!form.username || !form.password || !form.name || !form.email || !form.phone) {
      setError("모든 필수 항목을 입력해주세요.");
      return;
    }

    // 비밀번호 확인
    if (form.password !== form.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 비밀번호 유효성 검증
    const passwordValidation = validatePassword(form.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    // 이용약관 동의 확인
    if (!form.terms) {
      setError("이용약관에 동의해주세요.");
      return;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        const safeFormData = { ...form, password: '[REDACTED]', confirmPassword: '[REDACTED]' };
        console.log("🚀 회원가입 데이터 전송:", safeFormData);
      }
      
      const result = await regist(form);
      
      if (process.env.NODE_ENV === 'development') {
        console.log("✅ 회원가입 응답:", result);
        console.log("✅ 응답 타입:", typeof result);
        console.log("✅ 응답 구조:", Object.keys(result || {}));
        console.log("✅ success 값:", result?.success);
      }
      
      // 응답이 없거나 실패한 경우
      if (!result) {
        alert("회원가입이 완료되지 않았습니다. 네트워크 연결을 확인하고 다시 시도해주세요.");
        setError("회원가입이 완료되지 않았습니다. 네트워크 연결을 확인하고 다시 시도해주세요.");
        return;
      }
      
      // 성공 여부 확인 (result.success가 true인지, 또는 user 정보가 있는지)
      if (!result.success && !result.user) {
        alert("회원가입이 완료되지 않았습니다. 다시 시도해주세요.");
        setError("회원가입이 완료되지 않았습니다. 다시 시도해주세요.");
        return;
      }
      
      // 회원가입 성공 시에만 리다이렉트
      alert("회원가입이 완료되었습니다! 로그인 화면으로 이동합니다.");
      setError("");
      
      if (process.env.NODE_ENV === 'development') {
        console.log("🎉 회원가입 성공! 3초 후 로그인 페이지로 이동합니다.");
      }
      
      // 회원가입 성공 후 로그인 화면으로 이동 (가입한 아이디 전달)
      // setTimeout(() => {
      //   navigate("/login", { 
      //     state: { 
      //       registeredUsername: form.username,
      //       message: "회원가입이 완료되었습니다! 로그인해주세요."
      //     } 
      //   });
      // }, 3000); // 3초 지연으로 사용자가 확인할 수 있도록
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
