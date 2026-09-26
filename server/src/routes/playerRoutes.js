import { Router } from 'express'
import { getPlayerProfile, syncPlayerProgression, getLeaderboard } from '../controllers/playerController.js'

const router = Router()

// GET /api/player/profile/:id — Fetch player progress
router.get('/profile/:id', getPlayerProfile)

// POST /api/player/sync — Authoritatively persist player progress
router.post('/sync', syncPlayerProgression)

// GET /api/player/leaderboard — Verified player rankings
router.get('/leaderboard', getLeaderboard)

export default router
