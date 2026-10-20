import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the built index.html loads from file:// inside Electron.
  base: './',
  // Loaded from disk by Electron, so one big bundle is fine.
  build: { chunkSizeWarningLimit: 2500 },
  plugins: [react()],
  // Fixed host/port: `npm run dev` waits on this address before launching Electron.
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
})
