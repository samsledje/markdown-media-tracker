// filepath: vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/markdown-media-tracker/', // Replace with your repo name
  build: {
    outDir: 'dist'
  }
})