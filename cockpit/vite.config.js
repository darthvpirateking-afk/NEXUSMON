import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  base: '/cockpit/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-Forwarded-For', '127.0.0.1');
          });
          proxy.on('proxyRes', (proxyRes) => {
            // Disable buffering for SSE
            if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
              proxyRes.headers['x-accel-buffering'] = 'no';
            }
          });
        },
      },
      '/v1/canonical': {
        target: 'http://localhost:8000',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/v1': {
        target: 'http://localhost:8000',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
