import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth/, '/auth'),
      },
      '/api/appointments': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/appointments/, '/appointments'),
      },
      '/api/patients': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/patients/, '/patients'),
      },
      '/api/doctors': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/doctors/, '/api/v1/doctors'),
      },
      '/api/prescriptions': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/prescriptions/, '/api/v1/prescriptions'),
      },
      '/api/notifications': {
        target: 'http://localhost:8084',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/notifications/, '/api/v1/notifications'),
      },
      '/api/payments': {
        target: 'http://localhost:8086',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/payments/, '/api/v1/payments'),
      },
      '/api/telemedicine': {
        target: 'http://localhost:8087',
        changeOrigin: true,
      },
      '/api/ai-symptoms': {
        target: 'http://localhost:8093',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai-symptoms/, '/api/v1/ai-symptoms'),
      },
      '/api/ai': {
        target: 'http://localhost:8092',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai/, '/api/v1/ai'),
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});