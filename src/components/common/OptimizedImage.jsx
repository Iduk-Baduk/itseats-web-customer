import React, { useState, useCallback, useRef, useEffect } from 'react';
import styles from './OptimizedImage.module.css';

const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  placeholder = '/samples/favoriteDefault.png',
  webpSrc,
  priority = false,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(priority ? src : placeholder);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer를 사용한 지연 로딩
  useEffect(() => {
    if (priority || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setCurrentSrc(src);
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      },
      {
        rootMargin: '50px', // 이미지가 뷰포트에 50px 앞서 로드
        threshold: 0.1
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, priority]);

  const handleLoad = useCallback((event) => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(event);
  }, [onLoad]);

  const handleError = useCallback((event) => {
    setHasError(true);
    setCurrentSrc(placeholder);
    onError?.(event);
  }, [onError, placeholder]);

  // WebP 지원 확인
  const supportsWebP = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }, []);

  // 최적화된 src 결정
  const getOptimizedSrc = useCallback((originalSrc) => {
    if (!originalSrc || hasError) return placeholder;
    
    // WebP 버전이 있고 브라우저가 지원하는 경우
    if (webpSrc && supportsWebP()) {
      return webpSrc;
    }
    
    return originalSrc;
  }, [webpSrc, hasError, placeholder, supportsWebP]);

  const imageClasses = [
    styles.optimizedImage,
    isLoaded ? styles.loaded : styles.loading,
    hasError ? styles.error : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.imageContainer} style={{ width, height }}>
      {/* WebP를 지원하는 브라우저용 */}
      {webpSrc && (
        <picture>
          <source srcSet={webpSrc} type="image/webp" />
          <img
            ref={imgRef}
            src={getOptimizedSrc(currentSrc)}
            alt={alt}
            className={imageClasses}
            loading={loading}
            width={width}
            height={height}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        </picture>
      )}
      
      {/* WebP 버전이 없는 경우 일반 img 태그 */}
      {!webpSrc && (
        <img
          ref={imgRef}
          src={getOptimizedSrc(currentSrc)}
          alt={alt}
          className={imageClasses}
          loading={loading}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      
      {/* 로딩 중 플레이스홀더 */}
      {!isLoaded && !hasError && (
        <div className={styles.placeholder}>
          <div className={styles.placeholderContent}>
            <div className={styles.placeholderIcon}>📷</div>
            <span className={styles.placeholderText}>이미지 로딩중...</span>
          </div>
        </div>
      )}
      
      {/* 에러 상태 */}
      {hasError && (
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>❌</div>
          <span className={styles.errorText}>이미지를 불러올 수 없습니다</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage; 