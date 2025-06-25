import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { applyCoupon } from "../../store/couponSlice";
import styles from "./Coupons.module.css";
import Header from "../../components/common/Header";

export default function Coupons() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const coupons = useSelector(state => state.coupon.coupons);
  const fromCart = location.state && location.state.from === 'cart';

  const handleUseCoupon = (couponId) => {
    dispatch(applyCoupon(couponId));
    navigate('/cart');
  };

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
                  {coupon.discount ? coupon.discount.toLocaleString() : coupon.salePrice.toLocaleString()}원 할인
                </p>
                <span className={styles.tag}>{coupon.type || coupon.deliveryType}</span>
                <p className={styles.desc}>
                  {coupon.name || coupon.storeName} {coupon.type || coupon.deliveryType} 전용 할인쿠폰
                </p>
                <p className={styles.date}>{coupon.description || coupon.validDate}까지 사용 가능</p>
              </div>
              {fromCart ? (
                <button
                  className={styles.linkBtn}
                  onClick={() => handleUseCoupon(coupon.id)}
                >
                  쿠폰 사용하기
                </button>
              ) : (
                <button
                  className={styles.linkBtn}
                  onClick={() => navigate(`/stores/${coupon.storeId}`)}
                >
                  →<br />
                  적용가능<br />
                  매장보기
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
