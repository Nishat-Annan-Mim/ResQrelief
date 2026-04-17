import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      //'/donate': 'http://localhost:3001',
      //'/payment': 'http://localhost:3001',
      '/donation': 'http://localhost:3001',
      '/donate/money': 'http://localhost:3001',
      '/donate/supplies': 'http://localhost:3001',
      //'/donation': 'http://localhost:3001',
      //'/my-donations': 'http://localhost:3001', 
      
    }
  }
})
