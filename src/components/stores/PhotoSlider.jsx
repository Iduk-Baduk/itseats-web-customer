import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import OptimizedImage from '../common/OptimizedImage';
import 'swiper/css';
import 'swiper/css/pagination';

import { Pagination } from 'swiper/modules';

export default function PhotoSlider({ images = ["/samples/banner.jpg"] }) {
  const [currentIndex, setCurrentIndex] = useState(1);

  return (
    <div style={{ position: 'relative', width: '100%', height: '280px' }}>
      <Swiper
        modules={[Pagination]}
        pagination={{ clickable: true }}
        spaceBetween={10}
        slidesPerView={1}
        onSlideChange={(swiper) => setCurrentIndex(swiper.realIndex + 1)}
        style={{ width: '100%', height: '100%' }}
      >
        {images.map((src, index) => (
          <SwiperSlide key={index}>
            <OptimizedImage
              src={src}
              alt={`매장 이미지 ${index + 1}`}
              priority={index === 0} // 첫 번째 이미지만 우선 로딩
              width={400}
              height={280}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 페이지 인디케이터 */}
      <div
        style={{
          position: 'absolute',
          bottom: '72px',
          left: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          zIndex: 900,
        }}
      >
        {currentIndex} / {images.length}
      </div>
    </div>
  );
}