import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxyHttp = process.env.BACKEND_PROXY_TARGET || 'http://localhost:4001';
const proxyWs = process.env.BACKEND_PROXY_WS_TARGET || 'ws://localhost:4001';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': proxyHttp,
      '/ws': {
        target: proxyWs,
        ws: true
      }
    }
  }
});
