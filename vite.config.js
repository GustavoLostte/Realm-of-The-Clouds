import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDemo = mode === 'demo' || process.env.VITE_APP_MODE === 'demo'
  const isTeaser = mode === 'teaser' || process.env.VITE_APP_MODE === 'teaser'
  const selectedPublicDir = isDemo ? 'public_demo' : (isTeaser ? 'public_teaser' : 'public')
  return {
    publicDir: selectedPublicDir,
    plugins: [
      react(),
      {
        name: 'scales-dual-screen-sync',
        configureServer(server) {
          let globalScalesCache = null
          let globalOffsetsCache = null
          server.middlewares.use((req, res, next) => {
            const urlPath = req.url ? req.url.split('?')[0] : ''
            if (urlPath === '/api/scales') {
              if (req.method === 'GET') {
                res.setHeader('Content-Type', 'application/json')
                res.setHeader('Access-Control-Allow-Origin', '*')
                res.end(JSON.stringify(globalScalesCache || {}))
                return
              }
              if (req.method === 'POST') {
                let body = ''
                req.on('data', chunk => { body += chunk })
                req.on('end', () => {
                  try {
                    globalScalesCache = JSON.parse(body)
                    // Broadcast directly to all clients (Tauri Desktop Launcher & Browser Tabs)
                    server.ws.send({
                      type: 'custom',
                      event: 'toc:scales_sync',
                      data: globalScalesCache,
                    })
                  } catch (e) {}
                  res.setHeader('Content-Type', 'application/json')
                  res.setHeader('Access-Control-Allow-Origin', '*')
                  res.end(JSON.stringify({ ok: true }))
                })
                return
              }
            }
            if (urlPath === '/api/offsets') {
              if (req.method === 'GET') {
                res.setHeader('Content-Type', 'application/json')
                res.setHeader('Access-Control-Allow-Origin', '*')
                res.end(JSON.stringify(globalOffsetsCache || {}))
                return
              }
              if (req.method === 'POST') {
                let body = ''
                req.on('data', chunk => { body += chunk })
                req.on('end', () => {
                  try {
                    globalOffsetsCache = JSON.parse(body)
                    // Broadcast offsets directly to all clients (Tauri Desktop Launcher & Browser Tabs)
                    server.ws.send({
                      type: 'custom',
                      event: 'toc:offsets_sync',
                      data: globalOffsetsCache,
                    })
                  } catch (e) {}
                  res.setHeader('Content-Type', 'application/json')
                  res.setHeader('Access-Control-Allow-Origin', '*')
                  res.end(JSON.stringify({ ok: true }))
                })
                return
              }
            }
            next()
          })
        }
      },
      {
        name: 'html-routes-fallback',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const urlPath = req.url ? req.url.split('?')[0] : ''
            if (urlPath === '/deck' || urlPath === '/deck/') {
              req.url = '/deck/index.html'
            } else if (urlPath === '/pitch' || urlPath === '/pitch/') {
              req.url = '/pitch.html'
            } else if (urlPath === '/inversion' || urlPath === '/inversion/') {
              req.url = '/pitch.html'
            } else if (urlPath === '/privacy' || urlPath === '/privacy/') {
              req.url = '/privacy.html'
            } else if (urlPath === '/terms' || urlPath === '/terms/') {
              req.url = '/terms.html'
            }
            next()
          })
        }
      }
    ],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    clearScreen: false,
    server: {
      port: 5173,
      strictPort: true,
      host: true,
    },
    build: {
      sourcemap: false, // Desactiva generación de source maps en producción para proteger el código fuente
      minify: true,
      chunkSizeWarningLimit: 1600,
    },
  }
})
