import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('/node_modules/')) {
            if (
              normalized.includes('/react/') ||
              normalized.includes('/react-dom/') ||
              normalized.includes('/react-router-dom/') ||
              normalized.includes('/react-redux/') ||
              normalized.includes('/@reduxjs/')
            ) {
              return 'vendor-react';
            }
            if (normalized.includes('/@stripe/')) {
              return 'vendor-stripe';
            }
            if (normalized.includes('/firebase/')) {
              return 'vendor-firebase';
            }
            if (normalized.includes('/lucide-react/') || normalized.includes('/react-icons/')) {
              return 'vendor-icons';
            }
            if (
              normalized.includes('/swiper/') ||
              normalized.includes('/framer-motion/') ||
              normalized.includes('/react-easy-crop/') ||
              normalized.includes('/react-toastify/')
            ) {
              return 'vendor-ui';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}))
