import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // esbuild is the fastest minifier (default in Vite, but explicit is clear)
    minify: 'esbuild',
    // No sourcemaps in production — saves ~40% bundle size
    sourcemap: false,
    // Warn when any individual chunk exceeds 500 kB
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Split heavy vendor libs into separate long-cached chunks.
        // App code changes don't bust the vendor cache.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            if (id.includes('socket.io-client') || id.includes('engine.io-client')) {
              return 'socket-vendor';
            }
            if (id.includes('zustand')) {
              return 'zustand-vendor';
            }
            return 'vendor'; // Catch-all for other external dependencies
          }
        },
      },
    },
  },

  // Speed up local dev by pre-bundling heavy deps
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'zustand', '@tanstack/react-query', 'framer-motion'],
  },

  // proxy /api requests to the backend during local development so that
  // the browser treats them as same‑site.  this avoids the dreaded
  // SameSite=lax cookie restriction which blocks POST/PUT when frontend
  // and backend are on different ports.
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

