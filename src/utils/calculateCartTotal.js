// utils/calculateCartTotal.js
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