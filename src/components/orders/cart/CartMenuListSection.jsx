import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateQuantity, removeMenu, selectCurrentStore } from '../../../store/cartSlice';
import { createMenuOptionHash } from '../../../utils/hashUtils';
import calculateCartTotal from '../../../utils/calculateCartTotal';
import QuantityControl from './QuantityControl';
import styles from '../../../pages/orders/Cart.module.css';

const CartMenuListSection = React.memo(() => {
  const dispatch = useDispatch();
  const orderMenus = useSelector((state) => state.cart.orderMenus);
  const currentStore = useSelector(selectCurrentStore);

  const handleQuantityChange = useCallback((menuId, menuOption, delta) => {
    const menuOptionHash = createMenuOptionHash(menuOption);
    dispatch(updateQuantity({ menuId, menuOptionHash, delta }));
  }, [dispatch]);

  const handleDelete = useCallback((menuId, menuOption) => {
    const menuOptionHash = createMenuOptionHash(menuOption);
    dispatch(removeMenu({ menuId, menuOptionHash }));
  }, [dispatch]);

  return (
    <section className={styles.section}>
      <h2>
        {currentStore ? currentStore.storeName : '주문 메뉴'}
        {currentStore && (
          <span className={styles.storeInfo}>
            {" "}• {orderMenus.length}개 메뉴
          </span>
        )}
      </h2>
      <hr />
      {orderMenus.map((menu) => {
        const uniqueKey = `${menu.menuId}-${createMenuOptionHash(menu.menuOption)}`;
        return (
          <div key={uniqueKey} className={styles.menuItem}>
            <div className={styles.menuDetails}>
              <p className={styles.menuName}>{menu.menuName}</p>
              <div>
                {(menu.menuOption || []).map((optionGroup, groupIndex) => (
                  <React.Fragment key={`${uniqueKey}-group-${groupIndex}`}>
                    {(optionGroup?.options || []).length > 0 && (
                      <span className={styles.optionGroup}>
                        <span className={styles.optionGroupName}>
                          {optionGroup?.optionGroupName || '옵션'}:
                        </span>
                        {(optionGroup?.options || []).map((option, optionIndex) => (
                          <span key={`${uniqueKey}-option-${groupIndex}-${optionIndex}`} className={styles.option}>
                            {option?.optionName || '옵션'} (+
                            {(Number(option?.optionPrice) || 0).toLocaleString()}원)
                            {optionIndex < (optionGroup?.options || []).length - 1 && ', '}
                          </span>
                        ))}
                      </span>
                    )}
                  </React.Fragment>
                ))}
                <p className={styles.menuPrice}>
                  {calculateCartTotal(menu).toLocaleString()}원
                </p>
              </div>
            </div>
            <div className={styles.quantity}>
              <QuantityControl
                quantity={menu.quantity}
                onQuantityChange={(delta) =>
                  handleQuantityChange(menu.menuId, menu.menuOption, delta)
                }
                onDelete={() => handleDelete(menu.menuId, menu.menuOption)}
              />
            </div>
          </div>
        );
      })}
      {orderMenus.length === 0 && (
        <p className={styles.emptyCart}>카트가 비었습니다.</p>
      )}
    </section>
  );
});

CartMenuListSection.displayName = 'CartMenuListSection';

export default CartMenuListSection;
