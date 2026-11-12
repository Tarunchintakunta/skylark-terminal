import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Two app pages; /order and /404 are static files in public/.
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    target: 'es2022',
    rollupOptions: { input: { index: resolve(import.meta.dirname, 'index.html'), quote: resolve(import.meta.dirname, 'quote.html') } },
  },
  server: { port: 5174 },
})
