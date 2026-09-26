/**
 * server/src/controllers/playerController.js
 * Realm of Kingdoms — Authoritative Player Progression Controller
 * WizzarDev Studios
 */

import { supabase } from '../config/supabase.js'

export const getPlayerProfile = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('kingdom_saves')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      return res.status(500).json({ success: false, error: error.message })
    }

    if (!data) {
      return res.status(404).json({ success: false, message: 'Player save not found' })
    }

    return res.status(200).json({ success: true, profile: data })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}

export const syncPlayerProgression = async (req, res) => {
  try {
    const {
      id,
      player_email,
      player_name,
      kingdom_name,
      kingdom_level,
      trophies,
      military_power,
      avatar,
      game_state,
    } = req.body

    if (!id) {
      return res.status(400).json({ success: false, error: 'Player ID is required' })
    }

    const payload = {
      id,
      player_email: player_email || null,
      player_name: player_name || 'Lord King',
      kingdom_name: kingdom_name || 'Reino de las Nubes',
      kingdom_level: Number(kingdom_level) || 1,
      trophies: Number(trophies) || 400,
      military_power: Number(military_power) || 1200,
      avatar: avatar || '/assets/avatars/avatar_king.webp',
      game_state: game_state || {},
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('kingdom_saves')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      return res.status(400).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true, profile: data })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}

export const getLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(50, Number(req.query.limit) || 20)

    const { data, error } = await supabase
      .from('kingdom_saves')
      .select('id, player_name, kingdom_name, kingdom_level, trophies, military_power, avatar')
      .eq('is_bot', false)
      .order('trophies', { ascending: false })
      .limit(limit)

    if (error) {
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true, leaderboard: data || [] })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
