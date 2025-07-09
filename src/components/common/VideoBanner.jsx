import { useRef, useEffect, useState } from 'react';
import styles from './VideoBanner.module.css';

const VideoBanner = ({ 
  src, 
  poster, 
  alt = "배너 동영상",
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
  className = "",
  onVideoClick,
  fallbackImage,
  height = "auto",
  minHeight = "150px",
  maxHeight = "none",
  aspectRatio = "16/9"
}) => {
  const videoRef = useRef(null);
  const [isVideoSupported, setIsVideoSupported] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);

  useEffect(() => {
    // 비디오 지원 여부 확인
    const video = document.createElement('video');
    setIsVideoSupported(!!video.canPlayType);
  }, []);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleVideoError = () => {
    setIsVideoError(true);
    setIsVideoSupported(false);
  };

  const handleVideoClick = () => {
    if (onVideoClick) {
      onVideoClick();
    }
  };

  // 비디오가 지원되지 않거나 에러가 발생한 경우 이미지로 대체
  if (!isVideoSupported || isVideoError) {
    return (
      <div 
        className={`${styles.bannerContainer} ${className}`}
        style={{
          height: height !== "auto" ? height : undefined,
          minHeight: minHeight,
          maxHeight: maxHeight !== "none" ? maxHeight : undefined,
          aspectRatio: height === "auto" ? aspectRatio : undefined
        }}
      >
        <img 
          src={fallbackImage || poster} 
          alt={alt}
          className={styles.fallbackImage}
          onClick={handleVideoClick}
        />
      </div>
    );
  }

  return (
    <div 
      className={`${styles.bannerContainer} ${className}`}
      style={{
        height: height !== "auto" ? height : undefined,
        minHeight: minHeight,
        maxHeight: maxHeight !== "none" ? maxHeight : undefined,
        aspectRatio: height === "auto" ? aspectRatio : undefined
      }}
    >
      <video
        ref={videoRef}
        className={styles.video}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline
        onLoadedData={handleVideoLoad}
        onError={handleVideoError}
        onClick={handleVideoClick}
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        <source src={src} type="video/ogg" />
        {/* 비디오를 지원하지 않는 브라우저를 위한 대체 이미지 */}
        <img src={fallbackImage || poster} alt={alt} />
      </video>
      
      {/* 로딩 중일 때 표시할 스켈레톤 */}
      {!isVideoLoaded && (
        <div className={styles.loadingSkeleton}>
          <div className={styles.skeletonContent}></div>
        </div>
      )}
    </div>
  );
};

export default VideoBanner; 
