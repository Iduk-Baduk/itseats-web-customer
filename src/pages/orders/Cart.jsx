import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  const [isDelivery, setIsDelivery] = useState("delivery"); // "delivery" or "takeout"
  const [deliveryType, setDeliveryType] = useState("default"); // "default" or "onlyone"
  const [orderMenus, setOrderMenus] = useState(dummyOrder.orderMenus);
  const [paymentMethod, setPaymentMethod] = useState("credit"); // "credit", "bank", "kakao", "meet"
  const [storeRequest, setStoreRequest] = useState("");
  const [chopsticks, setChopsticks] = useState(false);
  const [riderRequest, setRiderRequest] =
    useState("직접 받을게요 (부재 시 문 앞)");
  const [riderRequestSelf, setRiderRequestSelf] = useState("");
  const [isRiderRequestSheetOpen, setRiderRequestSheetOpen] = useState(false);

  // 수량 변경에 따른 가격 업데이트
  const updateMenuTotalPrice = () => {
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
          menuTotalPrice: (basePrice + optionsPrice) * menu.quantity,
        };
      })
    );
  };

  // 개수 변경
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
    updateMenuTotalPrice();
  }

  function handlePayment() {
    alert("구현 필요");
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
                  {menu.menuTotalPrice.toLocaleString()}원
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
      <section style={{ borderBottomWidth: "24px" }}>
        <h2>결제금액</h2>
        <div className={styles.paymentDetails}>
          <div className={styles.paymentRow}>
            <span>주문금액</span>
            <span>{dummyResponse.orderPrice.toLocaleString()}원</span>
          </div>
          {isDelivery === "delivery" && (
            <div className={styles.paymentRow}>
              <span>배달비</span>
              <span>{dummyResponse.deliveryFee.toLocaleString()}원</span>
            </div>
          )}
          <div className={styles.paymentRow}>
            <span>할인금액</span>
            <span style={{ color: "var(--minus-red)" }}>
              -{dummyResponse.discountValue.toLocaleString()}원
            </span>
          </div>
          <div className={styles.totalCost}>
            <span>총 결제금액</span>
            <span>{dummyResponse.totalCost.toLocaleString()}원</span>
          </div>
        </div>
      </section>
      <section style={{ borderBottomWidth: "24px" }}>
        <h2>결제수단</h2>
        <div
          className={styles.radioButtonContainer}
          style={{ marginTop: "24px" }}
        >
          <RadioButton
            checked={paymentMethod === "credit"}
            onChange={() => setPaymentMethod("credit")}
            label="신용/체크카드"
            id="payment-method-credit-card"
            className={styles.radioButton}
          />
        </div>
        <div className={styles.radioButtonContainer}>
          <RadioButton
            checked={paymentMethod === "bank"}
            onChange={() => setPaymentMethod("bank")}
            label="계좌이체"
            id="payment-method-bank-transfer"
            className={styles.radioButton}
          />
        </div>
        <div className={styles.radioButtonContainer}>
          <RadioButton
            checked={paymentMethod === "kakao"}
            onChange={() => setPaymentMethod("kakao")}
            label="카카오페이"
            id="payment-method-kakao-pay"
            className={styles.radioButton}
          />
        </div>
        <div className={styles.radioButtonContainer}>
          <RadioButton
            checked={paymentMethod === "meet"}
            onChange={() => setPaymentMethod("meet")}
            label="만나서 결제"
            id="payment-method-meet"
            className={styles.radioButton}
          />
        </div>
        <hr />
        <div
          className={styles.paymentManageButton}
          onClick={() => navigate("/payments")}
        >
          결제 수단 관리
        </div>
      </section>
      <section>
        <h2>요청사항</h2>
        <div>
          <p className={styles.requestLabel}>가게 사장님께</p>
          <TextInput
            placeholder="가게 요청사항을 입력해주세요"
            className={styles.requestInput}
            value={storeRequest}
            onChange={(e) => setStoreRequest(e.target.value)}
            maxLength={50}
          />
          <CheckBox
            label="일회용 수저, 포크 받기"
            checked={chopsticks}
            onChange={(e) => setChopsticks(e.target.checked)}
          />
        </div>
        {isDelivery === "delivery" && (
          <div>
            <p className={styles.requestLabel}>배달 파트너님께</p>
            <div className={styles.riderRequestSelect}>
              <input
                className={styles.select}
                type="text"
                onClick={() => setRiderRequestSheetOpen(true)}
                value={riderRequest}
                readOnly
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M15.88 9.29L12 13.17L8.12 9.29a.996.996 0 1 0-1.41 1.41l4.59 4.59c.39.39 1.02.39 1.41 0l4.59-4.59a.996.996 0 0 0 0-1.41c-.39-.38-1.03-.39-1.42 0"
                />
              </svg>
            </div>
            {riderRequest === "직접 입력하기" && (
              <>
                <TextInput
                  placeholder="배달 요청사항을 입력해주세요"
                  className={styles.requestInput}
                  value={riderRequestSelf}
                  onChange={(e) => setRiderRequestSelf(e.target.value)}
                  maxLength={50}
                />
                <p className={styles.deliveryInfo}>
                  모든 주문은 배달완료 사진을 보내드립니다.
                </p>
              </>
            )}
          </div>
        )}
      </section>
      <section className={styles.legalInfo}>
        <p>
          잇츠잇츠는 통신판매중개자로서 통신판매의 당사자가 아니며, 판매자가
          등록한 상품 정보, 상품의 품질 및 거래에 대해서 일체의 책임을 지지
          않습니다. 회원은 주문 내용을 확인하였고, 결제에 동의합니다.
        </p>
      </section>
      <BottomButton
        onClick={handlePayment}
        disabled={orderMenus.length === 0}
      >
        <p>{dummyResponse.totalCost.toLocaleString()}원 결제하기</p>
      </BottomButton>
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
      menuTotalPrice: 7000,
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
      menuTotalPrice: 8000,
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
