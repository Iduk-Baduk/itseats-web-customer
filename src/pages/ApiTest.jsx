import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { API_ENDPOINTS } from '../config/api';

function ApiTest() {
  const [testResult, setTestResult] = useState(null);
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [storeMenus, setStoreMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API 테스트
  const testApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/members/test');
      setTestResult(response);
      console.log('✅ API 테스트 성공:', response);
    } catch (error) {
      console.error('❌ API 테스트 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 사용자 정보 조회
  const getCurrentUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH_ME);
      console.log('✅ 사용자 정보:', response);
      setTestResult(response);
    } catch (error) {
      console.error('❌ 사용자 정보 조회 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 가게 목록 조회
  const fetchStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(API_ENDPOINTS.STORES, {
        params: { page: 0, size: 10 }
      });
      const storesData = response.data || response.content || [];
      setStores(storesData);
      console.log('✅ 가게 목록:', storesData);
    } catch (error) {
      console.error('❌ 가게 목록 조회 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 가게 상세 정보 조회
  const getStoreDetail = async (storeId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(API_ENDPOINTS.STORE_BY_ID(storeId));
      setCurrentStore(response);
      console.log('✅ 가게 상세 정보:', response);
    } catch (error) {
      console.error('❌ 가게 상세 정보 조회 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 가게 메뉴 조회
  const getStoreMenus = async (storeId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(API_ENDPOINTS.STORE_MENUS(storeId));
      setStoreMenus(response.data || response.menuGroups || []);
      console.log('✅ 가게 메뉴:', response);
    } catch (error) {
      console.error('❌ 가게 메뉴 조회 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testApi();
    fetchStores();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔗 API 연동 테스트</h1>
      
      {loading && <p>⏳ 로딩 중...</p>}
      {error && <p style={{ color: 'red' }}>❌ 에러: {error}</p>}
      
      <div style={{ marginBottom: '20px' }}>
        <h2>🧪 API 테스트</h2>
        <button onClick={testApi} style={{ marginRight: '10px' }}>API 연결 테스트</button>
        <button onClick={getCurrentUser} style={{ marginRight: '10px' }}>사용자 정보 조회</button>
        <button onClick={fetchStores}>가게 목록 새로고침</button>
      </div>
      
      {testResult && (
        <div style={{ marginBottom: '20px' }}>
          <h2>📊 API 테스트 결과</h2>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '5px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <h2>🏪 가게 목록</h2>
        {stores.length > 0 ? (
          <div style={{ display: 'grid', gap: '10px' }}>
            {stores.map((store, index) => (
              <div key={index} style={{ 
                border: '1px solid #ddd', 
                padding: '10px', 
                borderRadius: '5px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>{store.name || store.storeName}</strong>
                  <br />
                  <small>{store.address}</small>
                </div>
                <div>
                  <button 
                    onClick={() => getStoreDetail(store.storeId || store.id)}
                    style={{ marginRight: '5px' }}
                  >
                    상세정보
                  </button>
                  <button 
                    onClick={() => getStoreMenus(store.storeId || store.id)}
                  >
                    메뉴보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>가게 정보가 없습니다.</p>
        )}
      </div>

      {currentStore && (
        <div style={{ marginBottom: '20px' }}>
          <h2>📋 가게 상세 정보</h2>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '5px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {JSON.stringify(currentStore, null, 2)}
          </pre>
        </div>
      )}

      {storeMenus.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h2>🍽️ 가게 메뉴</h2>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '5px',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(storeMenus, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default ApiTest; 
