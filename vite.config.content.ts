import { defineConfig } from 'vite'
import { resolve } from 'path'

// Separate build for the content script.
// Chrome content scripts cannot use ES modules (import/export).
// This config builds content.ts as a self-contained IIFE with all
// dependencies inlined into a single file.
export default defineConfig({
  build: {
    emptyOutDir: false, // Don't wipe the dist/ from the popup build
    outDir: 'dist',
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.ts'),
      },
      output: {
        format: 'iife',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
})
