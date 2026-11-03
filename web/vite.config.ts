/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Challenge content (READMEs, assets, starter files) is imported from the repo root,
// so the dev server must be allowed to read outside of web/.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  server: {
    fs: { allow: ['..'] },
    watch: { usePolling: process.env.CHOKIDAR_USEPOLLING === 'true' },
  },
  // The challenge workspace chunk (CodeMirror, sucrase, markdown) is large but lazy-loaded.
  build: { chunkSizeWarningLimit: 1500 },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
