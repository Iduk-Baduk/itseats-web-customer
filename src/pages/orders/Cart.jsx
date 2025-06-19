import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import DeliveryToggle from "../../components/orders/cart/DeliveryToggle";
import DeliveryRadioButton from "../../components/orders/cart/DeliveryRadioButton";
import QuantityControl from "../../components/orders/cart/QuantityControl";
import styles from "./Cart.module.css";

export default function Cart() {
  const navigate = useNavigate();

  const [isDelivery, setIsDelivery] = useState("delivery"); // "delivery" or "takeout"
  const [deliveryType, setDeliveryType] = useState("default"); // "default" or "onlyone"
  const [orderMenus, setOrderMenus] = useState(dummyOrder.orderMenus);

  // 수량 변경에 따른 가격 업데이트
  const updateOptionTotalPrice = () => {
    setOrderMenus((prevMenus) =>
      prevMenus.map((menu) => {
        const basePrice = menu.menuPrice;
        const optionsPrice = menu.menuOption.reduce((total, group) => {
          return (
            total +
            group.options.reduce((sum, option) => {
              return sum + option.optionPrice;
            }, 0)
          );
        }, 0);

        return {
          ...menu,
          optionTotalPrice: (basePrice + optionsPrice) * menu.quantity,
        };
      })
    );
  };

  function handleQuantityChange(menuId, menuOption, change) {
    setOrderMenus(
      (prevMenus) =>
        prevMenus
          .map((menu) => {
            const isTarget =
              menu.menuId === menuId &&
              JSON.stringify(menu.menuOption) === menuOption;

            if (!isTarget) return menu;

            const newQuantity = menu.quantity + change;
            if (newQuantity <= 0) return null;

            return {
              ...menu,
              quantity: Math.min(99, newQuantity),
            };
          })
          .filter(Boolean) // null 제거 (삭제된 항목)
    );
    updateOptionTotalPrice();
  }

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
      {isDelivery === "delivery" && (
        <div className={styles.addressContainer}>
          <div className={styles.address}>
            <p className={styles.addressText}>집 (으)로 배달</p>
            <p className={styles.mainAddress}>
              경기도 성남시 분당구 판교로 242
            </p>
            <p className={styles.detailAddress}>PDC A동 902호</p>
          </div>
          <div className={styles.addressEdit}>
            <Link to="/address">수정</Link>
          </div>
        </div>
      )}
      {isDelivery === "takeout" && (
        <div className={styles.addressContainer}>
          <div className={styles.address}>
            <p className={styles.addressText}>매장 주소</p>
            <p className={styles.mainAddress}>
              경기도 성남시 분당구 판교로 242 PDC A동 902호
            </p>
            <p className={styles.detailAddress}>(주소지로부터 0.9km)</p>
          </div>
        </div>
      )}
      {isDelivery === "delivery" && (
        <section>
          <h2>배달 방법</h2>
          <DeliveryRadioButton
            checked={deliveryType === "onlyone"}
            onChange={() => setDeliveryType("onlyone")}
            label="한집배달"
            timeMin={dummyResponse.onlyOneTimeMin}
            timeMax={dummyResponse.onlyOneTimeMax}
            deliveryFee={dummyResponse.onlyOneFee}
            className={styles.radioButton}
          />
          <DeliveryRadioButton
            checked={deliveryType === "default"}
            onChange={() => setDeliveryType("default")}
            label="세이브배달"
            timeMin={dummyResponse.defaultTimeMin}
            timeMax={dummyResponse.defaultTimeMax}
            deliveryFee={dummyResponse.deliveryFee}
            className={styles.radioButton}
          />
        </section>
      )}

      <section>
        <h2>스타벅스 구름톤점</h2>
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
                        {groupIndex > 0 && " "}
                        <span className={styles.optionGroupName}>
                          {optionGroup.optionGroupName}:{" "}
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
                  {menu.optionTotalPrice.toLocaleString()}원
                </p>
              </div>
            </div>
            <div className={styles.quantity}>
              <QuantityControl
                quantity={menu.quantity}
                onQuantityChange={(delta) =>
                  handleQuantityChange(
                    menu.menuId,
                    JSON.stringify(menu.menuOption),
                    delta
                  )
                }
              />
            </div>
          </div>
        ))}
        {orderMenus.length === 0 && (
          <p className={styles.emptyCart}>카트가 비었습니다.</p>
        )}
        <div></div>
      </section>
      <section>
        <h2 className={styles.couponHeader}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="var(--theme-color)"
              d="M4 4a2 2 0 0 0-2 2v4a2 2 0 0 1 2 2a2 2 0 0 1-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 1-2-2a2 2 0 0 1 2-2V6a2 2 0 0 0-2-2zm11.5 3L17 8.5L8.5 17L7 15.5zm-6.69.04c.98 0 1.77.79 1.77 1.77a1.77 1.77 0 0 1-1.77 1.77c-.98 0-1.77-.79-1.77-1.77a1.77 1.77 0 0 1 1.77-1.77m6.38 6.38c.98 0 1.77.79 1.77 1.77a1.77 1.77 0 0 1-1.77 1.77c-.98 0-1.77-.79-1.77-1.77a1.77 1.77 0 0 1 1.77-1.77"
            />
          </svg>
          <span>쿠폰</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="var(--black-500)"
              d="M12.6 12L8 7.4L9.4 6l6 6l-6 6L8 16.6z"
            />
          </svg>
        </h2>
      </section>
      <section>
        <h2>결제금액</h2>
      </section>
    </div>
  );
}

const dummyOrder = {
  addrId: 1,
  storeId: 13,
  orderMenus: [
    {
      menuId: 11,
      menuName: "아메리카노",
      menuPrice: 2000,
      menuOption: [
        {
          optionGroupName: "사이즈",
          options: [
            {
              optionName: "톨(Tall)",
              optionPrice: 500,
            },
          ],
        },
        {
          optionGroupName: "샷 추가",
          options: [],
        },
        {
          optionGroupName: "사이드 메뉴",
          options: [
            {
              optionName: "커피번",
              optionPrice: 3500,
            },
            {
              optionName: "도넛",
              optionPrice: 1000,
            },
          ],
        },
      ],
      optionTotalPrice: 7000,
      quantity: 1,
    },
    {
      menuId: 12,
      menuName: "딸기스무디",
      menuPrice: 3500,
      menuOption: [
        {
          optionGroupName: "사이즈",
          options: [
            {
              optionName: "톨(Tall)",
              optionPrice: 500,
            },
          ],
        },
        {
          optionGroupName: "샷 추가",
          options: [],
        },
        {
          optionGroupName: "사이드 메뉴",
          options: [],
        },
      ],
      optionTotalPrice: 8000,
      quantity: 2,
    },
  ],
};

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
