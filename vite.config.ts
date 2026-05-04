import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Manual chunks: separa dependencias pesadas para que el bundle inicial
        // sea más pequeño y se cachéen mejor entre deploys.
        manualChunks: {
          'deck-gl': [
            '@deck.gl/core', '@deck.gl/react', '@deck.gl/layers',
            '@deck.gl/aggregation-layers', '@deck.gl/geo-layers',
          ],
          'leaflet': ['react-leaflet', 'leaflet'],
          'charts': ['recharts'],
          'animation': ['framer-motion'],
          'export': ['xlsx', 'docx'],
          'data-fetching': ['@tanstack/react-query'],
        },
      },
    },
  },
});
