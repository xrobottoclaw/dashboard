import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxyHttp = process.env.BACKEND_PROXY_TARGET || 'http://localhost:4001';
const proxyWs = process.env.BACKEND_PROXY_WS_TARGET || 'ws://localhost:4001';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['localhost', '127.0.0.1', '.tailscale.net', '100.90.28.62', 'claw.taila2b846.ts.net'],
    proxy: {
      '/api': proxyHttp,
      '/ws': {
        target: proxyWs,
        ws: true
      }
    }
  }
});
