import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * 部署前缀。
 *
 * 展示平台把作品挂在子路径下（https://demo.tom-thu.cn/copilot/），
 * 此时必须用 VITE_BASE=/copilot/ 构建，否则产物里的 /assets/xxx.js
 * 会指向站点根路径，上传后整站白屏。
 *
 * 本地开发与根路径部署保持默认 '/'，行为不变。
 *   本地开发：npm run dev
 *   平台构建：VITE_BASE=/copilot/ npm run build
 */
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
