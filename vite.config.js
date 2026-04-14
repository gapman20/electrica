import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: false
    },
    proxy: {
      '/api/tcgdex': {
        target: 'https://api.tcgdex.net/v2/en',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/tcgdex/', '/')
      }
    }
  }
})
