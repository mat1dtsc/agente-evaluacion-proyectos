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
    // Sin manualChunks: agrupar a mano obligaba a Rollup a declarar deck.gl y
    // recharts como dependencias del entry, y volvian al modulepreload inicial
    // aunque el mapa y los paneles ya se carguen con lazy(). Dejando que Rollup
    // particione por el grafo real, cada chunk pesado queda detras de su
    // import() y no entra en la carga inicial.
  },
});
