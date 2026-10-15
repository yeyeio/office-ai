import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /.*\/lucide\/lucideDynamicImports\.mjs$/,
        replacement: path.resolve(__dirname, 'node_modules/lucide-react/dynamicIconImports.js')
      }
    ]
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        taskpane: path.resolve(__dirname, 'taskpane.html')
      }
    }
  }
});
