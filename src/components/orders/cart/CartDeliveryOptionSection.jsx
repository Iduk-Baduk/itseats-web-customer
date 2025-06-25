import React, { useState } from 'react';
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

export default function CartDeliveryOptionSection() {
  const [selected, setSelected] = useState(DELIVERY_OPTIONS[0].label);

  return (
    <section className={styles.section}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>배달 옵션</div>
      <div className={styles.radioButtonContainer}>
        {DELIVERY_OPTIONS.map((opt) => (
          <label
            key={opt.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 12,
              border: selected === opt.label ? '2px solid var(--theme-color)' : '1px solid #eee',
              borderRadius: 12,
              padding: 12,
              background: selected === opt.label ? '#f7faff' : '#fff',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="deliveryOption"
              checked={selected === opt.label}
              onChange={() => setSelected(opt.label)}
              style={{ marginRight: 12 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{opt.label}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{opt.description}</div>
            </div>
            <div style={{ minWidth: 48, textAlign: 'right', color: opt.price === 0 ? '#e53935' : '#222', fontWeight: 600 }}>
              {opt.price === 0 ? '무료' : `+${opt.price.toLocaleString()}원`}
            </div>
          </label>
        ))}
      </div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
        무료배달은 가까운 주문과 함께 배달될 수 있어요
      </div>
    </section>
  );
} 
