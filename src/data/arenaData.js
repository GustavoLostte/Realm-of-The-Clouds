// Arena & Competitive PvP Data System

export const ARENA_LEAGUES = [
  {
    id: 'league_bronze',
    name: 'Liga Bronce',
    minTrophies: 0,
    maxTrophies: 399,
    icon: '/assets/hud_icons/icon_stone.webp',
    image: '/assets/hud_icons/icon_stone.webp',
    color: '#cd7f32',
    gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
    rewardMultiplier: 1.0,
    seasonChest: 'Cofre de Bronce del Gladiador',
    seasonRewards: { gems: 25, gold: 5000, honor: 50 },
    description: 'Tier inicial de caudillos y señores fronterizos recién ascendidos.',
  },
  {
    id: 'league_silver',
    name: 'Liga Plata',
    minTrophies: 400,
    maxTrophies: 899,
    icon: '/assets/hud_icons/btn_build.webp',
    image: '/assets/hud_icons/btn_build.webp',
    color: '#94a3b8',
    gradient: 'linear-gradient(135deg, #334155 0%, #64748b 100%)',
    rewardMultiplier: 1.25,
    seasonChest: 'Cofre de Plata de la Guardia',
    seasonRewards: { gems: 50, gold: 12000, honor: 120 },
    description: 'Baronías organizadas con guarniciones tácticas y comandantes veteranos.',
  },
  {
    id: 'league_gold',
    name: 'Liga Oro',
    minTrophies: 900,
    maxTrophies: 1499,
    icon: '/assets/hud_icons/icon_trophy.webp',
    image: '/assets/hud_icons/icon_gold.webp',
    color: '#eab308',
    gradient: 'linear-gradient(135deg, #854d0e 0%, #ca8a04 100%)',
    rewardMultiplier: 1.5,
    seasonChest: 'Cofre Dorado de Asedio',
    seasonRewards: { gems: 100, gold: 25000, honor: 250 },
    description: 'Condados imperiales con infantería pesada, arqueros de élite y magos arcanos.',
  },
  {
    id: 'league_platinum',
    name: 'Liga Platino',
    minTrophies: 1500,
    maxTrophies: 2199,
    icon: '/assets/hud_icons/icon_gem.webp',
    image: '/assets/hud_icons/icon_gem.webp',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
    rewardMultiplier: 1.85,
    seasonChest: 'Arca de Platino de los Héroes',
    seasonRewards: { gems: 200, gold: 50000, honor: 500 },
    description: 'Grandes Ducados con fortalezas casi inexpugnables y tácticas maestras.',
  },
  {
    id: 'league_master',
    name: 'Soberano Supremo',
    minTrophies: 2200,
    maxTrophies: 99999,
    icon: '/assets/hud_icons/icon_crown.webp',
    image: '/assets/hud_icons/btn_ranking.webp',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #fde047 100%)',
    rewardMultiplier: 2.2,
    seasonChest: 'Cofre del Emperador Celestial',
    seasonRewards: { gems: 500, gold: 100000, honor: 1000 },
    description: 'La cúspide del reino: los emperadores más legendarios del servidor.',
  },
]

export function getLeagueForTrophies(trophies = 0) {
  const t = Math.max(0, trophies)
  for (let i = ARENA_LEAGUES.length - 1; i >= 0; i--) {
    if (t >= ARENA_LEAGUES[i].minTrophies) {
      return ARENA_LEAGUES[i]
    }
  }
  return ARENA_LEAGUES[0]
}

// Pool of rival player kingdom profiles for matchmaking
const RIVAL_NAMES = [
  { key: 'rival_0', name: 'Lord Valerius', kingdom: 'Fortaleza Carmesí', avatar: '/assets/avatars/avatar_king.webp' },
  { key: 'rival_1', name: 'Emperatriz Aurelia', kingdom: 'Bastión del Alba', avatar: '/assets/avatars/avatar_valkyrie.webp' },
  { key: 'rival_2', name: 'Archimago Theron', kingdom: 'Torre Astral', avatar: '/assets/avatars/avatar_mage.webp' },
  { key: 'rival_3', name: 'Paladín Siegfried', kingdom: 'Guardia Imperial', avatar: '/assets/avatars/avatar_paladin.webp' },
  { key: 'rival_4', name: 'Barón Kaelen', kingdom: 'Tierras de la Venganza', avatar: '/assets/avatars/avatar_king.webp' },
  { key: 'rival_5', name: 'Señora Sylvana', kingdom: 'Bosque de Sombras', avatar: '/assets/avatars/avatar_valkyrie.webp' },
  { key: 'rival_6', name: 'Mariscal Roderic', kingdom: 'Murallas de Hierro', avatar: '/assets/avatars/avatar_paladin.webp' },
  { key: 'rival_7', name: 'Vanguardia Malakor', kingdom: 'Pico de la Tormenta', avatar: '/assets/avatars/avatar_mage.webp' },
  { key: 'rival_8', name: 'Lady Cassandra', kingdom: 'Vanguardia Dorada', avatar: '/assets/avatars/avatar_valkyrie.webp' },
  { key: 'rival_9', name: 'Duque Balthazar', kingdom: 'Ciudadela del Dragón', avatar: '/assets/avatars/avatar_king.webp' },
]

