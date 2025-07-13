import React from 'react';
import styles from '../../../pages/orders/Cart.module.css';

export default function CartDeliveryOptionSection({ selected, onChange, deliveryInfo, isLoading }) {
  // 백엔드에서 받은 배달 정보를 기반으로 배달 옵션 생성
  const generateDeliveryOptions = (deliveryInfo) => {
    if (!deliveryInfo) {
      // 배달 정보가 없을 때 기본 옵션
      return [
        {
          label: '무료배달',
          description: '33~48분',
          price: 0,
          benefit: '무료',
          wow: true,
        },
        {
          label: '한집배달',
          description: '31~41분',
          price: 1000,
          benefit: '+1,000원',
          wow: false,
        },
      ];
    }

    const options = [];

    // 기본 배달 옵션 (DEFAULT)
    if (deliveryInfo.defaultTimeMin !== undefined && deliveryInfo.defaultTimeMax !== undefined) {
      options.push({
        label: '무료배달',
        description: `${deliveryInfo.defaultTimeMin}~${deliveryInfo.defaultTimeMax}분`,
        price: deliveryInfo.defaultFee || 0,
        benefit: deliveryInfo.defaultFee === 0 ? '무료' : `+${deliveryInfo.defaultFee?.toLocaleString()}원`,
        wow: deliveryInfo.defaultFee === 0,
        type: 'DEFAULT'
      });
    }

    // 한집 배달 옵션 (ONLY_ONE)
    if (deliveryInfo.onlyOneTimeMin !== undefined && deliveryInfo.onlyOneTimeMax !== undefined) {
      options.push({
        label: '한집배달',
        description: `${deliveryInfo.onlyOneTimeMin}~${deliveryInfo.onlyOneTimeMax}분`,
        price: deliveryInfo.onlyOneFee || 0,
        benefit: deliveryInfo.onlyOneFee === 0 ? '무료' : `+${deliveryInfo.onlyOneFee?.toLocaleString()}원`,
        wow: false,
        type: 'ONLY_ONE'
      });
    }

    // 옵션이 없으면 기본값 반환
    return options.length > 0 ? options : [
      {
        label: '무료배달',
        description: '33~48분',
        price: 0,
        benefit: '무료',
        wow: true,
      },
      {
        label: '한집배달',
        description: '31~41분',
        price: 1000,
        benefit: '+1,000원',
        wow: false,
      },
    ];
  };

  const deliveryOptions = generateDeliveryOptions(deliveryInfo);

  return (
    <section className={styles.section}>
      <div className={styles.paymentSectionTitle}>배달 옵션</div>
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingText}>배달 정보를 가져오는 중...</div>
        </div>
      ) : (
        <>
          <div className={styles.radioButtonContainer}>
            {deliveryOptions.map((opt) => (
              <label
                key={opt.label}
                className={`${styles.deliveryOption} ${selected.label === opt.label ? styles.selected : ''}`}
              >
                <input
                  type="radio"
                  name="deliveryOption"
                  checked={selected.label === opt.label}
                  onChange={() => onChange(opt)}
                  className={styles.deliveryOptionInput}
                />
                <div className={styles.deliveryOptionContent}>
                  <div className={styles.deliveryOptionLabel}>{opt.label}</div>
                  <div className={styles.deliveryOptionDescription}>{opt.description}</div>
                </div>
                <div className={`${styles.deliveryOptionPrice} ${opt.price === 0 ? styles.free : ''}`}>
                  {opt.price === 0 ? '무료' : `+${opt.price.toLocaleString()}원`}
                </div>
              </label>
            ))}
          </div>
          <div className={styles.deliveryOptionInfo}>
            무료배달은 가까운 주문과 함께 배달될 수 있어요
          </div>
        </>
      )}
    </section>
  );
} 
