/**
 * 보안 관련 유틸리티 함수들
 * 세션 ID, 토큰, 암호화 등 보안 기능 제공
 */

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
      throw new Error('암호학적 난수 미지원 환경입니다. 보안상 안전하지 않은 난수 생성을 사용할 수 없습니다.');
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
      throw new Error(`암호학적 난수 생성 실패: ${error.message}`);
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
    const timestamp = Date.now();
    const randomPart = this.generateSecureRandomString(16);
    const userAgentHash = this.hashString(navigator.userAgent);
    
    return `${prefix}_${timestamp}_${randomPart}_${userAgentHash}`;
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
   * @param {boolean} minimal - 최소한의 정보만 수집
   * @returns {string} 제한된 브라우저 지문 해시
   */
  generateBrowserFingerprint(minimal = true) {
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
   * 클라이언트 토큰 생성 (제한적 용도)
   * 주의: 이는 서버에서 발급하는 실제 JWT를 대체할 수 없습니다.
   * 용도: 클라이언트 측 임시 데이터, UI 상태 관리용
   * 실제 인증/인가 토큰은 반드시 서버에서 발급해야 합니다.
   * @param {Object} payload - 토큰에 포함할 데이터
   * @param {number} expiryMinutes - 만료 시간 (분)
   * @returns {string} 클라이언트 토큰
   */
  generateClientToken(payload = {}, expiryMinutes = 60) {
    console.warn('클라이언트 토큰 생성: 실제 인증 토큰이 아닙니다. 서버에서 JWT 발급 필요');
    
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const now = Math.floor(Date.now() / 1000);
    const body = {
      ...payload,
      iat: now,
      exp: now + (expiryMinutes * 60)
    };
    
    const headerB64 = btoa(JSON.stringify(header));
    const bodyB64 = btoa(JSON.stringify(body));
    
    // 간단한 서명 (실제로는 HMAC 사용해야 함)
    const signature = this.hashString(headerB64 + '.' + bodyB64);
    
    return `${headerB64}.${bodyB64}.${signature}`;
  }

  /**
   * 클라이언트 토큰 검증 (제한적 용도)
   * 주의: 이는 서버에서 발급하는 실제 JWT 검증을 대체할 수 없습니다.
   * 용도: 클라이언트 측 임시 데이터 검증용
   * 실제 인증/인가 토큰은 반드시 서버에서 검증해야 합니다.
   * @param {string} token - 검증할 클라이언트 토큰
   * @returns {Object|null} 검증된 페이로드 또는 null
   */
  verifyClientToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const [headerB64, bodyB64, signature] = parts;
      const expectedSignature = this.hashString(headerB64 + '.' + bodyB64);
      
      if (signature !== expectedSignature) return null;
      
      const body = JSON.parse(atob(bodyB64));
      const now = Math.floor(Date.now() / 1000);
      
      if (body.exp && body.exp < now) return null;
      
      return body;
    } catch (error) {
      return null;
    }
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
   * 세션 데이터 안전하게 저장 (제한적 용도)
   * 주의: 민감한 정보(토큰, 사용자 정보)는 절대 스토리지에 저장하지 마세요.
   * XSS 취약점만으로도 저장된 데이터가 탈취될 수 있습니다.
   * 용도: UI 상태, 임시 데이터, 비민감 정보만
   * @param {string} key - 저장 키
   * @param {any} data - 저장할 데이터
   * @param {boolean} useSessionStorage - sessionStorage 사용 여부
   */
  secureStore(key, data, useSessionStorage = true) {
    // 민감 정보 저장 방지
    const sensitiveKeys = ['token', 'auth', 'password', 'secret', 'key', 'credential'];
    const isSensitive = sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey)
    );
    
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
