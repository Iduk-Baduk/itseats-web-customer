/**
 * 장바구니 아이템의 총 가격을 계산합니다.
 * 메뉴 가격 + 옵션 가격들을 모두 포함합니다.
 * 
 * @param {Object} menu - 장바구니에 담긴 메뉴 아이템
 * @returns {number} 총 가격
 */
export default function calculateCartTotal(menu) {
  const basePrice = Number(menu.menuPrice) || 0;
  const quantity = Number(menu.quantity) || 0;

  const optionPrice = (menu.menuOption || []).reduce((sum, group) => {
    const groupOptions = group.options || [];

    const groupSum = groupOptions.reduce((optSum, opt) => {
      const price = Number(opt.optionPrice);
      return optSum + (isNaN(price) ? 0 : price);
    }, 0);

    return sum + groupSum;
  }, 0);

  const total = (basePrice + optionPrice) * quantity;
  return isNaN(total) ? 0 : total;
}

/**
 * 장바구니 전체의 총 가격을 계산합니다.
 * 
 * @param {Array} orderMenus - 장바구니 메뉴 배열
 * @returns {number} 전체 총 가격
 */
export function calculateCartTotalPrice(orderMenus) {
  if (!Array.isArray(orderMenus)) return 0;

  return orderMenus.reduce((total, menuItem) => {
    return total + calculateCartTotal(menuItem);
  }, 0);
}

/**
 * 장바구니 전체의 총 아이템 수를 계산합니다.
 * 
 * @param {Array} orderMenus - 장바구니 메뉴 배열
 * @returns {number} 전체 아이템 수
 */
export function calculateCartTotalItems(orderMenus) {
  if (!Array.isArray(orderMenus)) return 0;

  return orderMenus.reduce((total, menuItem) => {
    return total + (menuItem.quantity || 1);
  }, 0);
} 
