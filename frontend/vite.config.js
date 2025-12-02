import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist"
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://news-mobile-app.zeabur.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api') // 保持 /api 不变
      },
      '/uploads': {
        target: 'http://news-mobile-app.zeabur.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uploads/, '/uploads') // 保持 /uploads 不变
      }
    }
  }
})
