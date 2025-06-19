import { useNavigate } from "react-router-dom";
import styles from "./Coupons.module.css";
import Header from "../components/common/Header";
import useCoupons from "../hooks/useCoupons";

export default function Coupons() {
  const navigate = useNavigate();
  const { coupons } = useCoupons();

  return (
    <div className={styles.container}>
      <Header
        title="할인 쿠폰"
        leftButtonAction={() => {
          navigate(-1);
        }}
        rightIcon=""
      />
      {coupons.length === 0 ? (
        <p className={styles.empty}>보유한 쿠폰이 없습니다.</p>
      ) : (
        <ul className={styles.couponList}>
          {coupons.map((coupon) => (
            <li key={coupon.id} className={styles.couponCard}>
              <div className={styles.couponInfo}>
                <p className={styles.amount}>
                  {coupon.salePrice.toLocaleString()}원 할인
                </p>
                <span className={styles.tag}>{coupon.deliveryType}</span>
                <p className={styles.desc}>
                  {coupon.storeName} {coupon.deliveryType} 전용 할인쿠폰
                </p>
                <p className={styles.date}>{coupon.validDate}까지 사용 가능</p>
              </div>
              <button
                className={styles.linkBtn}
                onClick={() => navigate(`/stores/${coupon.storeId}`)}
              >
                →<br />
                적용가능
                <br />
                매장보기
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
