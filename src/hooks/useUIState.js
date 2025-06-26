import { useMemo } from 'react';

/**
 * UI 상태를 통합적으로 관리하는 커스텀 훅
 * @param {Object} config - 설정 객체
 * @param {boolean} config.isLoading - 로딩 상태
 * @param {string|Error|null} config.error - 에러 상태
 * @param {Array|null} config.data - 데이터 배열
 * @param {boolean} config.hasData - 데이터 존재 여부 (선택사항)
 * @param {string} config.loadingMessage - 로딩 메시지 (선택사항)
 * @param {string} config.emptyMessage - 빈 상태 메시지 (선택사항)
 * @returns {Object} UI 상태 정보
 */
export const useUIState = ({
  isLoading = false,
  error = null,
  data = null,
  hasData = null,
  loadingMessage = "데이터를 불러오는 중...",
  emptyMessage = "데이터가 없습니다"
}) => {
  const uiState = useMemo(() => {
    // 로딩 상태가 우선순위가 가장 높음
    if (isLoading) {
      return {
        type: 'loading',
        isLoading: true,
        hasError: false,
        isEmpty: false,
        hasData: false,
        message: loadingMessage
      };
    }

    // 에러 상태가 두 번째 우선순위
    if (error) {
      return {
        type: 'error',
        isLoading: false,
        hasError: true,
        isEmpty: false,
        hasData: false,
        error: typeof error === 'string' ? error : error.message || '오류가 발생했습니다'
      };
    }

    // 데이터 유무 판단
    const dataExists = hasData !== null 
      ? hasData 
      : Array.isArray(data) 
        ? data.length > 0 
        : Boolean(data);

    // 빈 상태
    if (!dataExists) {
      return {
        type: 'empty',
        isLoading: false,
        hasError: false,
        isEmpty: true,
        hasData: false,
        message: emptyMessage
      };
    }

    // 성공 상태 (데이터 있음)
    return {
      type: 'success',
      isLoading: false,
      hasError: false,
      isEmpty: false,
      hasData: true
    };
  }, [isLoading, error, data, hasData, loadingMessage, emptyMessage]);

  return uiState;
};

/**
 * 에러 타입에 따른 에러 변형을 반환하는 헬퍼 함수
 * @param {string|Error} error - 에러 객체 또는 메시지
 * @returns {string} 에러 변형 타입
 */
export const getErrorVariant = (error) => {
  if (!error) return 'default';
  
  const errorMessage = typeof error === 'string' ? error : error.message || '';
  const errorType = typeof error === 'object' ? error.type : null;
  
  // 에러 타입이 명시적으로 지정된 경우
  if (errorType) {
    switch (errorType) {
      case 'NETWORK_ERROR':
        return 'network';
      case 'AUTH_ERROR':
        return 'unauthorized';
      case 'SERVER_ERROR':
        return 'server';
      default:
        return 'default';
    }
  }
  
  // 에러 메시지에서 타입 추론
  if (errorMessage.includes('네트워크') || errorMessage.includes('연결')) {
    return 'network';
  }
  if (errorMessage.includes('권한') || errorMessage.includes('로그인')) {
    return 'unauthorized';
  }
  if (errorMessage.includes('서버') || errorMessage.includes('500')) {
    return 'server';
  }
  if (errorMessage.includes('찾을 수 없') || errorMessage.includes('404')) {
    return 'notFound';
  }
  
  return 'default';
};

/**
 * 리스트 페이지를 위한 특화된 UI 상태 훅
 * @param {Object} config - 설정 객체  
 * @param {boolean} config.isLoading - 로딩 상태
 * @param {string|Error|null} config.error - 에러 상태
 * @param {Array} config.items - 아이템 배열
 * @param {string} config.searchKeyword - 검색 키워드 (선택사항)
 * @param {string} config.emptyVariant - 빈 상태 변형 타입 (선택사항)
 * @returns {Object} 리스트용 UI 상태 정보
 */
export const useListUIState = ({
  isLoading = false,
  error = null,
  items = [],
  searchKeyword = '',
  emptyVariant = 'default'
}) => {
  const hasSearchKeyword = Boolean(searchKeyword && searchKeyword.trim());
  
  const uiState = useUIState({
    isLoading,
    error,
    data: items,
    loadingMessage: hasSearchKeyword ? "검색 중..." : "목록을 불러오는 중...",
    emptyMessage: hasSearchKeyword ? "검색 결과가 없습니다" : "목록이 비어있습니다"
  });

  return {
    ...uiState,
    itemCount: items.length,
    hasSearchKeyword,
    searchKeyword,
    emptyVariant: hasSearchKeyword ? 'search' : emptyVariant
  };
};

export default useUIState; 
