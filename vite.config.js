import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'deck-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/deck' || req.url === '/deck/') {
            req.url = '/deck/index.html'
          }
          next()
        })
      }
    }
  ],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    sourcemap: false, // Desactiva generación de source maps en producción para proteger el código fuente
    minify: true,
    chunkSizeWarningLimit: 1600,
  },
})
