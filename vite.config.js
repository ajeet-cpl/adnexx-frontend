import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:8080';

  return {
    plugins: [
      react(),
      {
        name: 'ping-middleware',
        configureServer(server) {
          server.middlewares.use('/api/ping', async (req, res) => {
            const target = proxyTarget.replace(/\/+$/, '');
            const healthUrl = `${target}/api/v1/actuator/health`;
            try {
              const start = Date.now();
              const response = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
              const ms = Date.now() - start;
              const text = await response.text();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ reachable: true, status: response.status, latencyMs: ms, target: healthUrl, body: text.slice(0, 300) }));
            } catch (err) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ reachable: false, target: healthUrl, error: err.message }));
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
      extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx'],
    },
    server: {
      port: 3020,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: proxyTarget.startsWith('https'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
            });
          },
        },
      },
    },
  };
});

