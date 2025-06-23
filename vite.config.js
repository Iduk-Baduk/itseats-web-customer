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
  }
});