import React from 'react';
import styles from '../../../pages/orders/Cart.module.css';

const DELIVERY_OPTIONS = [
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

export default function CartDeliveryOptionSection({ selected, onChange }) {
  return (
    <section className={styles.section}>
      <div className={styles.paymentSectionTitle}>배달 옵션</div>
      <div className={styles.radioButtonContainer}>
        {DELIVERY_OPTIONS.map((opt) => (
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
    </section>
  );
} 
