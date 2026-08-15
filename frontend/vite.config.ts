import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Backend demos (e.g. the MD5 collision generator) only exist on the
      // deployed server, so forward dev-server API calls there too.
      '/api': {
        target: 'https://cryptomaths.org',
        changeOrigin: true,
      },
    },
  },
})
