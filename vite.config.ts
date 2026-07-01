import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const isGithubPages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  plugins: [react()],

  // Chrome Extension uses relative paths
  // GitHub Pages uses repository path
  base: isGithubPages ? '/EcoCart/' : './',

  build: {
    outDir: 'dist',
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})