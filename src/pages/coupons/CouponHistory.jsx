import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Tag from '../../components/common/Tag';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AutoScrollTabs from '../../components/stores/AutoScrollTabs';
import styles from './CouponHistory.module.css';

export default function CouponHistory() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [couponHistory, setCouponHistory] = useState([]);

  // Redux에서 쿠폰 데이터 가져오기
  const coupons = useSelector(state => state.coupon.coupons);
  const orders = useSelector(state => state.order.orders);

  useEffect(() => {
    const fetchCouponHistory = async () => {
      try {
        setIsLoading(true);
        
        // 실제 환경에서는 API 호출
        // const response = await couponAPI.getCouponHistory();
        // setCouponHistory(response.data);
        
        // 개발 환경에서는 Mock 데이터 사용
        const generateCouponHistory = () => {
          // Redux 상태 활용하여 더 현실적인 Mock 데이터 생성
          const usedCoupons = [
            {
              id: 'history_1',
              couponId: 'coupon_1',
              couponName: '신규 가입 축하 쿠폰',
              discountType: 'amount',
              discountValue: 3000,
              orderId: 'order_1',
              orderAmount: 25000,
              storeName: '김치찌개 맛집',
              usedAt: '2024-12-18T18:30:00Z',
              status: 'used'
            },
            {
              id: 'history_2',
              couponId: 'coupon_2',
              couponName: '주말 특가 할인',
              discountType: 'percentage',
              discountValue: 15,
              orderId: 'order_2',
              orderAmount: 18000,
              storeName: '치킨 전문점',
              usedAt: '2024-12-17T19:45:00Z',
              status: 'used'
            },
            {
              id: 'history_3',
              couponId: 'coupon_3',
              couponName: '첫 주문 할인 쿠폰',
              discountType: 'amount',
              discountValue: 5000,
              orderId: null,
              orderAmount: 0,
              storeName: null,
              usedAt: null,
              expiredAt: '2024-12-15T23:59:59Z',
              status: 'expired'
            },
            {
              id: 'history_4',
              couponId: 'coupon_4',
              couponName: '생일 축하 쿠폰',
              discountType: 'percentage',
              discountValue: 20,
              orderId: 'order_3',
              orderAmount: 32000,
              storeName: '피자 맛집',
              usedAt: '2024-12-16T20:15:00Z',
              status: 'used'
            }
          ];

          setCouponHistory(usedCoupons);
          setIsLoading(false);
        };
        
        setTimeout(generateCouponHistory, 1000);
      } catch (error) {
        console.error('쿠폰 히스토리 로딩 실패:', error);
        setIsLoading(false);
        // 에러 상태 처리
      }
    };
    
    fetchCouponHistory();
  }, [coupons, orders]);

  const filterTabs = [
    { id: 'all', label: '전체', count: couponHistory.length },
    { id: 'used', label: '사용완료', count: couponHistory.filter(h => h.status === 'used').length },
    { id: 'expired', label: '기간만료', count: couponHistory.filter(h => h.status === 'expired').length }
  ];

  const filteredHistory = couponHistory.filter(item => {
    if (selectedTab === 'all') return true;
    return item.status === selectedTab;
  });

  const calculateSavedAmount = (item) => {
    if (item.discountType === 'amount') {
      return item.discountValue;
    } else if (item.discountType === 'percentage') {
      return Math.floor(item.orderAmount * (item.discountValue / 100));
    }
    return 0;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGoToOrder = (orderId) => {
    if (orderId) {
      navigate(`/orders/${orderId}`);
    }
  };

  const handleGoToCoupons = () => {
    navigate('/coupons');
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Header title="쿠폰 사용내역" />
        <div className={styles.loadingContainer}>
          <LoadingSpinner message="쿠폰 사용내역을 불러오는 중..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header title="쿠폰 사용내역" />
      
      <div className={styles.content}>
        {/* 필터 탭 */}
        <div className={styles.tabContainer}>
          <AutoScrollTabs
            tabs={filterTabs}
            activeTab={selectedTab}
            onTabChange={setSelectedTab}
          />
        </div>

        {/* 통계 정보 */}
        <Card className={styles.statsCard}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {couponHistory.filter(h => h.status === 'used').length}
              </span>
              <span className={styles.statLabel}>사용한 쿠폰</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {couponHistory
                  .filter(h => h.status === 'used')
                  .reduce((total, item) => total + calculateSavedAmount(item), 0)
                  .toLocaleString()}원
              </span>
              <span className={styles.statLabel}>총 절약 금액</span>
            </div>
          </div>
        </Card>

        {/* 쿠폰 내역 리스트 */}
        {filteredHistory.length === 0 ? (
          <EmptyState
            icon="🎫"
            title="쿠폰 사용내역이 없습니다"
            description={
              selectedTab === 'all' 
                ? "아직 사용한 쿠폰이 없습니다.\n쿠폰함에서 사용 가능한 쿠폰을 확인해보세요."
                : selectedTab === 'used'
                ? "사용한 쿠폰이 없습니다."
                : "만료된 쿠폰이 없습니다."
            }
            actionText="쿠폰함 보기"
            onAction={handleGoToCoupons}
          />
        ) : (
          <div className={styles.historyList}>
            {filteredHistory.map((item) => (
              <Card key={item.id} className={styles.historyCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.couponInfo}>
                    <h3 className={styles.couponName}>{item.couponName}</h3>
                    <div className={styles.discountInfo}>
                      {item.discountType === 'amount' ? (
                        <span className={styles.discountAmount}>
                          {item.discountValue.toLocaleString()}원 할인
                        </span>
                      ) : (
                        <span className={styles.discountAmount}>
                          {item.discountValue}% 할인
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Tag 
                    variant={item.status === 'used' ? 'success' : 'danger'}
                    size="small"
                  >
                    {item.status === 'used' ? '사용완료' : '기간만료'}
                  </Tag>
                </div>

                <div className={styles.cardBody}>
                  {item.status === 'used' ? (
                    <>
                      <div className={styles.orderInfo}>
                        <div className={styles.orderRow}>
                          <span className={styles.label}>매장명</span>
                          <span className={styles.value}>{item.storeName}</span>
                        </div>
                        <div className={styles.orderRow}>
                          <span className={styles.label}>주문 금액</span>
                          <span className={styles.value}>
                            {item.orderAmount.toLocaleString()}원
                          </span>
                        </div>
                        <div className={styles.orderRow}>
                          <span className={styles.label}>할인 금액</span>
                          <span className={styles.discountValue}>
                            -{calculateSavedAmount(item).toLocaleString()}원
                          </span>
                        </div>
                        <div className={styles.orderRow}>
                          <span className={styles.label}>사용 날짜</span>
                          <span className={styles.value}>
                            {formatDate(item.usedAt)}
                          </span>
                        </div>
                      </div>
                      
                      {item.orderId && (
                        <button
                          className={styles.orderButton}
                          onClick={() => handleGoToOrder(item.orderId)}
                        >
                          주문 상세보기
                        </button>
                      )}
                    </>
                  ) : (
                    <div className={styles.expiredInfo}>
                      <div className={styles.expiredRow}>
                        <span className={styles.label}>만료 날짜</span>
                        <span className={styles.value}>
                          {formatDate(item.expiredAt)}
                        </span>
                      </div>
                      <p className={styles.expiredMessage}>
                        이 쿠폰은 사용 기간이 만료되었습니다.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
