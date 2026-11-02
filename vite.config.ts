import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    target: ['es2018', 'safari12'],
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
          'vendor-xlsx': ['xlsx'],
        }
      }
    }
  }
});