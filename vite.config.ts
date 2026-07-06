import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy vers CANDHIS pour éviter les erreurs CORS en développement
      // En production, mettre en place un vrai reverse proxy (nginx, etc.)
      '/api/candhis': {
        target: 'https://candhis.cerema.fr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/candhis/, ''),
        secure: true,
      },
    },
  },
})
