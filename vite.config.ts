import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  optimizeDeps: {
    include: ['tradly'],
  },
  build: {
    rollupOptions: {
      // Tradly SDK uses internal @tradly/* sub-packages that aren't bundled.
      // Externalise them so Rollup doesn't try to resolve them at build time.
      external: (id) => id.startsWith('@tradly/'),
    },
  },
})
