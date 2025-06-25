import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateQuantity, removeMenu } from '../../../store/cartSlice';
import { createMenuOptionHash } from '../../../utils/hashUtils';
import calculateCartTotal from '../../../utils/calculateCartTotal';
import QuantityControl from './QuantityControl';
import styles from '../../../pages/orders/Cart.module.css';

export default function CartMenuListSection() {
  const dispatch = useDispatch();
  const orderMenus = useSelector((state) => state.cart.orderMenus);

  const handleQuantityChange = (menuId, menuOption, delta) => {
    const menuOptionHash = createMenuOptionHash(menuOption);
    dispatch(updateQuantity({ menuId, menuOptionHash, delta }));
  };

  const handleDelete = (menuId, menuOption) => {
    const menuOptionHash = createMenuOptionHash(menuOption);
    dispatch(removeMenu({ menuId, menuOptionHash }));
  };

  // 첫 번째 메뉴의 storeName 사용 (없으면 '주문 메뉴')
  const storeName = orderMenus.length > 0 ? orderMenus[0].storeName : null;

  return (
    <section className={styles.section}>
      <h2>{storeName || '주문 메뉴'}</h2>
      <hr />
      {orderMenus.map((menu, index) => (
        <div key={index} className={styles.menuItem}>
          <div className={styles.menuDetails}>
            <p className={styles.menuName}>{menu.menuName}</p>
            <div>
              {menu.menuOption.map((optionGroup, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  {optionGroup.options.length > 0 && (
                    <span className={styles.optionGroup}>
                      <span className={styles.optionGroupName}>
                        {optionGroup.optionGroupName}:
                      </span>
                      {optionGroup.options.map((option, optionIndex) => (
                        <span key={optionIndex} className={styles.option}>
                          {option.optionName} (+
                          {option.optionPrice.toLocaleString()}원)
                          {optionIndex < optionGroup.options.length - 1 && ', '}
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
      ))}
      {orderMenus.length === 0 && (
        <p className={styles.emptyCart}>카트가 비었습니다.</p>
      )}
    </section>
  );
} 
