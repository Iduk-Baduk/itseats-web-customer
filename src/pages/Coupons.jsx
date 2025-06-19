import { useNavigate } from "react-router-dom";
import styles from "./Coupons.module.css";
import useCoupons from "../hooks/useCoupons";

export default function Coupons() {
  const navigate = useNavigate();
  const { coupons } = useCoupons();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>할인 쿠폰</h2>

      {coupons.length === 0 ? (
        <p className={styles.empty}>보유한 쿠폰이 없습니다.</p>
      ) : (
        <ul className={styles.couponList}>
          {coupons.map((coupon) => (
            <li key={coupon.id} className={styles.couponCard}>
              <div className={styles.amount}>₩{coupon.salePrice.toLocaleString()}</div>
              <div className={styles.desc}>할인 쿠폰</div>
              <button
                className={styles.linkBtn}
                onClick={() => navigate(`/stores/${coupon.storeId}`)}
              >
                적용 가능 매장 보기
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}