export function generateRivalsForPlayer(playerTrophies = 250, playerLevel = 1) {
  const currentLeague = getLeagueForTrophies(playerTrophies)
  
  // 3 rivals: 1 easier, 1 balanced, 1 hard/challenge
  const difficulties = [
    {
      id: 'easy',
      tag: 'Objetivo Asequible',
      color: '#22c55e',
      trophyOffset: -35,
      levelOffset: Math.max(1, playerLevel - 1),
      winTrophies: 16,
      lossTrophies: -10,
      goldLootBase: 1200,
      defenseStrength: 0.85,
    },
    {
      id: 'normal',
      tag: 'Duelo Equilibrado',
      color: '#eab308',
      trophyOffset: 15,
      levelOffset: playerLevel,
      winTrophies: 26,
      lossTrophies: -18,
      goldLootBase: 2800,
      defenseStrength: 1.05,
    },
    {
      id: 'hard',
      tag: 'Asalto de Alto Riesgo',
      color: '#ef4444',
      trophyOffset: 85,
      levelOffset: playerLevel + 1,
      winTrophies: 38,
      lossTrophies: -24,
      goldLootBase: 5500,
      defenseStrength: 1.35,
    },
  ]

  // Pick 3 distinct random rivals from pool
  const shuffledNames = [...RIVAL_NAMES].sort(() => 0.5 - Math.random())

  return difficulties.map((diff, index) => {
    const profile = shuffledNames[index] || shuffledNames[0]
    const rivalTrophies = Math.max(0, playerTrophies + diff.trophyOffset + Math.floor(Math.random() * 15))
    const rivalLevel = Math.max(1, diff.levelOffset)
    const multiplier = currentLeague.rewardMultiplier

    // Enemy defense composition
    const infantryDef = Math.max(2, Math.round(rivalLevel * 2 * diff.defenseStrength))
    const archersDef = Math.max(1, Math.round(rivalLevel * 1.5 * diff.defenseStrength))
    const magesDef = rivalLevel >= 2 ? Math.round(rivalLevel * diff.defenseStrength) : 0
    const hasCommander = diff.id === 'hard' || rivalLevel >= 3

    return {
      id: `rival-${Date.now()}-${index}`,
      profileKey: profile.key,
      name: profile.name,
      kingdom: profile.kingdom,
      avatar: profile.avatar,
      level: rivalLevel,
      trophies: rivalTrophies,
      league: getLeagueForTrophies(rivalTrophies),
      difficulty: diff,
      rewards: {
        trophies: Math.round(diff.winTrophies),
        lossTrophies: Math.round(diff.lossTrophies),
        gold: Math.round(diff.goldLootBase * multiplier),
        stone: Math.round((diff.goldLootBase * 0.4) * multiplier),
        honor: diff.id === 'easy' ? 20 : diff.id === 'normal' ? 35 : 55,
      },
      defense: {
        hp: Math.round(180 + rivalLevel * 50 * diff.defenseStrength),
        infantry: infantryDef,
        archers: archersDef,
        mages: magesDef,
        hasCommander,
        damagePerHit: Math.round(12 + rivalLevel * 3 * diff.defenseStrength),
      },
    }
  })
}

