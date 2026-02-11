import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Yeh line add karo — sab /api/... requests backend pe jayengi
      '/api': {
        target: 'http://localhost:5000',     // tumhara backend port
        changeOrigin: true,
        secure: false,
      }
    }
  }
})