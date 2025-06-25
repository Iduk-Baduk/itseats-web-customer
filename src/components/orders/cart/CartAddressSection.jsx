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
          <div className={styles.addressText}>
            배달받을 주소를 추가해주세요.
          </div>
        )}
      </div>
      <div className={styles.addressEdit}>
        <a href="#" onClick={e => {e.preventDefault(); navigate('/address');}}>
          {selectedAddress ? '수정' : '주소 추가'}
        </a>
      </div>
    </div>
  );
} 
