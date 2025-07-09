import { useRef, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './VideoBanner.module.css';

const VideoBanner = ({ 
  src, 
  sources,
  poster, 
  alt,
  autoPlay,
  loop,
  muted,
  controls,
  className,
  onVideoClick,
  fallbackImage,
  height,
  minHeight,
  maxHeight,
  aspectRatio,
  ariaLabel,
  onVideoError
}) => {
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleVideoError = (error) => {
    console.error('비디오 로드 실패:', error);
    setIsVideoError(true);
    setIsPlaying(false);
    if (onVideoError) {
      onVideoError(error);
    }
  };

  const handleVideoClick = () => {
    if (onVideoClick) {
      onVideoClick();
    }
  };

  // 안전한 비디오 재생 제어 함수
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (!videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play()
          .then(() => {
            // 재생 성공 시에만 상태 업데이트
            setIsPlaying(true);
          })
          .catch(error => {
            console.error('비디오 재생 실패:', error);
            setIsVideoError(true);
            setIsPlaying(false);
            if (onVideoError) {
              onVideoError(error);
            }
          });
      }
    }
  }, [onVideoError]);

  // 비디오 재생 상태 모니터링
  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  // 비디오 상태 동기화 (안전장치)
  const syncVideoState = useCallback(() => {
    if (videoRef.current) {
      const actualPaused = videoRef.current.paused;
      if (actualPaused !== !isPlaying) {
        setIsPlaying(!actualPaused);
      }
    }
  }, [isPlaying]);

  // 주기적으로 비디오 상태 동기화
  useEffect(() => {
    if (isVideoLoaded && !isVideoError) {
      const interval = setInterval(syncVideoState, 1000);
      return () => clearInterval(interval);
    }
  }, [isVideoLoaded, isVideoError, syncVideoState]);

  // 외부 링크인지 확인하는 함수
  const isExternalLink = () => {
    return onVideoClick && typeof onVideoClick === 'function';
  };

  // 비디오 소스 처리 - 배열 또는 단일 src 지원
  const videoSources = sources || (src ? [{ src, type: 'video/mp4' }] : []);

  // 비디오 에러가 발생한 경우 이미지로 대체
  if (isVideoError) {
    return (
      <div 
        className={`${styles.bannerContainer} ${className}`}
        style={{
          height: height !== "auto" ? height : undefined,
          minHeight: minHeight,
          maxHeight: maxHeight !== "none" ? maxHeight : undefined,
          aspectRatio: height === "auto" ? aspectRatio : undefined
        }}
        role={isExternalLink() ? "button" : undefined}
        tabIndex={isExternalLink() ? 0 : undefined}
        aria-label={isExternalLink() ? ariaLabel : undefined}
        onKeyDown={isExternalLink() ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleVideoClick();
          }
        } : undefined}
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
      role={isExternalLink() ? "button" : undefined}
      tabIndex={isExternalLink() ? 0 : undefined}
      aria-label={isExternalLink() ? ariaLabel : undefined}
      onKeyDown={isExternalLink() ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleVideoClick();
        }
      } : undefined}
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
        onPlay={handlePlay}
        onPause={handlePause}
        onClick={handleVideoClick}
      >
        {videoSources.map((source, index) => (
          <source key={index} src={source.src} type={source.type} />
        ))}
        {/* 비디오를 지원하지 않는 브라우저를 위한 대체 이미지 */}
        <img src={fallbackImage || poster} alt={alt} />
      </video>
      
      {/* 로딩 중일 때 표시할 스켈레톤 */}
      {!isVideoLoaded && !isVideoError && (
        <div className={styles.loadingSkeleton}>
          <div className={styles.skeletonContent}></div>
        </div>
      )}

      {/* 비디오 재생 제어 버튼 */}
      {isVideoLoaded && !isVideoError && !controls && (
        <button
          className={styles.playButton}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          aria-label={isPlaying ? "일시정지" : "재생"}
          type="button"
          disabled={!videoRef.current}
        >
          {isPlaying ? "⏸️" : "▶️"}
        </button>
      )}
    </div>
  );
};

VideoBanner.propTypes = {
  src: function(props, propName, componentName) {
    if (!props.src && !props.sources) {
      return new Error(
        `'${componentName}' requires either 'src' or 'sources' prop to be provided.`
      );
    }
    if (props.src && props.sources) {
      return new Error(
        `'${componentName}' should use either 'src' or 'sources' prop, not both.`
      );
    }
  },
  sources: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired
    })
  ),
  poster: PropTypes.string,
  alt: PropTypes.string,
  autoPlay: PropTypes.bool,
  loop: PropTypes.bool,
  muted: PropTypes.bool,
  controls: PropTypes.bool,
  className: PropTypes.string,
  onVideoClick: PropTypes.func,
  fallbackImage: PropTypes.string,
  height: PropTypes.string,
  minHeight: PropTypes.string,
  maxHeight: PropTypes.string,
  aspectRatio: PropTypes.string,
  ariaLabel: PropTypes.string,
  onVideoError: PropTypes.func
};

VideoBanner.defaultProps = {
  alt: "배너 동영상",
  autoPlay: true,
  loop: true,
  muted: true,
  controls: false,
  className: "",
  height: "auto",
  minHeight: "150px",
  maxHeight: "none",
  aspectRatio: "16/9",
  ariaLabel: "링크로 이동 (새 탭에서 열림)"
};

export default VideoBanner; 
