// rankingData.js - Sistema de Clasificación Global y Datos de Soberanos Rivales

export const RANKING_CATEGORIES = [
  { id: 'power', label: 'Poder del Reino', icon: '/assets/hud_icons/btn_build.webp', desc: 'Puntuación total según nivel de edificios, nivel soberano y tropas.' },
  { id: 'arena', label: 'Arena de Campeones', icon: '/assets/hud_icons/btn_arena.webp', desc: 'Coronas ganadas en asedios PvP y rango de liga competitiva.' },
  { id: 'dungeon', label: 'Conquista de Mazmorras', icon: '/assets/hud_icons/btn_expedition.webp', desc: 'Pisos superados en las Mazmorras Celestiales y Abisales.' },
]

export const BASE_SOVEREIGNS = []

/**
 * Calculates current player's power score based on game state
 */
export function calculatePlayerPower({ level = 1, buildings = [], troops = {}, techCount = 0 }) {
  const levelScore = level * 1500
  const buildingsScore = (buildings || []).reduce((acc, b) => {
    if (!b) return acc
    return acc + (b.level || 1) * 850
  }, 0)
  const totalTroops = 
    (troops.infantry || 0) * 15 +
    (troops.archers || 0) * 20 +
    (troops.mages || 0) * 35 +
    (troops.commander ? 500 : 0)
  const techScore = techCount * 1200

  return Math.max(1200, levelScore + buildingsScore + totalTroops + techScore)
}

/**
 * Builds the full sorted ranking table for a category, using ONLY real players from Supabase and the current player
 */
export function getCategoryRanking(category, playerData, cloudPlayers = []) {
  // Player entry for this category
  let playerValue = 0
  let playerSubtext = ''

  if (category === 'power') {
    playerValue = calculatePlayerPower(playerData)
    playerSubtext = `Nivel ${playerData.level || 1} • ${(playerData.buildings || []).length} Edificios`
  } else if (category === 'arena') {
    playerValue = playerData.trophies || 400
    playerSubtext = `${playerData.leagueName || 'Liga Bronce'} • ${playerData.arenaWins || 0} Victorias`
  } else if (category === 'dungeon') {
    playerValue = playerData.dungeonFloor || 1
    playerSubtext = `Piso ${playerValue} Superado • ${playerData.dungeonStars || 0} Estrellas`
  }

  const playerRow = {
    id: playerData.id || 'player_sovereign',
    isPlayer: true,
    name: playerData.playerName || 'Lord King',
    kingdom: 'Reino de las Nubes (Tú)',
    avatar: playerData.avatar || '/assets/avatars/avatar_king.webp',
    title: 'Soberano Supremo',
    score: playerValue,
    subtext: playerSubtext,
    leagueName: playerData.leagueName || 'Bronce Novicio',
    leagueIcon: '/assets/hud_icons/btn_ranking.webp',
  }

  // Real players loaded from Supabase Cloud (exclude current player, legacy bots, and test placeholders)
  const cloudRows = (cloudPlayers || [])
    .filter(cp => cp && cp.id !== playerData.id && cp.id !== playerRow.id && !cp.id?.startsWith('lb_') && cp.player_name !== 'Señor Feudal' && cp.id !== 'test_real_check')
    .map(cp => {
      let score = 0
      let subtext = ''
      let kingdom = cp.kingdom_name || 'Reino Imperial'
      if (kingdom.includes('(Tú)')) {
        kingdom = kingdom.replace('(Tú)', '').trim() || 'Reino Imperial'
      }

      if (category === 'power') {
        score = cp.military_power || ((cp.level || 1) * 2500)
        subtext = `Nivel ${cp.level || 1} • ${kingdom}`
      } else if (category === 'arena') {
        score = cp.trophies || 400
        const wins = cp.arena_wins !== undefined ? cp.arena_wins : Math.max(0, Math.floor((cp.trophies || 400) / 24))
        subtext = `${cp.league_id || 'Bronce'} • ${wins} Victorias`
      } else if (category === 'dungeon') {
        score = cp.dungeon_floor || Math.max(1, Math.floor((cp.level || 1) * 2))
        const stars = cp.dungeon_stars !== undefined ? cp.dungeon_stars : (score * 3)
        subtext = `Piso ${score} Superado • ${stars} ⭐`
      }

      return {
        id: cp.id,
        name: cp.player_name || 'Soberano Real',
        kingdom: kingdom,
        avatar: cp.avatar || '/assets/avatars/avatar_king.webp',
        isPlayer: false,
        isCloudPlayer: true,
        score,
        subtext,
        leagueName: cp.league_id || 'Bronce Novicio',
        leagueIcon: '/assets/hud_icons/btn_ranking.webp',
      }
    })

  // Combine and sort descending by score, deduplicating by unique ID
  const seenIds = new Set()
  seenIds.add(playerRow.id)
  if (playerData.id) seenIds.add(playerData.id)
  const dedupedOthers = []

  // Include ONLY genuine real players from cloud
  cloudRows.forEach(row => {
    if (!seenIds.has(row.id)) {
      seenIds.add(row.id)
      dedupedOthers.push(row)
    }
  })

  // Exclusively real users: Current player + actual cloud players, sorted by score
  const combined = [playerRow, ...dedupedOthers].sort((a, b) => b.score - a.score)

  // Assign 1-indexed ranks
  let playerRank = 1
  const ranked = combined.map((entry, index) => {
    const rank = index + 1
    if (entry.isPlayer) {
      playerRank = rank
    }
    return { ...entry, rank }
  })

  return {
    list: ranked,
    playerRank,
    playerEntry: ranked.find((e) => e.isPlayer),
  }
}
