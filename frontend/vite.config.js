import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // In development, forward /api requests to the local Express server
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
