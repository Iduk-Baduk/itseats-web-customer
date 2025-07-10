/**
 * 보안 관련 유틸리티 함수들
 * 세션 ID, 토큰, 암호화 등 보안 기능 제공
 */

import sensitiveKeysConfig from '../config/sensitiveKeys.json';

export class SecurityUtils {
  constructor() {
    // 엔트로피 풀 시스템 제거됨
    // 이유: crypto.getRandomValues() 직접 호출이 더 안정적이고 효율적
    // 복잡도 대비 보안 이득이 미미하여 단순화
  }

  /**
   * 암호학적으로 안전한 랜덤 문자열 생성
   * @param {number} length - 생성할 문자열 길이
   * @param {string} charset - 사용할 문자셋
   * @returns {string} 안전한 랜덤 문자열
   * @throws {Error} 암호학적 난수 미지원 환경
   */
  generateSecureRandomString(length = 32, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    // Web Crypto API 지원 확인
    if (!crypto?.getRandomValues) {
      console.error('보안 경고: 암호학적 난수 미지원 환경입니다. 기능이 제한됩니다.');
      console.error('브라우저: ' + navigator.userAgent);
      console.error('지원 여부: crypto=' + !!crypto + ', getRandomValues=' + !!(crypto?.getRandomValues));
      
      // 개발 환경에서는 에러 발생, 프로덕션에서는 기능 제한
      if (process.env.NODE_ENV === 'development') {
        throw new Error('암호학적 난수 미지원 환경입니다. 보안상 안전하지 않은 난수 생성을 사용할 수 없습니다.');
      } else {
        // 프로덕션에서는 기능 제한 (빈 문자열 반환)
        console.warn('프로덕션 환경에서 암호학적 난수 미지원으로 인한 기능 제한');
        return '';
      }
    }

    try {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      
      let result = '';
      for (let i = 0; i < length; i++) {
        result += charset[array[i] % charset.length];
      }
      return result;
    } catch (error) {
      console.error('암호학적 난수 생성 실패:', error);
      
      if (process.env.NODE_ENV === 'development') {
        throw new Error(`암호학적 난수 생성 실패: ${error.message}`);
      } else {
        console.warn('프로덕션 환경에서 암호학적 난수 생성 실패로 인한 기능 제한');
        return '';
      }
    }
  }

  /**
   * 클라이언트 보조 식별자 생성 (서버 세션 ID와는 별개)
   * 주의: 이는 서버에서 발급하는 실제 세션 ID를 대체할 수 없습니다.
   * 용도: 클라이언트 측 로깅, 디버깅, 임시 식별용
   * @param {string} prefix - 식별자 접두사
   * @returns {string} 클라이언트 보조 식별자
   */
  generateClientSubId(prefix = 'client') {
    // SSR 환경 고려
    if (typeof navigator === 'undefined') {
      console.warn('브라우저 환경이 아닙니다. 기본 식별자를 반환합니다.');
      return `${prefix}_ssr_${Date.now()}`;
    }
    
    const timestamp = Date.now();
    const randomPart = this.generateSecureRandomString(16);
    const userAgentHash = this.hashString(navigator.userAgent);
    
    return `${prefix}_${timestamp}_${randomPart}_${userAgentHash}`;
  }

  /**
   * 보안 세션 ID 생성 (generateClientSubId의 별칭)
   * @param {string} prefix - 식별자 접두사
   * @returns {string} 보안 세션 ID
   */
  generateSecureSessionId(prefix = 'session') {
    return this.generateClientSubId(prefix);
  }

  /**
   * 간단한 문자열 해시 함수 (djb2 알고리즘)
   * @param {string} str - 해시할 문자열
   * @returns {string} 16진수 해시값
   */
  hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & 0xffffffff; // 32비트 정수로 변환
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * 엔트로피 풀 시스템 제거됨
   * 이유: crypto.getRandomValues() 직접 호출이 더 안정적이고 효율적
   * 복잡도 대비 보안 이득이 미미하여 단순화
   */

