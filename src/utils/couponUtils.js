/**
 * 쿠폰 할인 금액을 계산하는 유틸리티 함수
 * @param {Object} coupon - 쿠폰 객체
 * @param {number} orderPrice - 주문 금액 (메뉴 가격 합계)
 * @param {number} deliveryFee - 배달비
 * @returns {number} 실제 할인 금액
 */
export function calculateCouponDiscount(coupon, orderPrice = 0, deliveryFee = 0) {
  if (!coupon || orderPrice < 0 || deliveryFee < 0) {
    return 0;
  }

  let discountAmount = 0;

  switch (coupon.type) {
    case 'percentage':
      {
        // 퍼센테이지 할인: 주문 금액의 %로 계산 후 100원 단위 내림
        const rawPercentageDiscount = orderPrice * (coupon.discount / 100);
        discountAmount = Math.floor(rawPercentageDiscount / 100) * 100;
        
        // 최대 할인 금액 제한 적용
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
        
        // 주문금액을 초과할 수 없음
        discountAmount = Math.min(discountAmount, orderPrice);
        break;
      }

    case 'delivery':
      {
        // 배달비 할인: 배달비에서만 할인 (주문금액과 별도)
        if (coupon.discount >= 100) {
          // 100% 이상이면 배달비 전액 할인
          discountAmount = deliveryFee;
        } else if (coupon.discount > 1) {
          // 고정 금액 할인
          discountAmount = Math.min(coupon.discount, deliveryFee);
        } else {
          // 퍼센테이지 할인 (0~1 사이) - 배달비도 100원 단위 내림
          const rawDeliveryDiscount = deliveryFee * coupon.discount;
          discountAmount = Math.floor(rawDeliveryDiscount / 100) * 100;
        }
        
        // 최대 할인 금액 제한 적용
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
        
        // 배달비를 초과할 수 없음
        discountAmount = Math.min(discountAmount, deliveryFee);
        break;
      }

    case 'general':
    default:
      // 고정 금액 할인: 주문금액 내에서만 적용
      discountAmount = Math.min(coupon.discount, orderPrice);
      break;
  }

  return discountAmount;
}

/**
 * 다중 쿠폰 할인 금액을 계산하는 함수
 * @param {Array} coupons - 적용할 쿠폰 배열
 * @param {number} orderPrice - 주문 금액
 * @param {number} deliveryFee - 배달비
 * @returns {Object} {orderDiscount, deliveryDiscount, totalDiscount}
 */
export function calculateMultipleCouponsDiscount(coupons, orderPrice = 0, deliveryFee = 0) {
  if (!coupons || coupons.length === 0) {
    return { orderDiscount: 0, deliveryDiscount: 0, totalDiscount: 0 };
  }

  let orderDiscount = 0;
  let deliveryDiscount = 0;
  let remainingOrderPrice = orderPrice;
  let remainingDeliveryFee = deliveryFee;

  // 비중복 쿠폰이 있으면 다른 쿠폰 적용 불가
  const hasNonStackable = coupons.some(coupon => !coupon.isStackable);
  
  if (hasNonStackable) {
    // 비중복 쿠폰만 적용 (첫 번째 비중복 쿠폰)
    const nonStackableCoupon = coupons.find(coupon => !coupon.isStackable);
    const discount = calculateCouponDiscount(nonStackableCoupon, orderPrice, deliveryFee);
    
    if (nonStackableCoupon.type === 'delivery') {
      deliveryDiscount = discount;
    } else {
      orderDiscount = discount;
    }
  } else {
    // 모든 쿠폰이 중복 가능한 경우
    for (const coupon of coupons) {
      const discount = calculateCouponDiscount(coupon, remainingOrderPrice, remainingDeliveryFee);
      
      if (coupon.type === 'delivery') {
        deliveryDiscount += discount;
        remainingDeliveryFee = Math.max(0, remainingDeliveryFee - discount);
      } else {
        orderDiscount += discount;
        remainingOrderPrice = Math.max(0, remainingOrderPrice - discount);
      }
    }
  }

  return {
    orderDiscount,
    deliveryDiscount,
    totalDiscount: orderDiscount + deliveryDiscount
  };
}

/**
 * 쿠폰 표시용 텍스트를 생성하는 함수
 * @param {Object} coupon - 쿠폰 객체
 * @param {number} orderPrice - 주문 금액 (실제 할인 금액 계산용)
 * @param {number} deliveryFee - 배달비
 * @returns {string} 표시할 할인 금액 텍스트
 */
export function getCouponDisplayText(coupon, orderPrice = 0, deliveryFee = 0) {
  if (!coupon) return '0원 할인';

  switch (coupon.type) {
    case 'percentage':
      // 퍼센테이지 쿠폰은 항상 퍼센테이지로만 표시
      return `${coupon.discount}% 할인`;

    case 'delivery':
      if (coupon.discount >= 100 || coupon.discount === deliveryFee) {
        return '배달비 무료';
      } else if (deliveryFee > 0) {
        const actualDiscount = calculateCouponDiscount(coupon, orderPrice, deliveryFee);
        return `${actualDiscount.toLocaleString()}원 할인 (배달비)`;
      } else {
        return `배달비 ${coupon.discount.toLocaleString()}원 할인`;
      }

    case 'general':
    default:
      return `${coupon.discount.toLocaleString()}원 할인`;
  }
}

/**
 * 쿠폰 유효성 검사 (최소 주문 금액 등)
 * @param {Object} coupon - 쿠폰 객체
 * @param {number} orderPrice - 주문 금액
 * @returns {Object} 유효성 검사 결과
 */
export function validateCoupon(coupon, orderPrice = 0) {
  if (!coupon) {
    return { isValid: false, reason: '쿠폰이 없습니다.' };
  }

  // 사용 여부 확인
  if (coupon.isUsed) {
    return { isValid: false, reason: '이미 사용된 쿠폰입니다.' };
  }

  if (coupon.isExpired) {
    return { isValid: false, reason: '만료된 쿠폰입니다.' };
  }

  // 유효기간 확인
  if (coupon.validDate) {
    const validDate = new Date(coupon.validDate);
    const now = new Date();
    if (now > validDate) {
      return { isValid: false, reason: '유효기간이 만료되었습니다.' };
    }
  }

  // 최소 주문 금액 확인
  if (coupon.minOrderAmount && orderPrice < coupon.minOrderAmount) {
    return { 
      isValid: false, 
      reason: `최소 주문 금액 ${coupon.minOrderAmount.toLocaleString()}원 이상이어야 합니다.` 
    };
  }

  return { isValid: true, reason: null };
}

/**
 * 중복 적용 가능한 쿠폰인지 확인
 * @param {Object} coupon - 쿠폰 객체
 * @returns {boolean} 중복 적용 가능 여부
 */
export function isCouponStackable(coupon) {
  return coupon && coupon.isStackable === true;
} 
