import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { handleGemmaRequest } from './api/gemma';

function gemmaApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'gemma-api-dev-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url === '/api/gemma' || req.url.startsWith('/api/gemma?'))) {
          for (const key of Object.keys(env)) {
            if (!process.env[key] && env[key]) {
              process.env[key] = env[key];
            }
          }
          void handleGemmaRequest(req, res);
        } else {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url === '/api/gemma' || req.url.startsWith('/api/gemma?'))) {
          for (const key of Object.keys(env)) {
            if (!process.env[key] && env[key]) {
              process.env[key] = env[key];
            }
          }
          void handleGemmaRequest(req, res);
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), gemmaApiPlugin(env)],
  };
});
