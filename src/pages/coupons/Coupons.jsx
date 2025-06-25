import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { applyCoupon, selectNormalizedCoupons } from "../../store/couponSlice";
import calculateCartTotal from "../../utils/calculateCartTotal";
import styles from "./Coupons.module.css";
import Header from "../../components/common/Header";

export default function Coupons() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const coupons = useSelector(selectNormalizedCoupons);
  const orderMenus = useSelector(state => state.cart.orderMenus);
  const fromCart = location.state && location.state.from === 'cart';

  const handleUseCoupon = (couponId) => {
    try {
      // 장바구니 총액 계산
      const cartTotal = orderMenus.reduce((sum, menu) => sum + calculateCartTotal(menu), 0);
      
      if (cartTotal <= 0) {
        alert('장바구니가 비어있습니다.');
        return;
      }

      dispatch(applyCoupon({ couponId, cartTotal }));
      navigate('/cart');
    } catch (error) {
      console.error('쿠폰 적용 중 오류가 발생했습니다:', error);
      alert('쿠폰 적용에 실패했습니다. 다시 시도해주세요.');
    }
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
                  {coupon.discount.toLocaleString()}원 할인
                </p>
                <span className={styles.tag}>{coupon.type}</span>
                <p className={styles.desc}>
                  {coupon.name} {coupon.type} 전용 할인쿠폰
                </p>
                <p className={styles.date}>{coupon.description}까지 사용 가능</p>
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
