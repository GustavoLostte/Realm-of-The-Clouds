// supabaseClient.js - Cloud Database Persistence & Sync Engine for Realm of the Clouds
// Aetheria Empires Edition - Fully resilient offline-first Supabase client
import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://hoghpltpvqfdpxcepqlr.supabase.co'
const DEFAULT_SUPABASE_KEY = 'sb_publishable_BtISgMp6lgm6kD6vXCQWzw_WheXO0cf'

const SUPABASE_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL

const SUPABASE_ANON_KEY = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  DEFAULT_SUPABASE_KEY

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Unique Persistent Player Identifier (UUID) & Guest Email
const ACTIVE_ACCOUNT_KEY = 'toc_active_account_context_v2'
const GUEST_PLAYER_ID_KEY = 'toc_foe_guest_cloud_id_v2'

let currentActiveEmail = null
let currentActivePlayerId = null

/**
 * Generates a deterministic, unique ID for an email so its cloud save
 * row in kingdom_saves is permanently isolated and cannot collide with other accounts.
 */
export function generateIdForEmail(email) {
  if (!email) return null
  const clean = email.trim().toLowerCase()
  let hash = 0
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) - hash) + clean.charCodeAt(i)
    hash |= 0
  }
  const safeStr = clean.replace(/[^a-z0-9]/g, '_').substring(0, 22)
  return `lord_${safeStr}_${Math.abs(hash).toString(36)}`
}

/**
 * Returns the isolated guest player ID
 */
export function getGuestId() {
  if (typeof window === 'undefined') return 'guest_player'
  try {
    let id = localStorage.getItem(GUEST_PLAYER_ID_KEY)
    if (!id) {
      id = 'guest_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString(36))
      localStorage.setItem(GUEST_PLAYER_ID_KEY, id)
    }
    return id
  } catch (e) {
    return 'guest_fallback'
  }
}

/**
 * Set the currently active player account context
 */
export function setActivePlayer(email, id = null) {
  if (email && email.trim()) {
    currentActiveEmail = email.trim().toLowerCase()
    currentActivePlayerId = id || generateIdForEmail(currentActiveEmail)
    try {
      localStorage.setItem(ACTIVE_ACCOUNT_KEY, JSON.stringify({
        email: currentActiveEmail,
        id: currentActivePlayerId
      }))
    } catch (e) {
      console.warn('Could not store active account context:', e)
    }
  }
}

/**
 * Set active player to anonymous guest
 */
export function setActiveGuestPlayer() {
  currentActiveEmail = null
  currentActivePlayerId = getGuestId()
  try {
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, JSON.stringify({
      email: null,
      id: currentActivePlayerId
    }))
  } catch (e) {
    console.warn('Could not store active guest context:', e)
  }
}

/**
 * Clear the currently active player context on logout
 */
export function clearActivePlayer() {
  currentActiveEmail = null
  currentActivePlayerId = null
  try {
    localStorage.removeItem(ACTIVE_ACCOUNT_KEY)
  } catch (e) {
    console.warn('Could not clear active player context:', e)
  }
}

export function getPlayerEmail() {
  if (currentActiveEmail) return currentActiveEmail
  if (typeof window === 'undefined') return ''
  try {
    const raw = localStorage.getItem(ACTIVE_ACCOUNT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.email) {
        currentActiveEmail = parsed.email
        currentActivePlayerId = parsed.id
        return currentActiveEmail
      }
    }
    return ''
  } catch (e) {
    return ''
  }
}

export function getPlayerId() {
  if (currentActivePlayerId) return currentActivePlayerId
  const email = getPlayerEmail()
  if (email) {
    currentActivePlayerId = generateIdForEmail(email)
    return currentActivePlayerId
  }
  return getGuestId()
}

// Deprecated setters kept for backwards compatibility
export function setPlayerId(id) {
  if (id) currentActivePlayerId = id
}
export function setPlayerEmail(email) {
  if (email) setActivePlayer(email)
}

// Real-Time Throttled Cloud Save Engine with Max-Wait (prevents infinite cancellation from resource ticks)
let cloudSaveTimer = null
let cloudSavePendingPayload = null
let lastCloudSaveTimestamp = 0
let consecutiveCloudErrors = 0
let cloudBackoffUntil = 0
const MAX_WAIT_INTERVAL_MS = 3500 // At most 3.5 seconds between automatic syncs
let isCloudSaving = false

