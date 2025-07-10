import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { fetchStoreById } from '../store/storeSlice';
import { logger } from '../utils/logger';

// 매장 상세 정보 조회를 위한 커스텀 훅
export const useStoreDetails = (storeId) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const dispatch = useDispatch();
  
  // 요청 취소를 위한 ref
  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    // 컴포넌트 언마운트 시 플래그 설정
    return () => {
      mountedRef.current = false;
      // 진행 중인 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!storeId) {
      setStoreData(null);
      setError(null);
      return;
    }

    // 이전 요청이 진행 중이면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새로운 AbortController 생성
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchStore = async () => {
      if (!mountedRef.current) return;

      setLoading(true);
      setError(null);
      
      try {
        logger.log(`🏪 매장 상세 정보 조회 시작 (ID: ${storeId})`);
        
        const result = await dispatch(fetchStoreById(storeId, { signal: controller.signal })).unwrap();
        
        if (mountedRef.current) {
          setStoreData(result);
          logger.log(`✅ 매장 상세 정보 조회 완료 (ID: ${storeId})`);
        }
      } catch (err) {
        // AbortError는 무시
        if (err.name === 'AbortError') {
          return;
        }
        
        if (mountedRef.current) {
          setError(err.message || '매장 정보를 불러오는데 실패했습니다.');
          logger.error(`❌ 매장 상세 정보 조회 실패 (ID: ${storeId}):`, err);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    // 요청 시작 (한 번만 호출)
    fetchStore();

    // 클린업 함수
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [storeId, dispatch]);

  const refetch = async () => {
    if (!storeId) return;

    // 이전 요청이 진행 중이면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새로운 AbortController 생성
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await dispatch(fetchStoreById(storeId, { signal: controller.signal })).unwrap();
      if (mountedRef.current) {
        setStoreData(result);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      if (mountedRef.current) {
        setError(err.message || '매장 정보를 불러오는데 실패했습니다.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  return {
    loading,
    error,
    storeData,
    refetch
  };
};

export default useStoreDetails; 
