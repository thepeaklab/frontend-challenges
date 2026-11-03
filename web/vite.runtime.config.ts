import { defineConfig } from 'vite'

// Builds React as a self-contained script that the preview iframe loads for
// React challenges. Output lands in public/ so it is served statically.
export default defineConfig({
  publicDir: false,
  define: { 'process.env.NODE_ENV': JSON.stringify('development') },
  build: {
    outDir: 'public/runtime',
    emptyOutDir: true,
    minify: true,
    lib: {
      entry: 'src/runtime/react-runtime.ts',
      formats: ['iife'],
      name: 'FcReactRuntime',
      fileName: () => 'react-runtime.js',
    },
  },
})
