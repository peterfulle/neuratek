import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env, // Esto permite usar variables del entorno
  },
  server: {
    port: 3000, // Cambia si usas otro puerto local
  },
  build: {
    outDir: 'dist',
  },
});
