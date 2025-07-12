/**
 * 주문 메뉴와 매장 목록을 기반으로 현재 매장 정보를 찾거나 생성합니다.
 * @param {Array} orderMenus - 주문 메뉴 목록
 * @param {Array} allStores - 전체 매장 목록  
 * @param {Function} logger - 로거 함수
 * @returns {Object|null} - 찾거나 생성된 매장 정보 { storeId, storeInfo }
 */
export const findOrCreateStoreInfo = (orderMenus, allStores, logger) => {
  if (!orderMenus || orderMenus.length === 0) {
    logger?.log('❌ 주문 메뉴가 없어 매장 정보를 복구할 수 없습니다');
    return null;
  }

  const firstMenu = orderMenus[0];
  let currentStoreId = null;
  let currentStoreInfo = null;

  logger?.log('🔧 매장 정보 복구 시작:', {
    orderMenusCount: orderMenus.length,
    allStoresCount: allStores.length,
    firstMenu
  });

  // 1. 메뉴의 storeId로 매장 찾기
  if (firstMenu.storeId) {
    currentStoreId = String(firstMenu.storeId);
    
    // allStores에서 해당 매장 찾기
    currentStoreInfo = allStores.find(store => 
      String(store.storeId) === String(firstMenu.storeId)
    );
    
    logger?.log('🔍 storeId로 매장 찾기:', { 
      storeId: currentStoreId, 
      found: !!currentStoreInfo 
    });
  }

  // 2. 메뉴 ID로 매장 찾기 (storeId가 없거나 매장을 못 찾은 경우)
  if (!currentStoreInfo && firstMenu.menuId) {
    const foundByMenuId = allStores.find(store => 
      store.menus && store.menus.some(menu => 
        String(menu.menuId) === String(firstMenu.menuId)
      )
    );
    
    if (foundByMenuId) {
      currentStoreId = String(foundByMenuId.id);
      currentStoreInfo = foundByMenuId;
      logger?.log('🔍 menuId로 매장 찾기 성공:', foundByMenuId);
    }
  }

  // 3. 매장을 찾지 못한 경우 기본 매장 정보 생성
  if (!currentStoreInfo) {
    // 1) orderMenus의 storeId가 있으면 그 매장
    if (firstMenu.storeId) {
      currentStoreId = String(firstMenu.storeId);
      currentStoreInfo = allStores.find(store => String(store.storeId) === String(firstMenu.storeId));
    }
    // 2) allStores의 첫 번째 매장
    if (!currentStoreInfo && allStores.length > 0) {
      currentStoreId = String(allStores[0].storeId || allStores[0].id);
      currentStoreInfo = allStores[0];
    }
    // 3) 그래도 없으면 null 반환
    if (!currentStoreInfo) {
      logger?.log('❌ 기본 매장 정보 생성 실패: 매장 정보 없음');
      return null;
    }
    logger?.log('🏪 기본 매장 정보 생성(하드코딩X):', currentStoreInfo);
  }

  return {
    storeId: currentStoreId,
    storeInfo: currentStoreInfo
  };
}; 
