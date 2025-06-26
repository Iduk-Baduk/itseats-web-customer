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
    console.log('=== 🎫 쿠폰 사용하기 클릭 ===');
    console.log('클릭한 쿠폰 ID:', couponId, typeof couponId);
    
    try {
      // 장바구니 총액 계산
      const cartTotal = orderMenus.reduce((sum, menu) => sum + calculateCartTotal(menu), 0);
      
      console.log('🎫 쿠폰 적용 시도:', {
        couponId,
        couponIdType: typeof couponId,
        cartTotal,
        cartTotalType: typeof cartTotal,
        orderMenusCount: orderMenus.length,
        orderMenus: orderMenus.map(m => ({
          menuName: m.menuName,
          quantity: m.quantity,
          menuPrice: m.menuPrice,
          total: calculateCartTotal(m)
        })),
        모든쿠폰: coupons.map(c => ({
          id: c.id,
          idType: typeof c.id,
          name: c.name,
          discount: c.discount,
          minOrderAmount: c.minOrderAmount,
          isUsed: c.isUsed,
          isExpired: c.isExpired
        }))
      });
      
      if (cartTotal <= 0) {
        alert('장바구니가 비어있습니다.');
        return;
      }

      console.log('🚀 Redux applyCoupon 액션 디스패치 시작');
      console.log('디스패치할 payload:', { couponId, cartTotal });
      const result = dispatch(applyCoupon({ couponId, cartTotal }));
      console.log('🎯 Redux applyCoupon 액션 디스패치 완료. 반환값:', result);
      
      // 즉시 Redux 상태 확인
      setTimeout(() => {
        if (window.__REDUX_STORE__) {
          const newState = window.__REDUX_STORE__.getState();
          console.log('🔍 쿠폰 적용 후 Redux 상태:', {
            selectedCouponId: newState.coupon.selectedCouponId,
            selectedCouponIds: newState.coupon.selectedCouponIds,
            전체쿠폰상태: newState.coupon
          });
        }
        if (window.debugRedux) {
          window.debugRedux.logCouponState();
        }
        console.log('📱 장바구니로 이동');
        navigate('/cart');
      }, 200);
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