  /**
   * 제한된 브라우저 지문 생성 (GDPR 고려)
   * 주의: 개인정보보호 규제에 따라 사용자 동의 필요할 수 있습니다.
   * 용도: 서버 로그와 보조 조합으로만 사용
   * 
   * 수집 필드:
   * - minimal=true (기본값, GDPR 친화적):
   *   * navigator.userAgent: 브라우저 식별
   *   * navigator.language: 언어 설정
   *   * screen.width + 'x' + screen.height: 화면 해상도
   * 
   * - minimal=false (사용자 동의 필요):
   *   * 위 필드 + 추가 필드:
   *   * screen.colorDepth: 색상 깊이
   *   * timezoneOffset: 시간대
   *   * hardwareConcurrency: CPU 코어 수
   *   * deviceMemory: 메모리 용량
   *   * platform: 운영체제
   *   * cookieEnabled: 쿠키 지원 여부
   *   * doNotTrack: 추적 거부 설정
   * 
   * @param {boolean} minimal - 최소한의 정보만 수집 (기본값: true)
   * @returns {string} 제한된 브라우저 지문 해시
   */
  generateBrowserFingerprint(minimal = true) {
    // SSR 환경 고려
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || typeof screen === 'undefined') {
      console.warn('브라우저 환경이 아닙니다. 기본 지문을 반환합니다.');
      return this.hashString('ssr-default-fingerprint');
    }
    
