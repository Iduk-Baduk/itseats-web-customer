// src/components/common/MainBannerSlider.jsx
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';
import VideoBanner from './VideoBanner';
import OptimizedImage from './OptimizedImage';
import styles from './MainBannerSlider.module.css';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';

const MainBannerSlider = ({ bannerConfig }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.sliderContainer}>
      <Swiper
        modules={[Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        pagination={{
          clickable: true,
        }}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        className={styles.swiper}
      >
        {/* 비디오 배너 */}
        <SwiperSlide>
          {(() => {
            if (bannerConfig?.component === 'VideoBanner') {
              const heightSettings = {
                height: "180px",
                minHeight: "150px",
                maxHeight: "250px"
              };
              return (
                <VideoBanner 
                  {...bannerConfig.props} 
                  {...heightSettings} 
                />
              );
            }
            return null;
          })()}
        </SwiperSlide>

        {/* 쿠폰 페이지 이동 배너 */}
        <SwiperSlide>
            <div 
                className={styles.couponBanner}
                onClick={() => navigate('/coupons')}
            >
                <div className={styles.imageWrapper}>
                <OptimizedImage
                    src="/samples/coupon-page-banner.jpg"
                    alt="사용 가능한 쿠폰 보기"
                    className={styles.bannerImage}
                />
                <div className={styles.bannerOverlay}>
                    <h2>할인 쿠폰 받기</h2>
                    <p>다양한 할인 혜택을 만나보세요</p>
                </div>
                </div>
            </div>
            </SwiperSlide>
      </Swiper>
    </div>
  );
};

export default MainBannerSlider;