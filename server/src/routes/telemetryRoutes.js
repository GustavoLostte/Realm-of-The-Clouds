import { Router } from 'express'
import { ingestTelemetryBatch, getTelemetrySummary } from '../controllers/telemetryController.js'

const router = Router()

// POST /api/telemetry/batch — Receive batch analytics and events
router.post('/batch', ingestTelemetryBatch)

// GET /api/telemetry/summary — Realtime statistics summary
router.get('/summary', getTelemetrySummary)

export default router
