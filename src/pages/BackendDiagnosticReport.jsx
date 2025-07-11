import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import apiClient from '../services/apiClient';
import { API_CONFIG } from '../config/api';
import { generatePaymentId, safeParsePaymentId, isValidPaymentId, generateOrderId, safeParseOrderId, isValidOrderId } from '../utils/paymentUtils';
import styles from './BackendDiagnosticReport.module.css';

export default function BackendDiagnosticReport() {
  const [diagnosticResults, setDiagnosticResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState(null);
  const [paymentIdTestResult, setPaymentIdTestResult] = useState(null);
  const [orderIdTestResult, setOrderIdTestResult] = useState(null);

  const addResult = (testName, success, message, details = null) => {
    setDiagnosticResults(prev => [...prev, {
      id: Date.now() + Math.random(),
      testName,
      success,
      message,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnosticResults([]);
    setSummary(null);

    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      critical: 0
    };

    try {
      // 1. 기본 연결 테스트
      results.total++;
      addResult('기본 서버 연결', 'pending', '연결 테스트 중...');
      
      try {
        const response = await fetch('http://localhost:8080/api/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });
        
        if (response.ok) {
          const data = await response.json();
          addResult('기본 서버 연결', 'success', '서버 연결 성공', data);
          results.passed++;
        } else {
          const errorData = await response.json();
          addResult('기본 서버 연결', 'error', `HTTP ${response.status}`, errorData);
          results.failed++;
          results.critical++;
        }
      } catch (error) {
        addResult('기본 서버 연결', 'error', '연결 실패', {
          message: error.message,
          type: error.name
        });
        results.failed++;
        results.critical++;
      }

      // 2. API 엔드포인트 테스트
      const endpoints = [
        { name: '결제 승인 API', path: '/api/payment/confirm', method: 'POST' },
        { name: '주문 생성 API', path: '/api/orders', method: 'POST' },
        { name: '매장 목록 API', path: '/api/stores', method: 'GET' },
        { name: '사용자 정보 API', path: '/api/users/me', method: 'GET' }
      ];

      for (const endpoint of endpoints) {
        results.total++;
        addResult(endpoint.name, 'pending', '테스트 중...');
        
        try {
          const response = await fetch(`http://localhost:8080${endpoint.path}`, {
            method: endpoint.method,
            headers: { 'Content-Type': 'application/json' },
            body: endpoint.method === 'POST' ? JSON.stringify({ test: true }) : undefined,
            timeout: 5000
          });
          
          if (response.ok) {
            addResult(endpoint.name, 'success', `HTTP ${response.status}`, { status: response.status });
            results.passed++;
          } else {
            const errorData = await response.json().catch(() => ({ message: '응답 파싱 실패' }));
            addResult(endpoint.name, 'error', `HTTP ${response.status}`, errorData);
            results.failed++;
          }
        } catch (error) {
          addResult(endpoint.name, 'error', '요청 실패', {
            message: error.message,
            type: error.name
          });
          results.failed++;
        }
      }

      // 3. 네트워크 설정 확인
      results.total++;
      addResult('프록시 설정', 'pending', '확인 중...');
      
      const proxyConfig = {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      };
      
      addResult('프록시 설정', 'info', 'Vite 프록시 설정 확인', proxyConfig);
      results.passed++;

      // 4. 환경 변수 확인
      results.total++;
      addResult('환경 변수', 'pending', '확인 중...');
      
      const envVars = {
        VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
        VITE_API_URL: import.meta.env.VITE_API_URL,
        VITE_BACKEND_ENABLED: import.meta.env.VITE_BACKEND_ENABLED,
        VITE_MOCK_MODE: import.meta.env.VITE_MOCK_MODE
      };
      
      addResult('환경 변수', 'info', '환경 변수 설정', envVars);
      results.passed++;

      // 5. 브라우저 네트워크 테스트
      results.total++;
      addResult('브라우저 네트워크', 'pending', '테스트 중...');
      
      try {
        const response = await apiClient.get('/health');
        addResult('브라우저 네트워크', 'success', 'API 클라이언트 연결 성공', response.data);
        results.passed++;
      } catch (error) {
        addResult('브라우저 네트워크', 'error', 'API 클라이언트 연결 실패', {
          message: error.message,
          statusCode: error.statusCode,
          type: error.type
        });
        results.failed++;
      }

    } catch (error) {
      addResult('진단 실행', 'error', '진단 중 오류 발생', {
        message: error.message,
        stack: error.stack
      });
      results.failed++;
    }

    // 요약 생성
    const summaryData = {
      ...results,
      successRate: results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0,
      recommendations: []
    };

    if (results.critical > 0) {
      summaryData.recommendations.push('백엔드 서버가 응답하지 않습니다. 서버 상태를 확인해주세요.');
    }
    if (results.failed > results.passed) {
      summaryData.recommendations.push('대부분의 API 호출이 실패하고 있습니다. 백엔드 로그를 확인해주세요.');
    }
    if (summaryData.successRate < 50) {
      summaryData.recommendations.push('Mock 모드를 활성화하여 개발을 계속하세요.');
    }

    setSummary(summaryData);
    setIsRunning(false);
  };

  const copyReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary,
      results: diagnosticResults,
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL
      }
    };

    const reportText = JSON.stringify(report, null, 2);
    navigator.clipboard.writeText(reportText).then(() => {
      alert('진단 리포트가 클립보드에 복사되었습니다.');
    });
  };

  const enableMockMode = () => {
    localStorage.setItem('VITE_MOCK_MODE', 'true');
    localStorage.setItem('VITE_BACKEND_ENABLED', 'false');
    alert('Mock 모드가 활성화되었습니다. 페이지를 새로고침해주세요.');
  };

  const testPaymentIdValidation = () => {
    const testCases = [
      { input: '123456789', expected: true, description: '숫자 문자열' },
      { input: 123456789, expected: true, description: '숫자' },
      { input: 'e29bf600-9a13-4b4a-9f94-64535d065ee3', expected: false, description: 'UUID 형식' },
      { input: 'mock_123456789', expected: false, description: 'Mock 문자열' },
      { input: null, expected: false, description: 'null 값' },
      { input: undefined, expected: false, description: 'undefined 값' },
      { input: '', expected: false, description: '빈 문자열' },
      { input: 'abc123', expected: false, description: '문자+숫자 혼합' }
    ];

    const results = testCases.map(testCase => {
      const isValid = isValidPaymentId(testCase.input);
      const converted = safeParsePaymentId(testCase.input);
      
      return {
        ...testCase,
        actual: isValid,
        converted: converted,
        passed: isValid === testCase.expected
      };
    });

    const summary = {
      total: testCases.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      successRate: Math.round((results.filter(r => r.passed).length / testCases.length) * 100)
    };

    setPaymentIdTestResult({ results, summary });
  };

  const testOrderIdValidation = () => {
    const testCases = [
      { input: '123456789', expected: true, description: '결제 생성용 주문 ID (숫자)' },
      { input: 123456789, expected: true, description: '결제 생성용 주문 ID (숫자)' },
      { input: 'order_1703123456789_1234', expected: false, description: '문자열 형식' },
      { input: 'e29bf600-9a13-4b4a-9f94-64535d065ee3', expected: false, description: 'UUID 형식' },
      { input: null, expected: false, description: 'null 값' },
      { input: undefined, expected: false, description: 'undefined 값' },
      { input: '', expected: false, description: '빈 문자열' },
      { input: 'abc123', expected: false, description: '문자+숫자 혼합' }
    ];

    const results = testCases.map(testCase => {
      const isValid = isValidOrderId(testCase.input);
      const converted = safeParseOrderId(testCase.input);
      
      return {
        ...testCase,
        actual: isValid,
        converted: converted,
        passed: isValid === testCase.expected
      };
    });

    const summary = {
      total: testCases.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      successRate: Math.round((results.filter(r => r.passed).length / testCases.length) * 100)
    };

    setOrderIdTestResult({ results, summary });
  };

  const testTossOrderIdValidation = () => {
    const testCases = [
      { input: 'order_1703123456789_1234', expected: true, description: '토스페이먼츠 주문 ID (문자열)' },
      { input: 'toss_order_abc123', expected: true, description: '토스페이먼츠 주문 ID (문자열)' },
      { input: '123456789', expected: true, description: '숫자 문자열 (호환성)' },
      { input: 123456789, expected: true, description: '숫자 (호환성)' },
      { input: null, expected: false, description: 'null 값' },
      { input: undefined, expected: false, description: 'undefined 값' },
      { input: '', expected: false, description: '빈 문자열' }
    ];

    const results = testCases.map(testCase => {
      // 토스페이먼츠 주문 ID는 문자열 그대로 사용하므로 변환하지 않음
      const isValid = testCase.input !== null && testCase.input !== undefined && testCase.input !== '';
      const converted = testCase.input; // 변환하지 않고 그대로 사용
      
      return {
        ...testCase,
        actual: isValid,
        converted: converted,
        passed: isValid === testCase.expected
      };
    });

    const summary = {
      total: testCases.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      successRate: Math.round((results.filter(r => r.passed).length / testCases.length) * 100)
    };

    setOrderIdTestResult({ results, summary, type: 'toss' });
  };

  return (
    <div className={styles.container}>
      <h1>🔍 백엔드 서버 진단 리포트</h1>
      
      <div className={styles.configInfo}>
        <h3>현재 설정</h3>
        <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_BASE_URL}</p>
        <p><strong>Backend Enabled:</strong> {import.meta.env.VITE_BACKEND_ENABLED}</p>
        <p><strong>Mock Mode:</strong> {import.meta.env.VITE_MOCK_MODE}</p>
        <p><strong>서버 주소:</strong> http://localhost:8080</p>
      </div>

      <div className={styles.actions}>
        <button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className={styles.runButton}
        >
          {isRunning ? '진단 중...' : '진단 실행'}
        </button>
        
        <button 
          onClick={copyReport} 
          disabled={diagnosticResults.length === 0}
          className={styles.copyButton}
        >
          리포트 복사
        </button>
        
        <button 
          onClick={enableMockMode}
          className={styles.mockButton}
        >
          Mock 모드 활성화
        </button>
        
        <button 
          onClick={testPaymentIdValidation}
          className={styles.testButton}
        >
          PaymentId 타입 테스트
        </button>
        
        <button 
          onClick={testOrderIdValidation}
          className={styles.testButton}
        >
          OrderId 타입 테스트
        </button>
        
        <button 
          onClick={testTossOrderIdValidation}
          className={styles.testButton}
        >
          토스페이먼츠 OrderId 테스트
        </button>
      </div>

      {summary && (
        <div className={styles.summary}>
          <h3>진단 요약</h3>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.label}>전체 테스트:</span>
              <span className={styles.value}>{summary.total}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.label}>성공:</span>
              <span className={`${styles.value} ${styles.success}`}>{summary.passed}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.label}>실패:</span>
              <span className={`${styles.value} ${styles.error}`}>{summary.failed}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.label}>성공률:</span>
              <span className={styles.value}>{summary.successRate}%</span>
            </div>
          </div>
          
          {summary.recommendations.length > 0 && (
            <div className={styles.recommendations}>
              <h4>권장사항:</h4>
              <ul>
                {summary.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {paymentIdTestResult && (
        <div className={styles.section}>
          <h3>🔢 PaymentId 타입 검증 결과</h3>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.label}>전체 테스트:</span>
              <span className={styles.value}>{paymentIdTestResult.summary.total}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.label}>성공:</span>
              <span className={`${styles.value} ${styles.success}`}>{paymentIdTestResult.summary.passed}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.label}>실패:</span>
              <span className={`${styles.value} ${styles.error}`}>{paymentIdTestResult.summary.failed}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.label}>성공률:</span>
              <span className={styles.value}>{paymentIdTestResult.summary.successRate}%</span>
            </div>
          </div>
          
          <div className={styles.testResults}>
            <h4>테스트 케이스 상세:</h4>
            {paymentIdTestResult.results.map((result, index) => (
              <div key={index} className={`${styles.testCase} ${result.passed ? styles.success : styles.error}`}>
                <div className={styles.testCaseHeader}>
                  <span className={styles.testDescription}>{result.description}</span>
                  <span className={styles.testStatus}>{result.passed ? '✅' : '❌'}</span>
                </div>
                <div className={styles.testCaseDetails}>
                  <p><strong>입력:</strong> {JSON.stringify(result.input)}</p>
                  <p><strong>예상:</strong> {result.expected ? '유효' : '무효'}</p>
                  <p><strong>실제:</strong> {result.actual ? '유효' : '무효'}</p>
                  <p><strong>변환된 값:</strong> {result.converted}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {orderIdTestResult && (
        <div className={styles.section}>
          <h3>📦 {orderIdTestResult.type === 'toss' ? '토스페이먼츠 OrderId' : 'OrderId'} 타입 검증 결과</h3>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.label}>전체 테스트:</span>
              <span className={styles.value}>{orderIdTestResult.summary.total}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.label}>성공:</span>
              <span className={`${styles.value} ${styles.success}`}>{orderIdTestResult.summary.passed}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.label}>실패:</span>
              <span className={`${styles.value} ${styles.error}`}>{orderIdTestResult.summary.failed}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.label}>성공률:</span>
              <span className={styles.value}>{orderIdTestResult.summary.successRate}%</span>
            </div>
          </div>
          
          <div className={styles.testResults}>
            <h4>테스트 케이스 상세:</h4>
            {orderIdTestResult.results.map((result, index) => (
              <div key={index} className={`${styles.testCase} ${result.passed ? styles.success : styles.error}`}>
                <div className={styles.testCaseHeader}>
                  <span className={styles.testDescription}>{result.description}</span>
                  <span className={styles.testStatus}>{result.passed ? '✅' : '❌'}</span>
                </div>
                <div className={styles.testCaseDetails}>
                  <p><strong>입력:</strong> {JSON.stringify(result.input)}</p>
                  <p><strong>예상:</strong> {result.expected ? '유효' : '무효'}</p>
                  <p><strong>실제:</strong> {result.actual ? '유효' : '무효'}</p>
                  <p><strong>변환된 값:</strong> {result.converted}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.results}>
        <h3>진단 결과</h3>
        {diagnosticResults.map((result) => (
          <div key={result.id} className={`${styles.resultItem} ${styles[result.success]}`}>
            <div className={styles.resultHeader}>
              <span className={styles.testName}>{result.testName}</span>
              <span className={styles.status}>{result.success}</span>
            </div>
            <p className={styles.message}>{result.message}</p>
            {result.details && (
              <details className={styles.details}>
                <summary>상세 정보</summary>
                <pre>{JSON.stringify(result.details, null, 2)}</pre>
              </details>
            )}
            <span className={styles.timestamp}>{new Date(result.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 
