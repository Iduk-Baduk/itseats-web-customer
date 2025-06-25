import React, { useState } from 'react';
import styles from '../../../pages/orders/Cart.module.css';

export default function CartRequestSection() {
  const [storeRequest, setStoreRequest] = useState('');
  const [disposableChecked, setDisposableChecked] = useState(false);
  const [deliveryRequest, setDeliveryRequest] = useState('문 앞에 놔주세요 (초인종 O)');

  return (
    <section className={styles.section}>
      <div style={{fontWeight: 700, fontSize: 17, marginBottom: 16}}>요청사항</div>
      {/* 가게 사장님께 */}
      <div style={{marginBottom: 16}}>
        <label style={{fontWeight: 500, fontSize: 15, marginBottom: 6, display: 'block'}}>가게 사장님께</label>
        <input
          type="text"
          placeholder="가게 요청사항을 입력해주세요"
          className={styles.input}
          value={storeRequest}
          onChange={e => setStoreRequest(e.target.value)}
          style={{width: '96%', padding: 12, borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 15}}
        />
      </div>
      {/* 일회용 수저/포크 받기 */}
      <div style={{display: 'flex', alignItems: 'center', marginBottom: 16}}>
        <input
          type="checkbox"
          checked={disposableChecked}
          onChange={e => setDisposableChecked(e.target.checked)}
          style={{width: 20, height: 20, accentColor: '#2196f3', marginRight: 8}}
        />
        <div>
          <div style={{fontWeight: 500, fontSize: 15}}>일회용 수저/포크 받기</div>
          <div style={{fontSize: 13, color: '#888'}}>일회용품 사용을 줄이기 위해, 선택 시에만 제공됩니다.</div>
        </div>
      </div>
      {/* 배달파트너님께 */}
      <div style={{marginBottom: 8}}>
        <label style={{fontWeight: 500, fontSize: 15, marginBottom: 6, display: 'block'}}>배달파트너님께</label>
        <select
          value={deliveryRequest}
          onChange={e => setDeliveryRequest(e.target.value)}
          style={{width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 15}}
        >
          <option value="문 앞에 놔주세요 (초인종 O)">문 앞에 놔주세요 (초인종 O)</option>
          <option value="직접 받을게요">직접 받을게요</option>
          <option value="전화 후 문 앞에 놔주세요">전화 후 문 앞에 놔주세요</option>
        </select>
        <div style={{fontSize: 13, color: '#888', marginTop: 6}}>
          모든 주문은 배달완료 시 사진을 보내드립니다.
        </div>
      </div>
    </section>
  );
} 
