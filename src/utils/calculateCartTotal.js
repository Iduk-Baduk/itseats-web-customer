// utils/calculateCartTotal.js
export default function calculateCartTotal(menu) {
  if (!menu) return 0;

  // console.log('💰 메뉴 총액 계산:', {
  //   menuName: menu.menuName,
  //   basePrice: menu.menuPrice,
  //   quantity: menu.quantity,
  //   menuOption: menu.menuOption
  // });

  const basePrice = menu.menuPrice || 0;
  const quantity = menu.quantity || 1;
  
  // 옵션 가격 계산
  let optionPrice = 0;
  if (Array.isArray(menu.menuOption)) {
    optionPrice = menu.menuOption.reduce((total, optionGroup) => {
      if (Array.isArray(optionGroup.options)) {
        return total + optionGroup.options.reduce((groupTotal, option) => {
          return groupTotal + (option.optionPrice || 0);
        }, 0);
      }
      return total;
    }, 0);
  }
  
  const finalTotal = (basePrice + optionPrice) * quantity;

  // console.log('💰 계산 결과:', { basePrice, optionPrice, quantity, total: finalTotal });

  return finalTotal;
}
