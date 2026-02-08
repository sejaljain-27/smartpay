import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

  ],
  server: {
    port: 5173,
    strictPort: true, // This will crash if 5173 is busy, rather than switching to 5174
     allowedHosts: [
      "inez-forgetful-angie.ngrok-free.dev"
    ]
  },
})
