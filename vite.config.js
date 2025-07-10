import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react({
        // React Fast Refresh 최적화
        fastRefresh: true,
        // JSX Runtime 최적화
        jsxRuntime: 'automatic'
      })
    ],
    
    // 개발 서버 및 프록시 설정을 통합
    server: {
      host: true, // 로컬 네트워크 접속 허용
      open: true,
      cors: true,
      
      // HMR 최적화
      hmr: {
        overlay: true
      },
      
      // 미들웨어 모드
      middlewareMode: false,
      
      // 프록시 설정
      proxy: {
        "/api": {
          target: "http://localhost:3001", // JSON Server 포트
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "")
        }
      }
    },
    
    // esbuild 설정 추가
    esbuild: {
      loader: 'jsx',
      include: /\.[jt]sx?$/,
      exclude: [],
    },
    
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    
    build: {
      target: 'es2015',
      outDir: 'dist',
      assetsDir: 'assets'
    },

    // CSS 전처리기 설정 (기존 설정 유지)
    css: {
      modules: {
        localsConvention: 'camelCase'
      }
    },
  }
});
