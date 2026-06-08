import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Inject app version + env vars available at build time
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },

  // Allow ?raw imports for notes.md files
  assetsInclude: ['**/*.md'],

  build: {
    outDir: '../out/presentation',
    emptyOutDir: true,
    sourcemap: false,
    // ~400 kB gzip warning threshold (three.js + R3F are large)
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // Three.js + React-Three-Fiber — large, rarely changes
          'three-r3f': ['three', '@react-three/fiber', '@react-three/drei'],
          // GSAP — medium, stable
          'gsap':      ['gsap', '@gsap/react'],
          // Shiki — syntax highlighter, lazy-loaded but still a big chunk
          'shiki':     ['shiki'],
          // React + DOM
          'react-vendor': ['react', 'react-dom'],
          // Other UI libs
          'ui-libs':   ['chroma-js', 'lucide-react', 'zustand', 'react-markdown', 'remark-gfm'],
        },
      },
    },
  },

  server: {
    port: 5174,
    strictPort: false,
    // Proxy WS to T3D broker so browser doesn't hit CORS during dev
    // (direct ws:// in the app works fine; this is just for future REST endpoints)
  },

  preview: {
    port: 5175,
  },
})
