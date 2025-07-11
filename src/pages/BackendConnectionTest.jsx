import React, { useState } from 'react';
import { logger } from '../utils/logger';
import apiClient from '../services/apiClient';
import { API_CONFIG } from '../config/api';
import styles from './BackendConnectionTest.module.css';

export default function BackendConnectionTest() {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (testName, success, message, details = null) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      testName,
      success,
      message,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const runConnectionTest = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      // 1. 기본 연결 테스트
      addTestResult('백엔드 서버 연결', 'pending', '연결 테스트 중...');
      
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          addTestResult('백엔드 서버 연결', 'success', '백엔드 서버에 성공적으로 연결되었습니다.');
        } else {
          addTestResult('백엔드 서버 연결', 'error', `서버 응답: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        addTestResult('백엔드 서버 연결', 'error', `연결 실패: ${error.message}`, {
          error: error.message,
          url: `${API_CONFIG.BASE_URL}/health`
        });
      }

      // 2. API 클라이언트 테스트
      addTestResult('API 클라이언트', 'pending', 'API 클라이언트 테스트 중...');
      
      try {
        const response = await apiClient.get('/health');
        addTestResult('API 클라이언트', 'success', 'API 클라이언트가 정상 작동합니다.', response);
      } catch (error) {
        addTestResult('API 클라이언트', 'error', `API 클라이언트 오류: ${error.message}`, {
          error: error.message,
          statusCode: error.statusCode,
          type: error.type
        });
      }

      // 3. 결제 API 엔드포인트 테스트
      addTestResult('결제 API 엔드포인트', 'pending', '결제 API 테스트 중...');
      
      try {
        const testPaymentData = {
          orderId: `test_${Date.now()}`,
          totalCost: 1000,
          paymentMethod: 'CARD'
        };
        
        const response = await apiClient.post('/payments', testPaymentData);
        addTestResult('결제 API 엔드포인트', 'success', '결제 API가 정상 작동합니다.', response);
      } catch (error) {
        addTestResult('결제 API 엔드포인트', 'error', `결제 API 오류: ${error.message}`, {
          error: error.message,
          statusCode: error.statusCode,
          type: error.type
        });
      }

    } catch (error) {
      addTestResult('전체 테스트', 'error', `테스트 실행 중 오류: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className={styles.container}>
      <h1>🔧 백엔드 연결 테스트</h1>
      
      <div className={styles.configInfo}>
        <h3>📋 현재 설정</h3>
        <p><strong>Base URL:</strong> {API_CONFIG.BASE_URL}</p>
        <p><strong>Timeout:</strong> {API_CONFIG.TIMEOUT}ms</p>
        <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
      </div>

      <div className={styles.actions}>
        <button 
          onClick={runConnectionTest} 
          disabled={isLoading}
          className={styles.testButton}
        >
          {isLoading ? '테스트 중...' : '연결 테스트 실행'}
        </button>
        
        <button 
          onClick={clearResults} 
          className={styles.clearButton}
        >
          결과 지우기
        </button>
      </div>

      <div className={styles.results}>
        <h3>📊 테스트 결과</h3>
        
        {testResults.length === 0 && !isLoading && (
          <p className={styles.noResults}>테스트를 실행해주세요.</p>
        )}
        
        {testResults.map(result => (
          <div key={result.id} className={`${styles.resultItem} ${styles[result.success]}`}>
            <div className={styles.resultHeader}>
              <span className={styles.testName}>{result.testName}</span>
              <span className={styles.status}>
                {result.success === 'success' && '✅'}
                {result.success === 'error' && '❌'}
                {result.success === 'pending' && '⏳'}
              </span>
            </div>
            
            <p className={styles.message}>{result.message}</p>
            
            {result.details && (
              <details className={styles.details}>
                <summary>상세 정보</summary>
                <pre>{JSON.stringify(result.details, null, 2)}</pre>
              </details>
            )}
            
            <small className={styles.timestamp}>
              {new Date(result.timestamp).toLocaleTimeString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
} 
