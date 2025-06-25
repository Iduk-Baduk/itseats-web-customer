import React, { useState } from 'react';
import styles from '../../../pages/orders/Cart.module.css';

export default function CartRequestSection() {
  const [storeRequest, setStoreRequest] = useState('');
  const [disposableChecked, setDisposableChecked] = useState(false);
  const [deliveryRequest, setDeliveryRequest] = useState('문 앞에 놔주세요 (초인종 O)');

  return (
    <section className={styles.section}>
      <div className={styles.requestSection}>요청사항</div>
      
      {/* 가게 사장님께 */}
      <div className={styles.requestGroup}>
        <label className={styles.requestLabel}>가게 사장님께</label>
        <input
          type="text"
          placeholder="가게 요청사항을 입력해주세요"
          className={styles.requestInput}
          value={storeRequest}
          onChange={e => setStoreRequest(e.target.value)}
        />
      </div>
      
      {/* 일회용 수저/포크 받기 */}
      <div className={styles.checkboxGroup}>
        <input
          type="checkbox"
          checked={disposableChecked}
          onChange={e => setDisposableChecked(e.target.checked)}
          className={styles.checkbox}
        />
        <div>
          <div className={styles.checkboxLabel}>일회용 수저/포크 받기</div>
          <div className={styles.checkboxDescription}>일회용품 사용을 줄이기 위해, 선택 시에만 제공됩니다.</div>
        </div>
      </div>
      
      {/* 배달파트너님께 */}
      <div className={styles.requestGroup}>
        <label className={styles.requestLabel}>배달파트너님께</label>
        <select
          value={deliveryRequest}
          onChange={e => setDeliveryRequest(e.target.value)}
          className={styles.selectInput}
        >
          <option value="문 앞에 놔주세요 (초인종 O)">문 앞에 놔주세요 (초인종 O)</option>
          <option value="직접 받을게요">직접 받을게요</option>
          <option value="전화 후 문 앞에 놔주세요">전화 후 문 앞에 놔주세요</option>
        </select>
        <div className={styles.selectDescription}>
          모든 주문은 배달완료 시 사진을 보내드립니다.
        </div>
      </div>
    </section>
  );
} 