// Global leaderboard simulated ranking
export const BASE_LEADERBOARD = [
  { rank: 1, name: 'Soberano Malakor', kingdom: 'Imperio Celestial', trophies: 2840, leagueId: 'league_master', avatar: '/assets/avatars/avatar_king.webp', wins: 412 },
  { rank: 2, name: 'Reina Valquiria Astrid', kingdom: 'Bastión del Trueno', trophies: 2715, leagueId: 'league_master', avatar: '/assets/avatars/avatar_valkyrie.webp', wins: 388 },
  { rank: 3, name: 'Archiduque Morvath', kingdom: 'Tierras Marchitas', trophies: 2590, leagueId: 'league_master', avatar: '/assets/avatars/avatar_mage.webp', wins: 345 },
  { rank: 4, name: 'Lord Siegfried IV', kingdom: 'Corona Dorada', trophies: 2430, leagueId: 'league_master', avatar: '/assets/avatars/avatar_paladin.webp', wins: 310 },
  { rank: 5, name: 'Lady Marianne', kingdom: 'Vanguardia Celeste', trophies: 2280, leagueId: 'league_master', avatar: '/assets/avatars/avatar_valkyrie.webp', wins: 290 },
  { rank: 6, name: 'Conde Drakon', kingdom: 'Garganta del Dragón', trophies: 2040, leagueId: 'league_platinum', avatar: '/assets/avatars/avatar_king.webp', wins: 260 },
  { rank: 7, name: 'Barón Thorne', kingdom: 'Fuerte Roca Negra', trophies: 1890, leagueId: 'league_platinum', avatar: '/assets/avatars/avatar_paladin.webp', wins: 235 },
  { rank: 8, name: 'Hechicera Nyx', kingdom: 'Círculo de Sombras', trophies: 1720, leagueId: 'league_platinum', avatar: '/assets/avatars/avatar_mage.webp', wins: 215 },
  { rank: 9, name: 'Mariscal Alistair', kingdom: 'Murallas de Acero', trophies: 1580, leagueId: 'league_platinum', avatar: '/assets/avatars/avatar_paladin.webp', wins: 198 },
  { rank: 10, name: 'General Roland', kingdom: 'Legión Solar', trophies: 1460, leagueId: 'league_gold', avatar: '/assets/avatars/avatar_king.webp', wins: 182 },
]

export const INITIAL_DEFENSE_LOG = [
  {
    id: 'def-log-1',
    attackerName: 'Conde Roderic',
    attackerAvatar: '/assets/avatars/avatar_paladin.webp',
    attackerKingdom: 'Fortaleza del León',
    result: 'defeat',
    trophiesDiff: -16,
    goldLost: 850,
    timestamp: Date.now() - 3600000 * 3, // 3h ago
    revengeClaimed: false,
  },
  {
    id: 'def-log-2',
    attackerName: 'Lady Vespera',
    attackerAvatar: '/assets/avatars/avatar_valkyrie.webp',
    attackerKingdom: 'Nido de Grifos',
    result: 'victory',
    trophiesDiff: +22,
    goldLost: 0,
    timestamp: Date.now() - 3600000 * 8, // 8h ago
    revengeClaimed: true,
  },
]

export const HONOR_SHOP_ITEMS = [
  {
    id: 'item_relic_manto_vencedor',
    name: 'Manto del Vencedor',
    type: 'relic',
    image: '/assets/hud_icons/btn_ranking.webp',
    avatar: '/assets/hud_icons/btn_ranking.webp',
    costHonor: 450,
    description: 'Capa con ribetes de púrpura imperial que infunde terror en las fortalezas rivales.',
    effect: '+20% de daño base en la Arena y +12 HP permanente.',
    relicId: 'relic_manto_vencedor',
    isOneTime: true,
  },
  {
    id: 'item_shield_8h',
    name: 'Escudo de Paz (8 Horas)',
    type: 'shield',
    durationHours: 8,
    image: '/assets/hud_icons/btn_quests.webp',
    costHonor: 120,
    description: 'Un velo mágico protege tu fortaleza contra cualquier asedio rival mientras descansas.',
    effect: 'Inmunidad total contra asaltos de jugadores durante 8 horas.',
    isOneTime: false,
  },
  {
    id: 'item_shield_24h',
    name: 'Escudo de Paz (24 Horas)',
    type: 'shield',
    durationHours: 24,
    image: '/assets/hud_icons/btn_quests.webp',
    costHonor: 280,
    description: 'La bendición absoluta de los antiguos reyes. Nadie podrá saquear tus arcas por un día entero.',
    effect: 'Inmunidad total contra asaltos de jugadores durante 24 horas.',
    isOneTime: false,
  },
  {
    id: 'item_gems_pouch',
    name: 'Bolsa de 60 Gemas Arcanas',
    type: 'gems',
    amount: 60,
    image: '/assets/hud_icons/icon_gem.webp',
    costHonor: 200,
    description: 'Cristales de éter puro extraídos de las ruinas de gladiadores caídos.',
    effect: '+60 Gemas Reales para acelerar o desbloquear beneficios.',
    isOneTime: false,
  },
  {
    id: 'item_war_chest',
    name: 'Cofre de Suministros Militares',
    type: 'chest',
    costHonor: 150,
    image: '/assets/hud_icons/btn_inventory.webp',
    description: 'Suministros de campaña con víveres, oro y reclutas veteranos.',
    rewards: {
      gold: 6000,
      wood: 4000,
      stone: 4000,
      food: 3000,
      troops: { infantry: 4, archers: 3, mages: 1 },
    },
    effect: 'Oro masivo, materiales y batallón de refuerzos listo para marchar.',
    isOneTime: false,
  },
]