    if (minimal) {
      // 최소한의 정보만 수집 (GDPR 친화적)
      const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height
      ];
      return this.hashString(components.join('|'));
    } else {
      // 확장 정보 수집 (사용자 동의 필요)
      console.warn('브라우저 지문 수집: 개인정보보호 규제 준수 필요');
      console.warn('사용자 동의 없이 확장 지문 수집을 금지합니다.');
      
      // 사용자 동의 확인 (실제 구현에서는 동의 상태 확인 필요)
      const hasUserConsent = this.checkUserConsentForFingerprinting();
      if (!hasUserConsent) {
        console.error('사용자 동의 없이 확장 지문 수집 시도');
        return this.generateBrowserFingerprint(true); // 최소 정보로 폴백
      }
      
      const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.deviceMemory || 'unknown',
        navigator.platform,
        navigator.cookieEnabled,
        navigator.doNotTrack || 'unknown'
      ];
      return this.hashString(components.join('|'));
    }
  }

  /**
   * 사용자 동의 확인 (브라우저 지문 수집용)
   * 실제 구현에서는 개인정보처리방침 동의 상태를 확인해야 합니다.
   * @returns {boolean} 사용자 동의 여부
   */
  checkUserConsentForFingerprinting() {
    // 실제 구현에서는 동의 상태를 확인하는 로직 필요
    // 예: localStorage.getItem('privacy_consent_fingerprinting')
    // 또는 서버에서 동의 상태 확인
    return false; // 기본적으로 동의 없음
  }

  /**
   * 클라이언트 토큰 생성·검증 로직 제거됨
   * 
   * 보안 강화를 위해 클라이언트에서 토큰 생성·검증 로직을 완전히 제거했습니다.
   * 
   * 이유:
   * - 클라이언트 토큰은 공격 표면을 늘림
   * - 실제 인증/인가는 서버에서만 처리해야 함
   * - "토큰은 오직 백엔드" 원칙 적용
   * 
   * 대안:
   * - UI 상태 관리: Redux, Context API 등 사용
   * - 임시 데이터: sessionStorage/localStorage 직접 사용
   * - 인증 토큰: 서버에서 발급받은 JWT만 사용
   * 
   * @deprecated 이 메서드는 보안상 제거되었습니다.
   * @since v2.1.0
   */
  generateClientToken() {
    // 빌드 시점 경고 (ESLint 규칙 추가 권장)
    console.error('🚨 SECURITY DEPRECATION WARNING 🚨');
    console.error('클라이언트 토큰 생성이 보안상 제거되었습니다. (v2.1.0)');
    console.error('대신 서버에서 발급받은 JWT를 사용하거나, UI 상태 관리 라이브러리를 사용하세요.');
    console.error('Stack trace:', new Error().stack);
    
    throw new Error('클라이언트 토큰 생성이 보안상 제거되었습니다. 서버에서 JWT를 발급받으세요.');
  }

  /**
   * @deprecated 이 메서드는 보안상 제거되었습니다.
   * @since v2.1.0
   */
  verifyClientToken() {
    // 빌드 시점 경고 (ESLint 규칙 추가 권장)
    console.error('🚨 SECURITY DEPRECATION WARNING 🚨');
    console.error('클라이언트 토큰 검증이 보안상 제거되었습니다. (v2.1.0)');
    console.error('대신 서버에서 토큰을 검증하거나, UI 상태 관리 라이브러리를 사용하세요.');
    console.error('Stack trace:', new Error().stack);
    
    throw new Error('클라이언트 토큰 검증이 보안상 제거되었습니다. 서버에서 토큰을 검증하세요.');
  }

  /**
   * 안전한 세션 스토리지 키 생성
   * @param {string} baseKey - 기본 키
   * @returns {string} 안전한 스토리지 키
   */
  generateStorageKey(baseKey) {
    const fingerprint = this.generateBrowserFingerprint();
    return `${baseKey}_${fingerprint}`;
  }

  /**
   * 민감한 키워드인지 확인
   * @param {string} key - 확인할 키
   * @returns {boolean} 민감한 키워드 여부
   */
  isSensitiveKey(key) {
    const sensitiveKeys = sensitiveKeysConfig.sensitiveKeys || [];
    return sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey)
    );
  }

  /**
   * 민감한 키워드 목록 조회
   * @returns {string[]} 민감한 키워드 목록
   */
  getSensitiveKeys() {
    return sensitiveKeysConfig.sensitiveKeys || [];
  }

  /**
   * 민감한 키워드 목록 업데이트 (런타임)
   * 주의: 이 함수는 개발/테스트 목적으로만 사용하세요.
   * @param {string[]} newKeys - 새로운 민감한 키워드 목록
   */
  updateSensitiveKeys(newKeys) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('민감한 키워드 목록이 런타임에 업데이트되었습니다:', newKeys);
      sensitiveKeysConfig.sensitiveKeys = newKeys;
    } else {
      console.error('프로덕션 환경에서는 민감한 키워드 목록을 런타임에 변경할 수 없습니다.');
    }
  }

  /**
   * 세션 데이터 안전하게 저장 (제한적 용도)
   * 주의: 민감한 정보(토큰, 사용자 정보)는 절대 스토리지에 저장하지 마세요.
   * XSS 취약점만으로도 저장된 데이터가 탈취될 수 있습니다.
   * 용도: UI 상태, 임시 데이터, 비민감 정보만
   * @param {string} key - 저장 키
   * @param {any} data - 저장할 데이터
   * @param {boolean} useSessionStorage - sessionStorage 사용 여부
   */
  secureStore(key, data, useSessionStorage = true) {
    // SSR 환경 고려
    if (typeof window === 'undefined') {
      console.warn('브라우저 환경이 아닙니다. 데이터 저장을 건너뜁니다.');
      return;
    }
    
    // SecureContext 확인 (HTTPS 필수)
    if (!window.isSecureContext) {
      console.warn('보안 경고: HTTPS가 아닌 환경에서 민감한 데이터 저장 시도');
    }
    
    // 민감 정보 저장 방지 (설정 파일에서 로드)
    const isSensitive = this.isSensitiveKey(key);
    
    if (isSensitive) {
      console.error('민감 정보 스토리지 저장 금지:', key);
      throw new Error('민감 정보는 스토리지에 저장할 수 없습니다. HttpOnly 쿠키 사용을 권장합니다.');
    }
    
    const secureKey = this.generateStorageKey(key);
    const storage = useSessionStorage ? sessionStorage : localStorage;
    
    try {
      const encryptedData = {
        data: data,
        timestamp: Date.now(),
        fingerprint: this.generateBrowserFingerprint()
      };
      
      storage.setItem(secureKey, JSON.stringify(encryptedData));
    } catch (error) {
      console.error('데이터 저장 실패:', error);
    }
  }

  /**
   * 세션 데이터 안전하게 불러오기 (제한적 용도)
   * 주의: 민감한 정보는 HttpOnly 쿠키로 서버에서 관리해야 합니다.
   * @param {string} key - 불러올 키
   * @param {boolean} useSessionStorage - sessionStorage 사용 여부
   * @returns {any|null} 저장된 데이터 또는 null
   */
  secureRetrieve(key, useSessionStorage = true) {
    // SSR 환경 고려
    if (typeof window === 'undefined') {
      console.warn('브라우저 환경이 아닙니다. null을 반환합니다.');
      return null;
    }
    
    const secureKey = this.generateStorageKey(key);
    const storage = useSessionStorage ? sessionStorage : localStorage;
    
    try {
      const stored = storage.getItem(secureKey);
      if (!stored) return null;
      
      const encryptedData = JSON.parse(stored);
      const currentFingerprint = this.generateBrowserFingerprint();
      
      // 지문이 다르면 다른 브라우저/세션으로 간주
      if (encryptedData.fingerprint !== currentFingerprint) {
        storage.removeItem(secureKey);
        return null;
      }
      
      return encryptedData.data;
    } catch (error) {
      console.error('데이터 불러오기 실패:', error);
      return null;
    }
  }
}

// 싱글톤 인스턴스
export const securityUtils = new SecurityUtils();
export default securityUtils; 
