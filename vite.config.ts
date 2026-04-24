import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  root: '.',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer'
    },
  },
  server: {
    host: 'localhost',
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase dans son propre chunk
          if (id.includes('node_modules/firebase')) return 'firebase';
          // Supabase dans son propre chunk
          if (id.includes('node_modules/@supabase')) return 'supabase';
          // Stripe dans son propre chunk
          if (id.includes('node_modules/@stripe') || id.includes('node_modules/stripe')) return 'stripe';
          // React + React-DOM ensemble (petits, toujours nécessaires)
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react';
        }
      }
    }
  },
  define: {
    global: 'globalThis',
  }
});
