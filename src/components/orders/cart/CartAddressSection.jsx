import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAddressRedux from '../../../hooks/useAddressRedux';
import styles from '../../../pages/orders/Cart.module.css';

export default function CartAddressSection() {
  const navigate = useNavigate();
  const { selectedAddress } = useAddressRedux();

  return (
    <div className={styles.addressContainer}>
      <div className={styles.address}>
        {selectedAddress ? (
          <>
            <div className={styles.addressText}>
              {selectedAddress.label} (으)로 배달
            </div>
            <div>{selectedAddress.address}</div>
          </>
        ) : (
          <>
            <div className={styles.addressText} style={{ color: '#ff4444', fontWeight: 'bold' }}>
              ⚠️ 배달받을 주소를 먼저 설정해주세요!
            </div>
            <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
              주소를 설정해야 주문이 가능합니다.
            </div>
          </>
        )}
      </div>
      <div className={styles.addressEdit}>
        <a 
          href="#" 
          onClick={e => {e.preventDefault(); navigate('/address', { state: { from: 'cart' } });}}
          style={!selectedAddress ? { 
            backgroundColor: '#ff4444', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 'bold'
          } : {}}
        >
          {selectedAddress ? '수정' : '주소 설정'}
        </a>
      </div>
    </div>
  );
} 
