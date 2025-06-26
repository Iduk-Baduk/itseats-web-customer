import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // React Fast Refresh 최적화
      fastRefresh: true,
      // JSX Runtime 최적화
      jsxRuntime: 'automatic',
      // Babel 설정 최적화
      babel: {
        plugins: [
          // 개발 환경에서만 React DevTools 지원
          process.env.NODE_ENV === 'development' && 'babel-plugin-react-devtools'
        ].filter(Boolean)
      }
    })
  ],
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
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    
    // CSS 코드 분할 활성화
    cssCodeSplit: true,
    
    // 소스맵 생성 (프로덕션에서는 비활성화)
    sourcemap: process.env.NODE_ENV === 'development',
    
    // 최소화 설정
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        reduce_vars: true,
        unused: true
      },
      mangle: {
        toplevel: true,
        safari10: true
      },
      format: {
        comments: false
      }
    },
    
    // 청크 크기 제한
    chunkSizeWarningLimit: 500,
    
    // 롤업 옵션
    rollupOptions: {
      output: {
        // 더 세분화된 청크 분할
        manualChunks: {
          // React 관련 라이브러리
          'react-vendor': ['react', 'react-dom'],
          
          // React Router
          'router-vendor': ['react-router-dom'],
          
          // Redux 관련
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          
          // 애니메이션 라이브러리
          'animation-vendor': ['framer-motion'],
          
          // 유틸리티 라이브러리
          'utils-vendor': ['lodash', 'date-fns', 'axios'],
          
          // Swiper (있다면)
          'swiper-vendor': ['swiper'],
          
          // 공통 컴포넌트
          'components-common': [
            './src/components/common/Header',
            './src/components/common/NavigationBar',
            './src/components/common/LoadingSpinner',
            './src/components/common/OptimizedImage'
          ]
        },
        
        // 파일명 패턴 최적화
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop() 
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.').pop();
          
          // 이미지 파일들을 폴더별로 분류
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash][extname]`;
          }
          
          // CSS 파일들
          if (extType === 'css') {
            return `css/[name]-[hash][extname]`;
          }
          
          // 폰트 파일들
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash][extname]`;
          }
          
          return `assets/[name]-[hash][extname]`;
        }
      },
      
      // Tree shaking 최적화
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    },
    
    // 실험적 기능들
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') {
          return { js: `/${filename}` };
        }
        return { relative: true };
      }
    }
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
  },
  // 정적 자산 캐싱 설정
  assetsInclude: ['**/*.webp'],
  
  // CSS 전처리기 설정
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: process.env.NODE_ENV === 'production' 
        ? '[hash:base64:5]' 
        : '[name]__[local]__[hash:base64:5]'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/variables.css";`
      }
    },
    postcss: {
      plugins: [
        // 자동으로 vendor prefix 추가
        require('autoprefixer'),
        // CSS 압축 (프로덕션에서만)
        ...(process.env.NODE_ENV === 'production' ? [
          require('cssnano')({
            preset: ['default', {
              discardComments: {
                removeAll: true
              },
              normalizeWhitespace: true,
              minifySelectors: true
            }]
          })
        ] : [])
      ]
    }
  },
  // 개발 서버 최적화
  server: {
    host: true,
    port: 3000,
    open: true,
    cors: true,
    
    // HMR 최적화
    hmr: {
      overlay: true
    },
    
    // 미들웨어 모드
    middlewareMode: false
  },
  
  // 미리보기 서버 설정
  preview: {
    host: true,
    port: 3000,
    cors: true
  },
  
  // 해결 설정
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@utils': '/src/utils',
      '@store': '/src/store',
      '@services': '/src/services',
      '@styles': '/src/styles'
    }
  },
  
  // 환경 변수 설정
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
    __PROD__: process.env.NODE_ENV === 'production'
  },
  
  // ESBuild 설정 (더 빠른 빌드)
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
});