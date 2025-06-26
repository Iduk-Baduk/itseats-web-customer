import React, { useEffect, useState, useMemo } from "react";

// 지연 로딩을 위한 Framer Motion import
const loadFramerMotion = () => import("framer-motion");

export default function SlideInFromRight({ children }) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [MotionDiv, setMotionDiv] = useState(null);
  const [isLoadingMotion, setIsLoadingMotion] = useState(true);

  // Framer Motion 지연 로딩
  useEffect(() => {
    let mounted = true;

    const loadMotion = async () => {
      try {
        const { motion } = await loadFramerMotion();
        if (mounted) {
          setMotionDiv(() => motion.div);
          setIsLoadingMotion(false);
        }
      } catch (error) {
        console.warn('Framer Motion 로딩 실패, 기본 애니메이션 사용:', error);
        if (mounted) {
          setIsLoadingMotion(false);
        }
      }
    };

    loadMotion();

    return () => {
      mounted = false;
    };
  }, []);

  // 애니메이션 타이머
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 250);
    return () => clearTimeout(timer);
  }, []);

  // 애니메이션 설정
  const animationProps = useMemo(() => ({
    initial: { x: "100%" },
    animate: { x: 0 },
    transition: { duration: 0.25, ease: "easeInOut" },
    style: {
      backgroundColor: "#ffffff",
      overflow: isAnimating ? "hidden" : "unset",
    }
  }), [isAnimating]);

  // Framer Motion 로딩 중이거나 실패한 경우 기본 CSS 애니메이션 사용
  if (isLoadingMotion || !MotionDiv) {
    return (
      <div 
        style={{
          backgroundColor: "#ffffff",
          overflow: isAnimating ? "hidden" : "unset",
          animation: "slideInFromRight 0.25s ease-in-out",
        }}
      >
        {children}
        <style jsx>{`
          @keyframes slideInFromRight {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // Framer Motion이 로드된 경우
  return (
    <MotionDiv {...animationProps}>
      {children}
    </MotionDiv>
  );
}
