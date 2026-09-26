/**
 * server/src/index.js
 * Realm of Kingdoms — Authoritative Backend Entry Point
 * WizzarDev Studios
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import telemetryRoutes from './routes/telemetryRoutes.js'
import gameRoutes from './routes/gameRoutes.js'
import playerRoutes from './routes/playerRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://realm-of-kingdom.vercel.app']

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true)
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true)
      }
      return callback(null, true) // Permissive in dev
    },
    credentials: true,
  })
)

app.use(express.json({ limit: '2mb' }))

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Realm of Kingdoms Authoritative Engine',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; background: #0b0f19; color: #f8fafc; padding: 40px; text-align: center;">
        <h1 style="color: #f59e0b;">👑 Realm of Kingdoms — Authoritative Backend</h1>
        <p style="color: #94a3b8;">Server is live and running authoritative game & telemetry services.</p>
        <div style="margin-top: 20px;">
          <a href="/health" style="color: #38bdf8; text-decoration: none; margin: 0 10px;">[Health Status]</a>
          <a href="/api/telemetry/summary" style="color: #38bdf8; text-decoration: none; margin: 0 10px;">[Telemetry Summary]</a>
          <a href="/api/game/balance-tables" style="color: #38bdf8; text-decoration: none; margin: 0 10px;">[Balance Tables]</a>
        </div>
      </body>
    </html>
  `)
})

// Mount API routes
app.use('/api/telemetry', telemetryRoutes)
app.use('/api/game', gameRoutes)
app.use('/api/player', playerRoutes)

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  👑 =======================================================
  ⚔️ REALM OF KINGDOMS — Authoritative Backend Server
  🛡️ Environment: ${process.env.NODE_ENV || 'development'}
  🚀 Port:        ${PORT}
  📡 URL:         http://localhost:${PORT}
  📊 Health:      http://localhost:${PORT}/health
  📈 Telemetry:   http://localhost:${PORT}/api/telemetry/summary
  =======================================================
  `)
})
