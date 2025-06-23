// ✅ Cart.jsx - Redux 기반으로 리팩토링된 버전 (카트 추가 + BottomButton 연동)
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateQuantity, removeMenu, addMenu } from "../../store/cartSlice";
import Header from "../../components/common/Header";
import TextInput from "../../components/common/basic/TextInput";
import CheckBox from "../../components/common/basic/Checkbox";
import RadioButton from "../../components/common/basic/RadioButton";
import DeliveryToggle from "../../components/orders/cart/DeliveryToggle";
import DeliveryRadioButton from "../../components/orders/cart/DeliveryRadioButton";
import QuantityControl from "../../components/orders/cart/QuantityControl";
import RiderRequestBottomSheet from "../../components/orders/cart/RiderRequestBottomSheet";
import BottomButton from "../../components/common/BottomButton";
import styles from "./Cart.module.css";

export default function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const orderMenus = useSelector((state) => state.cart.orderMenus);

  const [isDelivery, setIsDelivery] = useState("delivery");
  const [deliveryType, setDeliveryType] = useState("default");
  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [storeRequest, setStoreRequest] = useState("");
  const [chopsticks, setChopsticks] = useState(false);
  const [riderRequest, setRiderRequest] =
    useState("직접 받을게요 (부재 시 문 앞)");
  const [riderRequestSelf, setRiderRequestSelf] = useState("");
  const [isRiderRequestSheetOpen, setRiderRequestSheetOpen] = useState(false);

  const handleQuantityChange = (menuId, menuOption, delta) => {
    dispatch(updateQuantity({ menuId, menuOption, delta }));
  };

  const handleDelete = (menuId, menuOption) => {
    dispatch(removeMenu({ menuId, menuOption }));
  };

  const handlePayment = () => {
    alert("구현 필요");
  };

  const cartInfo = {
    orderPrice: orderMenus.reduce(
      (sum, m) => sum + m.menuPrice * m.quantity,
      0
    ),
    totalPrice: orderMenus.reduce((sum, m) => sum + m.menuTotalPrice, 0),
    itemCount: orderMenus.reduce((sum, m) => sum + m.quantity, 0),
  };

  return (
    <div className={styles.container}>
      <Header
        title=""
        leftIcon="close"
        rightIcon={null}
        leftButtonAction={() => {
          navigate(-1);
        }}
      />
      <span className={styles.fixed}>
        <DeliveryToggle onChange={(value) => setIsDelivery(value)} />
      </span>

      <section>
        <h2>스타벅스 구름톤점</h2>
        <hr />
        {/* <button onClick={handleAddDummyMenu} className={styles.addButton}>
          메뉴 추가 테스트
        </button> */}
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
                            {optionIndex < optionGroup.options.length - 1 &&
                              ", "}
                          </span>
                        ))}
                      </span>
                    )}
                  </React.Fragment>
                ))}
                <p className={styles.menuPrice}>
                  {menu.menuTotalPrice.toLocaleString()}원
                </p>
              </div>
            </div>
            <div className={styles.quantity}>
              <QuantityControl
                quantity={menu.quantity}
                onQuantityChange={(delta) =>
                  handleQuantityChange(menu.menuId, menu.menuOption, delta)
                }
              />
            </div>
          </div>
        ))}
        {orderMenus.length === 0 && (
          <p className={styles.emptyCart}>카트가 비었습니다.</p>
        )}
      </section>

      <BottomButton
        onClick={handlePayment}
        disabled={orderMenus.length === 0}
        cartInfo={cartInfo}
      />

      <RiderRequestBottomSheet
        request={riderRequest}
        isOpen={isRiderRequestSheetOpen}
        onClose={() => setRiderRequestSheetOpen(false)}
        onSelect={(request) => {
          setRiderRequest(request);
        }}
      />
    </div>
  );
}

const dummyResponse = {
  defaultTimeMin: 34,
  defaultTimeMax: 49,
  onlyOneTimeMin: 32,
  onlyOneTimeMax: 42,
  orderPrice: 15000,
  deliveryFee: 3000,
  onlyOneFee: 3300,
  discountValue: 1000,
  totalCost: 17000,
};
