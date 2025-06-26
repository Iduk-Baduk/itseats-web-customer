import React, { useState, useCallback, useRef, useEffect } from 'react';
import styles from './OptimizedImage.module.css';

// 컴포넌트 외부에서 한 번만 WebP 지원 여부 검사
const checkWebPSupport = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch (error) {
    return false;
  }
};

const WEBP_SUPPORTED = checkWebPSupport();

const OptimizedImage = ({
  src,
  alt = '',
  webpSrc,
  placeholder = '/images/placeholder.png',
  priority = false,
  className = '',
  sizes,
  width,
  height,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // 최적화된 src 결정
  const getOptimizedSrc = useCallback((originalSrc) => {
    if (!originalSrc || hasError) return placeholder;
    
    // WebP 버전이 있고 브라우저가 지원하는 경우
    if (webpSrc && WEBP_SUPPORTED) {
      return webpSrc;
    }
    
    return originalSrc;
  }, [webpSrc, hasError, placeholder]);

  // Intersection Observer 설정
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    observerRef.current = observer;
    observer.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority]);

  // 이미지 로드 핸들러
  const handleLoad = useCallback((e) => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(e);
  }, [onLoad]);

  // 이미지 에러 핸들러
  const handleError = useCallback((e) => {
    setHasError(true);
    setIsLoaded(false);
    onError?.(e);
  }, [onError]);

  const shouldLoadImage = priority || isInView;
  const imageSrc = shouldLoadImage ? getOptimizedSrc(src) : placeholder;

  return (
    <div 
      ref={imgRef}
      className={`${styles.imageContainer} ${className}`}
      style={{ width, height }}
      {...props}
    >
      {shouldLoadImage && (
        <img
          src={imageSrc}
          alt={alt}
          className={`${styles.optimizedImage} ${
            isLoaded ? styles.loaded : styles.loading
          } ${hasError ? styles.error : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {/* 플레이스홀더 (로딩 중이거나 에러 상태) */}
      {(!shouldLoadImage || !isLoaded || hasError) && (
        <div className={styles.placeholder}>
          <div className={styles.placeholderContent}>
            {hasError ? (
              <>
                <span className={styles.errorIcon}>⚠️</span>
                <span className={styles.errorText}>이미지를 불러올 수 없습니다</span>
              </>
            ) : (
              <>
                <span className={styles.placeholderIcon}>📷</span>
                <span className={styles.placeholderText}>이미지 로딩 중...</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 에러 상태 오버레이 */}
      {hasError && (
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>❌</span>
          <span className={styles.errorText}>이미지 로드 실패</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage; 