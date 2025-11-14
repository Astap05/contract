import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/contract/', // Важно: путь должен совпадать с именем репозитория
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})

