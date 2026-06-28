import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        // vendor chunks separados → cacheáveis e fora do bundle de entrada
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          recharts: ['recharts'],
          icons: ['lucide-react'],
        },
      },
    },
  },
})
