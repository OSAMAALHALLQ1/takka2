import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Trigger deployment run
export default defineConfig({
  base: './',
  plugins: [react()],
})
