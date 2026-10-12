import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';
import {defineConfig} from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env': {},
      global: 'globalThis',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/solana-rpc': {
          target: 'https://api.devnet.solana.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/solana-rpc/, ''),
          secure: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('@solana')) {
              return 'solana-core';
            }
            if (id.includes('firebase')) {
              return 'firebase-core';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
          },
        },
      },
      chunkSizeWarningLimit: 1200,
    },
  };
});
