import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'gh-pages' ? '/Practice_TrueMachine_2_Payment-Calendar/' : '/',
  define: mode === 'gh-pages' ? {
    'process.env.NODE_ENV': JSON.stringify('development'),
  } : undefined,
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
}))
