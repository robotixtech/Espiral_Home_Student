import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  base: './', 
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Formato IIFE: Aísla tu código Svelte de RequireJS de Moodle
        format: 'iife', 
        name: 'EspiralApp',
        entryFileNames: `bundle.js`,
        chunkFileNames: `bundle.js`,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'temp-project.css';
          }
          return '[name][extname]';
        },
      },
    },
  },
})