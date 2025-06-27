import { useState } from "react";
import { regist } from "../services/authAPI";

export default function useRegistForm() {
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
      await regist(form);
      alert("회원가입이 완료되었습니다!");
      setError("");
    } catch (err) {
      setError("회원가입 실패. 다시 시도해주세요.");
    }
  };

  return { form, error, handleChange, handleSubmit };
}
