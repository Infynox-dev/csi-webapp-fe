import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const localApi = env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:7000';
    const useLocalApi = env.VITE_USE_LOCAL_API === 'true' || env.VITE_API_BASE_URL?.startsWith('/');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: useLocalApi
          ? {
              // Logos/files: serve from production (local B2 credentials may differ)
              '/api/files': {
                target: 'https://csi-project-be.vercel.app',
                changeOrigin: true,
                secure: true,
              },
              // All other API calls: local backend (same-origin via proxy, no CORS)
              '/api': {
                target: localApi,
                changeOrigin: true,
              },
            }
          : {
              '/api/files': {
                target: 'https://csi-project-be.vercel.app',
                changeOrigin: true,
                secure: true,
              },
            },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        include: ['html2pdf.js'],
      },
      // Emit maps for Urgentry upload in Docker; stripped from the public nginx image after upload.
      build: {
        sourcemap: true,
      },
    };
});
