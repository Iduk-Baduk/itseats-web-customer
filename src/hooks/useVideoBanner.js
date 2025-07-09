import { useState, useRef, useCallback, useEffect } from 'react';

export const useVideoBanner = (options = {}) => {
  const {
    autoPlay = true,
    loop = true,
    muted = true,
    onVideoClick,
    onVideoLoad,
    onVideoError
  } = options;

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 1);

  // 비디오 로드 핸들러
  const handleVideoLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
    if (onVideoLoad) {
      onVideoLoad();
    }
  }, [onVideoLoad]);

  // 비디오 에러 핸들러
  const handleVideoError = useCallback(() => {
    setIsError(true);
    setIsLoaded(false);
    if (onVideoError) {
      onVideoError();
    }
  }, [onVideoError]);

  // 비디오 클릭 핸들러
  const handleVideoClick = useCallback(() => {
    if (onVideoClick) {
      onVideoClick();
    }
  }, [onVideoClick]);

  // 재생/일시정지 토글
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  // 재생 상태 업데이트
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // 시간 업데이트
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  // 메타데이터 로드
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  // 볼륨 변경
  const setVideoVolume = useCallback((newVolume) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  }, []);

  // 특정 시간으로 이동
  const seekTo = useCallback((time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  // 비디오 재시작
  const restart = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
  }, []);

  return {
    videoRef,
    isPlaying,
    isLoaded,
    isError,
    currentTime,
    duration,
    volume,
    handlers: {
      handleVideoLoad,
      handleVideoError,
      handleVideoClick,
      handlePlay,
      handlePause,
      handleTimeUpdate,
      handleLoadedMetadata
    },
    controls: {
      togglePlay,
      setVideoVolume,
      seekTo,
      restart
    }
  };
}; 