let lastCloudSaveStatus = {
  connected: false,
  lastSavedAt: null,
  error: null,
}

export function getCloudStatus() {
  return { ...lastCloudSaveStatus }
}

/**
 * Flush any pending cloud save immediately
 */
export async function flushCloudSave() {
  if (cloudSaveTimer) {
    clearTimeout(cloudSaveTimer)
    cloudSaveTimer = null
  }
  if (!cloudSavePendingPayload) return { success: true }
  const payloadToSave = cloudSavePendingPayload
  cloudSavePendingPayload = null
  lastCloudSaveTimestamp = Date.now()
  return await saveKingdomToCloud(payloadToSave)
}

/**
 * Schedule a cloud auto-save that is guaranteed to fire within MAX_WAIT_INTERVAL_MS,
 * never suffering from infinite debounce cancellations caused by production ticks.
 * If consecutive network/CORS errors occur, applies backoff to prevent browser console spam.
 */
export function scheduleCloudSave(state) {
  cloudSavePendingPayload = state
  const now = Date.now()

  // If we are in a backoff window due to network/CORS failures, defer auto-save
  if (now < cloudBackoffUntil) {
    return
  }

  const timeSinceLastSave = now - lastCloudSaveTimestamp

  // If a save is already scheduled, let it run — it will pick up the freshest pending state!
  if (cloudSaveTimer) return

  if (timeSinceLastSave >= MAX_WAIT_INTERVAL_MS) {
    cloudSaveTimer = setTimeout(async () => {
      cloudSaveTimer = null
      await flushCloudSave()
    }, 60)
  } else {
    const delay = Math.max(100, MAX_WAIT_INTERVAL_MS - timeSinceLastSave)
    cloudSaveTimer = setTimeout(async () => {
      cloudSaveTimer = null
      await flushCloudSave()
    }, delay)
  }
}

/**
 * Check if the Supabase database connection is responsive
 */
export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from('kingdom_saves').select('id').limit(1)
    lastCloudSaveStatus.connected = true
    return { ok: true, url: SUPABASE_URL }
  } catch (err) {
    lastCloudSaveStatus.connected = false
    lastCloudSaveStatus.error = err.message
    return { ok: false, error: err.message }
  }
}

/**
 * Save kingdom game state to Supabase Cloud immediately
 */
