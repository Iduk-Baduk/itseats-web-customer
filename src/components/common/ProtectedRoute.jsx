import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../../services/authService';
import LoadingSpinner from './LoadingSpinner';

/**
 * 인증이 필요한 페이지를 보호하는 컴포넌트
 * @param {Object} props
 * @param {React.ReactNode} props.children - 보호할 컴포넌트
 * @param {boolean} props.requireAuth - 인증 필요 여부 (기본값: true)
 * @param {React.ReactNode} props.fallback - 인증 실패 시 표시할 컴포넌트
 */
const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  fallback = null 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = AuthService.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (requireAuth && !authenticated) {
          // 인증이 필요한데 로그인되지 않은 경우
          const currentPath = location.pathname + location.search;
          AuthService.redirectToLogin();
          return;
        }

        if (!requireAuth && authenticated) {
          // 로그인 페이지에서 이미 로그인된 경우 홈으로 리다이렉트
          if (location.pathname === '/login') {
            navigate('/', { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error('인증 확인 중 오류:', error);
        if (requireAuth) {
          AuthService.redirectToLogin();
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [requireAuth, location.pathname, location.search, navigate]);

  // 로딩 중일 때 스피너 표시
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 인증이 필요하지 않은 경우 또는 인증된 경우 자식 컴포넌트 렌더링
  if (!requireAuth || isAuthenticated) {
    return children;
  }

  // 인증 실패 시 fallback 컴포넌트 표시
  return fallback;
};

export default ProtectedRoute; 
