// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/react-devtools' // or your framework plugin

export default defineConfig({
  // This matches your repository name exactly
  base: '/hi-hello-buddy-25/',
  
  build: {
    // This handles the large file warning we discussed earlier
    chunkSizeWarningLimit: 1000,
  }
})
