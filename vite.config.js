import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '', '')
  const apiKey = env.VITE_POKEWALLET_API_KEY

  return {
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
        },
        '/api/pokewallet': {
          target: 'https://api.pokewallet.io',
          changeOrigin: true,
          rewrite: (path) => path.replace('/api/pokewallet', ''),
          onProxyReq(proxyReq) {
            if (apiKey) {
              proxyReq.setHeader('X-API-Key', apiKey)
            }
          }
        },
      }
    }
  }
})
