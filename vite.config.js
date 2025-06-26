import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, //로컬 네트워크 접속 허용
    proxy: {
      "/api": {
        target: "http://localhost:3001", // JSON Server 포트
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  },
  build: {
    // 코드 분할 최적화
    rollupOptions: {
      output: {
        manualChunks: {
          // React 관련 라이브러리들을 별도 청크로 분리
          'react-vendor': ['react', 'react-dom'],
          
          // 라우팅 관련 라이브러리들을 별도 청크로 분리
          'router-vendor': ['react-router-dom'],
          
          // Redux 관련 라이브러리들을 별도 청크로 분리
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux', 'redux'],
          
          // 애니메이션 라이브러리를 별도 청크로 분리
          'animation-vendor': ['framer-motion'],
          
          // HTTP 클라이언트를 별도 청크로 분리
          'http-vendor': ['axios'],
          
          // 지도 관련 라이브러리를 별도 청크로 분리
          'map-vendor': ['react-kakao-maps-sdk'],
          
          // Swiper 라이브러리를 별도 청크로 분리
          'swiper-vendor': ['swiper'],
          
          // 유틸리티 라이브러리들을 별도 청크로 분리
          'utils-vendor': ['lodash.isequal']
        },
        // 청크 이름 생성 패턴
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.\w+$/, '') 
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        // 에셋 파일 이름 패턴
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'css/[name]-[hash].css';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    },
    // 청크 사이즈 경고 임계값 설정
    chunkSizeWarningLimit: 1000,
    // 소스맵 생성 (개발 시에만)
    sourcemap: process.env.NODE_ENV === 'development'
  },
  // 최적화 설정
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux'
    ],
    exclude: [
      'framer-motion' // 지연 로딩되므로 사전 번들링에서 제외
    ]
  }
});