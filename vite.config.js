import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This is needed to make OrbitDB work, which uses older NodeJS globals.
  define: {
    global: 'globalThis',
    process: {
      env: {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV)
      }
    }
  }
})
