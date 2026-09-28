/**
 * server/src/controllers/gameController.js
 * Realm of Kingdoms — Authoritative Combat & Game Logic Controller
 * WizzarDev Studios
 */

import { authoritativeEngine, ENEMY_BALANCE_TABLE } from '../engine/authoritativeEngine.js'
import { supabase } from '../config/supabase.js'

export const resolveKill = async (req, res) => {
  try {
    const { enemyType, currentLevel, currentExp, playerId } = req.body

    const result = authoritativeEngine.resolveEnemyKill({
      enemyType,
      currentLevel,
      currentExp,
    })

    // Log metric asynchronously
    supabase
      .from('game_telemetry')
      .insert([
        {
          session_id: 'server_authoritative',
          player_id: playerId || null,
          event_name: 'server_enemy_kill_validated',
          metadata: {
            enemyType,
            expGained: result.expGained,
            goldGained: result.goldGained,
            leveledUp: result.leveledUp,
            newLevel: result.progression.level,
          },
        },
      ])
      .then(() => {})
      .catch(() => {})

    return res.status(200).json({
      success: true,
      ...result,
    })
  } catch (err) {
    console.error('❌ [Game Controller Error]:', err)
    return res.status(500).json({ success: false, error: 'Failed to process authoritative kill' })
  }
}

export const getBalanceTables = (req, res) => {
  return res.status(200).json({
    success: true,
    enemies: ENEMY_BALANCE_TABLE,
    version: '1.0.0-authoritative',
  })
}

export const validateAction = (req, res) => {
  const { playerLevel, reportedDamage } = req.body
  const validation = authoritativeEngine.validateDamage({ playerLevel, reportedDamage })

  if (!validation.valid) {
    return res.status(403).json({
      valid: false,
      flagged: true,
      reason: validation.reason,
    })
  }

  return res.status(200).json({ valid: true })
}
