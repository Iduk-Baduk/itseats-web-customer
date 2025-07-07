import { useState } from "react";
import { login as loginAPI, getCurrentUser } from "../services/authAPI";
import { STORAGE_KEYS } from "../utils/logger";

export default function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async ({ username, password, isAutoLogin }) => {
    if (!username || !password) {
      setError("아이디와 비밀번호를 모두 입력해주세요.");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await loginAPI({ username, password, isAutoLogin });

      if (result.success) {
        // 토큰과 사용자 정보 저장
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(result.user));
        
        return result;
      } else {
        throw new Error(result.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      const errorMessage = error.message || "아이디 또는 비밀번호가 올바르지 않습니다.";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 현재 로그인된 사용자 정보 확인
  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      return user;
    } catch (error) {
      // 인증 실패 시 저장된 정보 삭제
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      return null;
    }
  };

  // 로그인 상태 확인
  const isLoggedIn = () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return !!(token && user);
  };

  return { 
    login, 
    checkAuth, 
    isLoggedIn, 
    loading, 
    error, 
  };
}
