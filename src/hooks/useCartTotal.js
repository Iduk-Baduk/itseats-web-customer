// hooks/useCartTotal.js
export default function useCartTotal(menu) {
  const optionPrice = menu.menuOption?.reduce((sum, group) => {
    return (
      sum +
      group.options.reduce((optSum, opt) => optSum + opt.optionPrice, 0)
    );
  }, 0);

  return (menu.menuPrice + optionPrice) * menu.quantity;
}