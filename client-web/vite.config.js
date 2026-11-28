import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Multi-page app: index.html (khách hàng) + driver.html (Cổng tài xế)
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        driver: resolve(import.meta.dirname, 'driver.html'),
      },
    },
  },
})
