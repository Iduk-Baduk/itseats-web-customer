import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import DeliveryToggle from "../../components/orders/cart/DeliveryToggle";
import styles from "./Cart.module.css";

export default function Cart() {
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] = useState("delivery");

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
        <DeliveryToggle onChange={(value) => setDeliveryType(value)} />
      </span>



      <div>선택된 배달 방식: {deliveryType}</div>
    </div>
  );
}
