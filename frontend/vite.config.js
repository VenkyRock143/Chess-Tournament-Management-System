// Import the vite tool and the react plugin
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configure Vite:
// - enable React support
// - proxy any /api calls to our backend on port 5000
//   so we don't get CORS issues during development
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});