/**
 * 쿠폰 할인 금액 계산 (백엔드 타입: RATE, AMOUNT)
 */
export function calculateCouponDiscount(coupon, orderPrice = 0, deliveryFee = 0) {
  if (!coupon || orderPrice < 0 || deliveryFee < 0) return 0;

  let discountAmount = 0;

  switch (coupon.couponType) {
    case 'RATE':
      discountAmount = Math.floor(orderPrice * (coupon.discountValue / 100));
      discountAmount = Math.min(discountAmount, orderPrice);
      break;

    default:
      discountAmount = Math.min(coupon.discountValue, orderPrice);
      break;
  }

  return discountAmount;
}

/**
 * 다중 쿠폰 할인 계산
 */
export function calculateMultipleCouponsDiscount(coupons, orderPrice = 0, deliveryFee = 0) {
  if (!coupons || coupons.length === 0) {
    return { orderDiscount: 0, deliveryDiscount: 0, totalDiscount: 0 };
  }

  let orderDiscount = 0;
  let deliveryDiscount = 0;
  let remainingOrderPrice = orderPrice;

  const hasNonStackable = coupons.some(c => !c.isStackable);

  if (hasNonStackable) {
    const nonStackable = coupons.find(c => !c.isStackable);
    const discount = calculateCouponDiscount(nonStackable, orderPrice, deliveryFee);
    orderDiscount = discount;
  } else {
    for (const c of coupons) {
      const discount = calculateCouponDiscount(c, remainingOrderPrice, deliveryFee);
      orderDiscount += discount;
      remainingOrderPrice = Math.max(0, remainingOrderPrice - discount);
    }
  }

  return {
    orderDiscount,
    deliveryDiscount, // 현재 배달비 할인은 별도 처리 안함
    totalDiscount: orderDiscount + deliveryDiscount,
  };
}

/**
 * 쿠폰 표시용 텍스트 생성
 */
export function getCouponDisplayText(coupon, orderPrice = 0, deliveryFee = 0) {
  if (!coupon) return '0원 할인';

  switch (coupon.couponType) {
    case 'RATE':
      return `${coupon.discountValue}% 할인`;

    default:
      return `${coupon.discountValue.toLocaleString()}원 할인`;
  }
}

/**
 * 쿠폰 유효성 검사
 */
export function validateCoupon(coupon, orderPrice = 0) {
  if (!coupon) return { isValid: false, reason: '쿠폰이 없습니다.' };
  if (coupon.isUsed) return { isValid: false, reason: '이미 사용된 쿠폰입니다.' };
  if (coupon.isExpired) return { isValid: false, reason: '만료된 쿠폰입니다.' };

  if (coupon.validDate) {
    const validDate = new Date(coupon.validDate);
    const now = new Date();
    if (now > validDate) {
      return { isValid: false, reason: '유효기간이 만료되었습니다.' };
    }
  }

  if (coupon.minOrderAmount && orderPrice < coupon.minOrderAmount) {
    return { 
      isValid: false, 
      reason: `최소 주문 금액 ${coupon.minOrderAmount.toLocaleString()}원 이상이어야 합니다.`,
    };
  }

  return { isValid: true, reason: null };
}

/**
 * 중복 가능 여부
 */
export function isCouponStackable(coupon) {
  return coupon && coupon.isStackable === true;
}

/**
 * 할인값 포맷
 */
export function formatDiscountValue(discountValue) {
  return discountValue < 100
    ? `${discountValue}% 할인`
    : `${discountValue.toLocaleString()}원 할인`;
}