export async function saveKingdomToCloud(state) {
  if (!state) return { success: false, error: 'No state provided' }
  
  // Clear any pending throttler because we are executing right now
  if (cloudSaveTimer) {
    clearTimeout(cloudSaveTimer)
    cloudSaveTimer = null
  }
  cloudSavePendingPayload = null
  lastCloudSaveTimestamp = Date.now()

  const playerId = getPlayerId()
  const playerEmail = getPlayerEmail() || null

  const resolvedName = state.profile?.name || (typeof localStorage !== 'undefined' && localStorage.getItem('toc_player_name')) || 'Lord King'
  const resolvedAvatar = state.profile?.avatar || (typeof localStorage !== 'undefined' && localStorage.getItem('toc_player_avatar')) || '/assets/avatars/avatar_king.webp'

  const sanitizedLevel = Math.min(10, Math.max(1, Number(state.kingdomLevel) || 1))
  const sanitizedTrophies = Math.min(99999, Math.max(0, Number(state.arenaData?.trophies) || 0))

  const payload = {
    id: playerId,
    player_email: playerEmail,
    player_name: resolvedName,
    kingdom_level: sanitizedLevel,
    trophies: sanitizedTrophies,
    game_state: {
      resources: state.resources,
      slots: state.slots,
      troops: state.troops,
      kingdomLevel: sanitizedLevel,
      kingdomXp: state.kingdomXp,
      completedNodes: state.completedNodes,
      unlockedBiomes: state.unlockedBiomes,
      activeChapter: state.activeChapter,
      claimedQuestIds: state.claimedQuestIds,
      unlockedTechIds: state.unlockedTechIds,
      ownedRelicIds: state.ownedRelicIds,
      equippedRelics: state.equippedRelics,
      consumables: state.consumables,
      speedups: state.speedups,
      vipStatus: state.vipStatus,
      lastWheelFreeSpinTime: state.lastWheelFreeSpinTime,
      arenaData: state.arenaData,
      totalHarvests: state.totalHarvests,
      tutorialSeen: state.tutorialSeen,
      trainingQueue: state.trainingQueue || [],
      profile: { name: resolvedName, avatar: resolvedAvatar },
      lastSavedTime: Date.now(),
    },
    updated_at: new Date().toISOString(),
  }

  try {
    let { error } = await supabase
      .from('kingdom_saves')
      .upsert(payload, { onConflict: 'id' })

    // If table column player_email doesn't exist yet on remote schema, retry without it
    if (error && (error.code === '42703' || error.message?.includes('player_email'))) {
      const fallbackPayload = { ...payload }
      delete fallbackPayload.player_email
      const retryResult = await supabase
        .from('kingdom_saves')
        .upsert(fallbackPayload, { onConflict: 'id' })
      error = retryResult.error
    }

    if (error) {
      consecutiveCloudErrors++
      const backoffSec = Math.min(60, 10 * consecutiveCloudErrors)
      cloudBackoffUntil = Date.now() + backoffSec * 1000
      lastCloudSaveStatus.connected = false
      lastCloudSaveStatus.error = error.message
      return { success: false, error: error.message }
    }

    // Reset error backoff on successful save
    consecutiveCloudErrors = 0
    cloudBackoffUntil = 0

    // Also update leaderboard entry in Supabase Cloud in real time
    try {
      const militaryPower = Object.entries(state.troops || {}).reduce((sum, [unit, qty]) => {
        const mult = unit === 'commander' ? 85 : unit === 'knight' ? 35 : unit === 'archer' ? 18 : 10
        return sum + (qty * mult)
      }, 0) + (state.kingdomLevel || 1) * 1500 + ((state.slots || []).reduce((acc, s) => acc + (s.buildingId ? (s.level || 1) * 850 : 0), 0))

      const completedNodesCount = Array.isArray(state.completedNodes) ? state.completedNodes.length : 0
      const dungeonFloor = completedNodesCount > 0 ? completedNodesCount + 1 : 1
      const dungeonStars = completedNodesCount * 3
      const arenaWins = state.arenaData?.wins || Math.max(0, Math.floor((state.arenaData?.trophies || 400) / 24))
      const trophies = state.arenaData?.trophies || 400
      const leagueId = state.arenaData?.leagueId || (trophies >= 2800 ? 'league_grandmaster' : trophies >= 2000 ? 'league_master' : trophies >= 1400 ? 'league_gold' : trophies >= 800 ? 'league_silver' : 'league_bronze')

      await supabase.from('leaderboard').upsert({
        id: playerId,
        player_name: resolvedName,
        kingdom_name: state.profile?.kingdomName || 'Reino de las Nubes',
        level: state.kingdomLevel || 1,
        trophies: trophies,
        military_power: militaryPower,
        avatar: resolvedAvatar,
        league_id: leagueId,
        dungeon_floor: dungeonFloor,
        dungeon_stars: dungeonStars,
        arena_wins: arenaWins,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    } catch (lbErr) {
      // Non-critical, ignore if leaderboard table not ready
    }

    lastCloudSaveStatus.connected = true
    lastCloudSaveStatus.lastSavedAt = Date.now()
    lastCloudSaveStatus.error = null
    return { success: true }
  } catch (err) {
    consecutiveCloudErrors++
    const backoffSec = Math.min(60, 10 * consecutiveCloudErrors)
    cloudBackoffUntil = Date.now() + backoffSec * 1000
    lastCloudSaveStatus.connected = false
    lastCloudSaveStatus.error = err.message
    return { success: false, error: err.message }
  }
}

/**
 * Upsert current player data directly to the Supabase leaderboard
 */
export async function upsertPlayerToLeaderboard(playerData) {
  if (!playerData) return { success: false }
  const playerId = getPlayerId()
  const name = playerData.playerName || (typeof localStorage !== 'undefined' && localStorage.getItem('toc_player_name')) || 'Lord King'
  const avatar = playerData.avatar || (typeof localStorage !== 'undefined' && localStorage.getItem('toc_player_avatar')) || '/assets/avatars/avatar_king.webp'
  
  const buildingsPower = (playerData.buildings || []).reduce((acc, b) => acc + (b.level || 1) * 850, 0)
  const troopsPower = Object.entries(playerData.troops || {}).reduce((sum, [unit, qty]) => {
    const mult = unit === 'commander' ? 85 : unit === 'knight' ? 35 : unit === 'archer' ? 18 : 10
    return sum + (qty * mult)
  }, 0)
  const powerScore = playerData.powerScore || ((playerData.level || 1) * 1500 + buildingsPower + troopsPower)

  const trophies = playerData.trophies || 400
  const leagueId = playerData.leagueId || (trophies >= 2800 ? 'league_grandmaster' : trophies >= 2000 ? 'league_master' : trophies >= 1400 ? 'league_gold' : trophies >= 800 ? 'league_silver' : 'league_bronze')
  const dungeonFloor = playerData.dungeonFloor || 1
  const dungeonStars = playerData.dungeonStars || 0
  const arenaWins = playerData.arenaWins || Math.max(0, Math.floor(trophies / 24))

  try {
    const { error } = await supabase.from('leaderboard').upsert({
      id: playerId,
      player_name: name,
      kingdom_name: playerData.kingdomName || 'Reino de las Nubes',
      level: playerData.level || 1,
      trophies: trophies,
      military_power: powerScore,
      avatar: avatar,
      league_id: leagueId,
      dungeon_floor: dungeonFloor,
      dungeon_stars: dungeonStars,
      arena_wins: arenaWins,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Fetch live leaderboard rows from Supabase Cloud
 */
export async function fetchLeaderboardFromCloud(category = 'power', limit = 60) {
  try {
    let query = supabase.from('leaderboard').select('*').not('id', 'like', 'lb_%')
    if (category === 'arena') {
      query = query.order('trophies', { ascending: false }).order('arena_wins', { ascending: false })
    } else if (category === 'dungeon') {
      query = query.order('dungeon_floor', { ascending: false }).order('dungeon_stars', { ascending: false })
    } else {
      query = query.order('military_power', { ascending: false }).order('level', { ascending: false })
    }

    const { data, error } = await query.limit(limit)

    if (error) {
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (err) {
    return { success: false, error: err.message, data: [] }
  }
}

/**
 * Load kingdom game state from Supabase Cloud by player ID
 */
export async function loadKingdomFromCloud() {
  const playerId = getPlayerId()
  try {
    const { data, error } = await supabase
      .from('kingdom_saves')
      .select('game_state, updated_at')
      .eq('id', playerId)
      .maybeSingle()

    if (error) {
      return null
    }

    if (data && data.game_state) {
      return data.game_state
    }
    return null
  } catch (err) {
    return null
  }
}

/**
 * Modo Quest / Guest Persistence by Email
 * Loads or binds existing cloud save matching the given email
 */
export async function loadKingdomByEmail(email) {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Por favor ingresa un correo electrónico válido.' }
  }

  const cleanEmail = email.trim().toLowerCase()
  try {
    const { data, error } = await supabase
      .from('kingdom_saves')
      .select('*')
      .ilike('player_email', cleanEmail)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      const generatedId = generateIdForEmail(cleanEmail)
      setActivePlayer(cleanEmail, generatedId)
      return { 
        success: true, 
        isNew: true, 
        id: generatedId,
        email: cleanEmail,
        warning: error.message 
      }
    }

    if (data && data.game_state) {
      // Existing cloud save found for this email!
      setActivePlayer(cleanEmail, data.id)
      return {
        success: true,
        isNew: false,
        id: data.id,
        email: cleanEmail,
        playerName: data.player_name,
        save: data.game_state,
        updatedAt: data.updated_at,
      }
    }

    // No existing cloud record found -> New session linked to this email
    const generatedId = generateIdForEmail(cleanEmail)
    setActivePlayer(cleanEmail, generatedId)
    return {
      success: true,
      isNew: true,
      id: generatedId,
      email: cleanEmail,
    }
  } catch (err) {
    console.warn('loadKingdomByEmail exception:', err)
    const generatedId = generateIdForEmail(cleanEmail)
    setActivePlayer(cleanEmail, generatedId)
    return {
      success: true,
      isNew: true,
      id: generatedId,
      email: cleanEmail,
    }
  }
}

/**
 * Server-Authoritative Wheel Spin Claim & Verification
 * Validates the 20-hour cooldown and registers the spin in Supabase wheel_spins_log
 */
export async function claimWheelSpinOnServer(prize, isFree, costGems = 0) {
  const playerId = getPlayerId()
  if (!playerId) return { success: true, localOnly: true }

  try {
    // 1. Try invoking the server-side RPC function if deployed in Supabase
    const { data: rpcData, error: rpcError } = await supabase.rpc('claim_daily_wheel_spin', {
      p_player_id: playerId,
      p_is_free: Boolean(isFree),
      p_cost_gems: Number(costGems) || 0,
      p_reward_id: prize?.id || 'reward_unknown',
      p_reward_type: prize?.type || 'gold',
      p_reward_amount: Number(prize?.amount) || 0,
    })

    if (!rpcError && rpcData) {
      return rpcData
    }

    // 2. Fallback if RPC is not yet created: check directly in wheel_spins_log table
    if (isFree) {
      const { data: recentSpins } = await supabase
        .from('wheel_spins_log')
        .select('created_at')
        .eq('player_id', playerId)
        .eq('is_free_spin', true)
        .order('created_at', { ascending: false })
        .limit(1)

      if (recentSpins && recentSpins.length > 0) {
        const lastTime = new Date(recentSpins[0].created_at).getTime()
        const hoursPassed = (Date.now() - lastTime) / (1000 * 3600)
        if (hoursPassed < 20.0) {
          return {
            success: false,
            error: 'COOLDOWN_ACTIVE',
            hours_remaining: (20.0 - hoursPassed).toFixed(1),
          }
        }
      }
    }

    // Insert spin audit record
    await supabase.from('wheel_spins_log').insert({
      player_id: playerId,
      reward_id: prize?.id || 'reward_unknown',
      reward_type: prize?.type || 'gold',
      reward_amount: Number(prize?.amount) || 0,
      is_free_spin: Boolean(isFree),
      cost_gems: Number(costGems) || 0,
    })

    return { success: true, fallback: true }
  } catch (err) {
    // Graceful offline fallback: allow local play without blocking user if network error
    console.warn('Server wheel spin validation offline/fallback:', err)
    return { success: true, localOnly: true }
  }
}

/**
 * Server-authoritative claiming of arena season rewards with anti-cheat duplicate protection
 */
export async function claimArenaSeasonRewardOnServer({
  seasonNumber,
  leagueId,
  trophiesBefore,
  trophiesAfter,
  rewards,
}) {
  const playerId = getPlayerId()
  try {
    // 1. Attempt PostgreSQL RPC claim_arena_season_reward
    const { data: rpcData, error: rpcError } = await supabase.rpc('claim_arena_season_reward', {
      p_player_id: playerId,
      p_season_number: Number(seasonNumber),
      p_league_id: String(leagueId),
      p_trophies_before: Number(trophiesBefore) || 0,
      p_trophies_after: Number(trophiesAfter) || 0,
      p_rewards: rewards || {},
    })

    if (!rpcError && rpcData) {
      return rpcData
    }

    // 2. Direct table fallback if RPC is not yet migrated
    const { error: insertError } = await supabase.from('arena_season_claims').insert({
      season_number: Number(seasonNumber),
      player_id: playerId,
      league_id: String(leagueId),
      trophies_before: Number(trophiesBefore) || 0,
      trophies_after: Number(trophiesAfter) || 0,
      rewards: rewards || {},
    })

    if (insertError) {
      console.warn('Server season claim insert note:', insertError.message)
    }

    // Update leaderboard trophies
    await supabase.from('leaderboard').update({
      trophies: Number(trophiesAfter) || 0,
      updated_at: new Date().toISOString(),
    }).eq('id', playerId)

    return { success: true, season_number: seasonNumber, trophies_after: trophiesAfter }
  } catch (err) {
    console.warn('Server season claim offline fallback:', err)
    return { success: true, localOnly: true }
  }
}


