// utils/calculateCartTotal.js
export default function calculateCartTotal(menu) {
  // 메뉴 가격 필드 확인 (여러 가능한 필드명 지원)
  const basePrice = Number(menu.menuPrice || menu.price || 0);
  const quantity = Number(menu.quantity) || 0;

  console.log('💰 메뉴 총액 계산:', {
    menuName: menu.menuName,
    basePrice,
    quantity,
    menuPriceField: menu.menuPrice,
    priceField: menu.price,
    options: menu.menuOption
  });

  const optionPrice = (menu.menuOption || []).reduce((sum, group) => {
    const groupOptions = group.options || [];

    const groupSum = groupOptions.reduce((optSum, opt) => {
      const price = Number(opt.optionPrice);
      return optSum + (isNaN(price) ? 0 : price);
    }, 0);

    return sum + groupSum;
  }, 0);

  const total = (basePrice + optionPrice) * quantity;
  const finalTotal = isNaN(total) ? 0 : total;
  
  console.log('💰 계산 결과:', { basePrice, optionPrice, quantity, total: finalTotal });
  
  return finalTotal;
}
