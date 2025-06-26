import React, { Suspense, lazy } from 'react';
import styles from './SlideInFromRight.module.css';

// Framer Motion을 지연 로딩
const MotionDiv = lazy(() => 
  import('framer-motion').then(module => ({
    default: ({ children, ...props }) => (
      <module.motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        {...props}
      >
        {children}
      </module.motion.div>
    )
  }))
);

// CSS 폴백 컴포넌트
const CSSFallback = ({ children }) => (
  <div className={styles.slideContainer}>
    {children}
  </div>
);

export default function SlideInFromRight({ children }) {
  return (
    <Suspense fallback={<CSSFallback>{children}</CSSFallback>}>
      <MotionDiv>
        {children}
      </MotionDiv>
    </Suspense>
  );
}
