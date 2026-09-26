import { Router } from 'express'
import { resolveKill, getBalanceTables, validateAction } from '../controllers/gameController.js'

const router = Router()

// POST /api/game/kill-enemy — Authoritative enemy kill resolution (EXP, Gold, Drops, Level-up)
router.post('/kill-enemy', resolveKill)

// GET /api/game/balance-tables — Authoritative balance tables
router.get('/balance-tables', getBalanceTables)

// POST /api/game/validate-action — Combat validation anti-cheat
router.post('/validate-action', validateAction)

export default router
