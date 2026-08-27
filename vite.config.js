// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Configuración para despliegue en la raíz del dominio
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
});