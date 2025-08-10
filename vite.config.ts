import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Campus_Resourses_management_System/',
  server: {
    port: 3000,
    strictPort: true, // Don't try other ports if 3000 is in use
    host: true
  }
}) 