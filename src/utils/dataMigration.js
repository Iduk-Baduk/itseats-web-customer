/**
 * 기존 장바구니 데이터를 새로운 API 스펙에 맞게 마이그레이션
 */

// 데이터 버전 관리
const CART_DATA_VERSION = '2.0.0'; // API 스펙 대응 버전
const LEGACY_CART_DATA_VERSION = '1.0.0'; // 기존 버전

/**
 * 기존 menuOption 구조를 새로운 menuOptions 배열 구조로 변환
 * @param {Object} legacyMenuOption - 기존 menuOption 구조
 * @returns {Array} 새로운 menuOptions 배열
 */
export const migrateLegacyMenuOption = (legacyMenuOption) => {
  if (!legacyMenuOption || Array.isArray(legacyMenuOption)) {
    // 이미 새로운 구조이거나 null인 경우
    return legacyMenuOption || [];
  }

  // 기존 구조에서 새로운 구조로 변환
  if (Array.isArray(legacyMenuOption)) {
    // selectedOptions 배열 형태인 경우
    return legacyMenuOption.map((group, index) => ({
      optionGroupName: group.groupName || `옵션 그룹 ${index + 1}`,
      options: group.options || []
    })).filter(group => group.options.length > 0);
  }

  // 단일 객체 형태인 경우
  if (legacyMenuOption.selectedOptions) {
    return legacyMenuOption.selectedOptions.map((group, index) => ({
      optionGroupName: group.groupName || `옵션 그룹 ${index + 1}`,
      options: group.options || []
    })).filter(group => group.options.length > 0);
  }

  // 알 수 없는 구조인 경우 빈 배열 반환
  console.warn('Unknown legacy menuOption structure:', legacyMenuOption);
  return [];
};

/**
 * 기존 장바구니 아이템을 새로운 구조로 마이그레이션
 * @param {Object} legacyItem - 기존 장바구니 아이템
 * @returns {Object} 새로운 구조의 장바구니 아이템
 */
export const migrateLegacyCartItem = (legacyItem) => {
  return {
    menuId: legacyItem.menuId,
    menuName: legacyItem.menuName,
    menuPrice: legacyItem.menuPrice,
    quantity: legacyItem.quantity,
    
    // 새로운 API 스펙에 맞는 구조
    menuOptions: migrateLegacyMenuOption(legacyItem.menuOption),
    
    // 기존 구조도 유지 (하위 호환성)
    menuOption: legacyItem.menuOption,
    
    // 메타데이터
    _migrated: true,
    _migratedAt: new Date().toISOString(),
    _version: CART_DATA_VERSION
  };
};

/**
 * 전체 장바구니 데이터 마이그레이션
 * @param {Object} legacyCartData - 기존 장바구니 데이터
 * @returns {Object} 마이그레이션된 장바구니 데이터
 */
export const migrateCartData = (legacyCartData) => {
  if (!legacyCartData) {
    return {
      orderMenus: [],
      requestInfo: {
        storeRequest: '',
        deliveryRequest: '문 앞에 놔주세요 (초인종 O)',
        disposableChecked: false,
      },
      _version: CART_DATA_VERSION
    };
  }

  // 이미 마이그레이션된 데이터인지 확인
  if (legacyCartData._version === CART_DATA_VERSION) {
    return legacyCartData;
  }

  console.log('🔄 장바구니 데이터 마이그레이션 시작...', {
    from: legacyCartData._version || LEGACY_CART_DATA_VERSION,
    to: CART_DATA_VERSION,
    itemCount: legacyCartData.orderMenus?.length || 0
  });

  const migratedData = {
    orderMenus: (legacyCartData.orderMenus || []).map(migrateLegacyCartItem),
    requestInfo: {
      storeRequest: legacyCartData.requestInfo?.storeRequest || '',
      deliveryRequest: legacyCartData.requestInfo?.deliveryRequest || '문 앞에 놔주세요 (초인종 O)',
      disposableChecked: legacyCartData.requestInfo?.disposableChecked || false,
    },
    
    // 마이그레이션 메타데이터
    _version: CART_DATA_VERSION,
    _migratedAt: new Date().toISOString(),
    _legacyVersion: legacyCartData._version || LEGACY_CART_DATA_VERSION
  };

  console.log('✅ 장바구니 데이터 마이그레이션 완료', {
    migratedItems: migratedData.orderMenus.length,
    version: migratedData._version
  });

  return migratedData;
};

/**
 * localStorage에서 장바구니 데이터 로드 및 자동 마이그레이션
 * @returns {Object} 마이그레이션된 장바구니 데이터
 */
export const loadAndMigrateCartData = () => {
  try {
    const rawData = localStorage.getItem('itseats-cart');
    const legacyData = rawData ? JSON.parse(rawData) : null;
    
    const migratedData = migrateCartData(legacyData);
    
    // 마이그레이션된 데이터를 다시 저장
    localStorage.setItem('itseats-cart', JSON.stringify(migratedData));
    
    return migratedData;
  } catch (error) {
    console.error('❌ 장바구니 데이터 마이그레이션 실패:', error);
    
    // 실패 시 초기 상태 반환
    const fallbackData = {
      orderMenus: [],
      requestInfo: {
        storeRequest: '',
        deliveryRequest: '문 앞에 놔주세요 (초인종 O)',
        disposableChecked: false,
      },
      _version: CART_DATA_VERSION,
      _error: error.message
    };
    
    localStorage.setItem('itseats-cart', JSON.stringify(fallbackData));
    return fallbackData;
  }
};

/**
 * 쿠폰 데이터 마이그레이션 (단일 → 다중)
 * @param {string|null} legacySelectedCouponId - 기존 단일 쿠폰 ID
 * @returns {Object} 마이그레이션된 쿠폰 상태
 */
export const migrateCouponData = (legacySelectedCouponId) => {
  return {
    selectedCouponId: legacySelectedCouponId,
    selectedCouponIds: legacySelectedCouponId ? [legacySelectedCouponId] : [],
    _migrated: true,
    _version: CART_DATA_VERSION
  };
}; 
