// filepath: vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/markdown-media-tracker/',
  build: {
    outDir: 'dist'
  }
})