// ==============================================================================
// COMPETITIVE SEASONS SYSTEM (arena_seasons)
// ==============================================================================

export const ARENA_SEASON_DURATION_MS = 14 * 24 * 60 * 60 * 1000 // 14 days
// Reference epoch: Monday, Jan 5, 2026 00:00:00 UTC
export const ARENA_SEASON_EPOCH_MS = Date.UTC(2026, 0, 5, 0, 0, 0)

export const SEASON_TITLES = [
  'El Despertar de los Reyes',
  'La Furia de Avalon',
  'El Choque de Imperios',
  'Tormenta de Asedio',
  'Cónclave de Gladiadores',
  'El Juicio del Acero',
  'La Corona Eterna',
]

/**
 * Returns current season data calculated deterministically from current timestamp
 */
export function getCurrentSeasonData(now = Date.now()) {
  const elapsed = Math.max(0, now - ARENA_SEASON_EPOCH_MS)
  const seasonIndex = Math.floor(elapsed / ARENA_SEASON_DURATION_MS)
  const seasonNumber = seasonIndex + 1
  const startsAt = ARENA_SEASON_EPOCH_MS + (seasonIndex * ARENA_SEASON_DURATION_MS)
  const endsAt = startsAt + ARENA_SEASON_DURATION_MS
  const remainingMs = Math.max(0, endsAt - now)

  const title = SEASON_TITLES[seasonIndex % SEASON_TITLES.length] || `Guerra de Reyes (Temporada ${seasonNumber})`

  // Format countdown string
  const totalSec = Math.floor(remainingMs / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  let formattedTime = ''
  if (days > 1) {
    formattedTime = `${days}d ${hours}h`
  } else if (days === 1) {
    formattedTime = `1d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    formattedTime = `${hours}h ${minutes}m ${seconds}s`
  } else {
    formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return {
    seasonNumber,
    title,
    startsAt,
    endsAt,
    remainingMs,
    remainingFormatted: formattedTime,
    daysLeft: days,
    hoursLeft: hours,
  }
}

/**
 * Calculates season soft trophy reset:
 * - < 500: Keeps all trophies (min 250)
 * - 500 - 999: Retains 70% above 500
 * - 1000 - 1799: Retains 60% above 800
 * - 1800+: Retains 50% above 1200
 */
export function calculateTrophyReset(trophies = 250) {
  const current = Math.max(0, Number(trophies) || 0)
  if (current < 500) {
    return Math.max(250, current)
  }
  if (current < 1000) {
    return 500 + Math.floor((current - 500) * 0.7)
  }
  if (current < 1800) {
    return 800 + Math.floor((current - 800) * 0.6)
  }
  return 1200 + Math.floor((current - 1200) * 0.5)
}

/**
 * Returns the season end chest and reward bundle for a given league id
 */
export function getSeasonRewardsForLeague(leagueId) {
  const league = ARENA_LEAGUES.find((l) => l.id === leagueId) || ARENA_LEAGUES[0]
  const baseRewards = league.seasonRewards || { gems: 25, gold: 5000, honor: 50 }

  // Extra speedups and shield rewards based on league rank
  const bonusItems = {}
  if (league.id === 'league_silver') {
    bonusItems.speedups = { speedup_5m: 2 }
  } else if (league.id === 'league_gold') {
    bonusItems.speedups = { speedup_15m: 2 }
  } else if (league.id === 'league_platinum') {
    bonusItems.speedups = { speedup_60m: 1 }
    bonusItems.shields = { item_shield_8h: 1 }
  } else if (league.id === 'league_master') {
    bonusItems.speedups = { speedup_60m: 3 }
    bonusItems.shields = { item_shield_24h: 1 }
  }

  return {
    leagueId: league.id,
    leagueName: league.name,
    chestName: league.seasonChest,
    rewards: {
      ...baseRewards,
      bonusItems,
    },
  }
}
