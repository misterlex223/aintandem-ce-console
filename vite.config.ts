import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  optimizeDeps: {
    exclude: ['@aintandem/sdk-core', '@aintandem/sdk-react']
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // TanStack Query
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query-vendor';
          }
          // Router
          if (id.includes('node_modules/react-router-dom')) {
            return 'router-vendor';
          }
          // ReactFlow (workflow editor - large)
          if (id.includes('node_modules/reactflow') || id.includes('node_modules/react-dnd')) {
            return 'workflow-vendor';
          }
          // Radix UI components
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-vendor';
          }
          // State management
          if (id.includes('node_modules/zustand')) {
            return 'state-vendor';
          }
          // Icons
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor';
          }
          // SDK
          if (id.includes('node_modules/@aintandem/sdk')) {
            return 'sdk-vendor';
          }
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://flexy-orchestrator-3ef9a44e:9902',
        changeOrigin: true
      },
      '/flexy': {
        target: 'http://flexy-orchestrator-3ef9a44e:9902',
        changeOrigin: true,
        ws: true // Enable WebSocket proxying
      },
      '/code-server': {
        target: 'http://flexy-orchestrator-3ef9a44e:9902',
        changeOrigin: true,
        ws: true
      }
    }
  }
});
