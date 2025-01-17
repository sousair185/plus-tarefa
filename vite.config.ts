import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: { extensions: ['.js', '.mjs', '.ts', '.tsx'] },
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
