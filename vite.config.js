// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Configuración para despliegue en la raíz del dominio
  // PDF.js needs an ESM worker. ?worker&url emits a hashed .js URL, which Apache
  // serves as JavaScript even on hosts that have no default .mjs MIME mapping.
  worker: { format: 'es' },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
});
