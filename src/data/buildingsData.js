export const BUILDING_TYPES = {
  AYUNTAMIENTO: {
    id: 'ayuntamiento',
    name: 'Castillo Imperial',
    category: 'gobierno',
    minKingdomLevel: 1,
    maxAllowed: 1,
    isUnique: true,
    description: 'El corazón de tu reino y sede de la corona celestial. Incrementa el límite de población, defensa y la recaudación fiscal.',
    image: '/assets/buildings/ayuntamiento/palacio_soberano.webp?v=1789386000',
    animIdle: '/assets/buildings/ayuntamiento/palacio_soberano.webp?v=1789386000',
    animConstruct: null,
    poster: '/assets/buildings/ayuntamiento/palacio_soberano.webp?v=1789386000',
    atlasIdle: null,
    atlasConstruct: null,
    cost: { gold: 250, wood: 200, stone: 150 },
    production: { gold: 60, wood: 35, stone: 35, food: 25 },
    productionCycleSec: 90,
    populationProvided: 35,
    defense: 120,
    attack: 60,
    buildTimeSec: 90,
    size: { w: 1, h: 1 },
  },
}

export const SPEEDUP_TYPES = {
  speedup_1m: {
    id: 'speedup_1m',
    name: 'Reloj de Arena Menor',
    seconds: 60,
    icon: '/assets/hud_icons/icon_speedup.webp',
    label: '1 Min',
    color: '#38bdf8',
    rarity: 'common',
  },
  speedup_5m: {
    id: 'speedup_5m',
    name: 'Reloj de Arena Común',
    seconds: 300,
    icon: '/assets/hud_icons/icon_speedup.webp',
    label: '5 Min',
    color: '#22c55e',
    rarity: 'uncommon',
  },
  speedup_15m: {
    id: 'speedup_15m',
    name: 'Reloj de Arena Mayor',
    seconds: 900,
    icon: '/assets/hud_icons/icon_speedup.webp',
    label: '15 Min',
    color: '#a855f7',
    rarity: 'rare',
  },
  speedup_60m: {
    id: 'speedup_60m',
    name: 'Reloj Arcano de la Eternidad',
    seconds: 3600,
    icon: '/assets/hud_icons/icon_speedup.webp',
    label: '60 Min',
    color: '#f59e0b',
    rarity: 'epic',
  },
}

export const MAX_PRODUCTION_BATCHES = 6

export function getMaxProductionBatches(hasVip = false) {
  return hasVip ? 8 : 6
}

export function getBuildingDef(buildingId) {
  if (!buildingId) return null
  const normalized = String(buildingId).toLowerCase().replace(/-/g, '_')
  if (normalized === 'castillo' || normalized === 'ayuntamiento') return BUILDING_TYPES.AYUNTAMIENTO
  return (
    Object.values(BUILDING_TYPES).find((b) => b.id === normalized || b.id === buildingId) ||
    BUILDING_TYPES[normalized.toUpperCase()] ||
    BUILDING_TYPES[buildingId.toUpperCase?.() || ''] ||
    null
  )
}

export function getBuildingMaxAllowed(buildingId) {
  const def = getBuildingDef(buildingId)
  if (!def) return 99
  return typeof def.maxAllowed === 'number' ? def.maxAllowed : (def.isUnique ? 1 : 99)
}

export function getBuildingCurrentCount(buildingId, slots = []) {
  if (!buildingId || !Array.isArray(slots)) return 0
  const normalizedTarget = buildingId === 'castillo' ? 'ayuntamiento' : buildingId
  return slots.filter((s) => {
    const sId = s.buildingId === 'castillo' ? 'ayuntamiento' : s.buildingId
    return sId === normalizedTarget
  }).length
}

export function canBuildMoreOf(buildingId, slots = []) {
  const max = getBuildingMaxAllowed(buildingId)
  const current = getBuildingCurrentCount(buildingId, slots)
  return current < max
}

export function getBuildingConstructionTime(buildingId, hasEngineering = false) {
  const bDef = getBuildingDef(buildingId)
  let baseSec = bDef?.buildTimeSec || 60
  if (hasEngineering) {
    baseSec = Math.round(baseSec * 0.7) // -30% con ingeniería VIP
  }
  return Math.max(15, baseSec)
}

export function getBuildingUpgradeTime(buildingId, currentLevel = 1, hasEngineering = false) {
  const bDef = getBuildingDef(buildingId)
  const baseSec = bDef?.buildTimeSec || 60
  // Level 1 -> 2: 1.8x
  // Level 2 -> 3: 3.2x
  // Level 3 -> 4: 5.5x
  // Level 4 -> 5: 8.5x
  const multiplier = Math.pow(Math.max(1, currentLevel), 1.4) * 1.6
  let totalSec = Math.round(baseSec * multiplier)
  if (hasEngineering) {
    totalSec = Math.round(totalSec * 0.7) // -30% con ingeniería VIP
  }
  return Math.max(30, totalSec)
}

// Measured frame durations for building construction animations in seconds (~2.5s - 3.3s)
export const BUILDING_ANIM_DURATIONS = {
  castillo: 3.1,
  ayuntamiento: 3.1,
}

export function getBuildingAnimationDuration(buildingId) {
  const norm = (buildingId || '').toLowerCase()
  return BUILDING_ANIM_DURATIONS[norm] || 3.1
}

// Grid slots corresponding to coordinates on the paved plaza of map_background.webp
// The central plaza spans from roughly 28% to 75% in X, and 20% to 72% in Y (isometric diamond)
// The kingdom starts with ONLY the central Imperial Castle on Slot 1, leaving 11 plots to build step by step.
export const INITIAL_PLAZA_SLOTS = [
  { id: 'slot-1', x: 50, y: 36, buildingId: 'ayuntamiento', level: 1, isConstructing: false, progress: 100, lastHarvestAt: Date.now() - 75000 },
  { id: 'slot-2', x: 42, y: 44, buildingId: null, level: 0 },
  { id: 'slot-3', x: 58, y: 44, buildingId: null, level: 0 },
  { id: 'slot-4', x: 34, y: 52, buildingId: null, level: 0 },
  { id: 'slot-5', x: 50, y: 52, buildingId: null, level: 0 },
  { id: 'slot-6', x: 66, y: 52, buildingId: null, level: 0 },
  { id: 'slot-7', x: 42, y: 60, buildingId: null, level: 0 },
  { id: 'slot-8', x: 58, y: 60, buildingId: null, level: 0 },
  { id: 'slot-9', x: 50, y: 68, buildingId: null, level: 0 },
  { id: 'slot-10', x: 36, y: 38, buildingId: null, level: 0 },
  { id: 'slot-11', x: 64, y: 38, buildingId: null, level: 0 },
  { id: 'slot-12', x: 28, y: 46, buildingId: null, level: 0 },
]

export function sanitizeKingdomSlots(slots) {
  if (!Array.isArray(slots) || slots.length === 0) return INITIAL_PLAZA_SLOTS

  return INITIAL_PLAZA_SLOTS.map((baseSlot) => {
    const matched = slots.find((s) => s && s.id === baseSlot.id)
    if (!matched) return { ...baseSlot }

    if (baseSlot.id === 'slot-1') {
      return {
        ...baseSlot,
        ...matched,
        buildingId: 'ayuntamiento',
        level: Math.max(1, matched.level || 1),
      }
    }

    // Only slot-1 can have a building (ayuntamiento). Reset any other slot to empty plot
    return {
      ...baseSlot,
      buildingId: null,
      level: 0,
      isConstructing: false,
      progress: 0,
    }
  })
}

export const INITIAL_RESOURCES = {
  gold: 950,
  wood: 750,
  stone: 650,
  food: 400,
  gems: 50,
  celestialShards: 75,
  populationUsed: 0,
  populationMax: 35,
}

export const INITIAL_QUESTS = [
  {
    id: 'q1',
    title: 'Establecer la Capital',
    desc: 'Construye o sube de nivel tu Ayuntamiento Imperial para consolidar tu reino en las alturas.',
    reward: { gold: 150, wood: 100 },
    completed: true,
  },
  {
    id: 'q2',
    title: 'Fiebre del Oro',
    desc: 'Construye una Mina de Oro adicional para asegurar el flujo de tributos.',
    reward: { gold: 200, gems: 5 },
    completed: false,
  },
  {
    id: 'q3',
    title: 'Fortaleza Marcial',
    desc: 'Posee un Cuartel Militar para instruir a la guardia de la fortaleza.',
    reward: { stone: 150, food: 100 },
    completed: true,
  },
  {
    id: 'q4',
    title: 'Misterios Arcanos',
    desc: 'Erige un Portal Arcano Celestial para desentrañar el poder cósmico.',
    reward: { gems: 15, gold: 300 },
    completed: false,
  },
]

export function getKingdomStorageCapacity(slots = [], kingdomLevel = 1, vipStatus = {}) {
  const baseCap = 2500 + Math.max(1, kingdomLevel) * 1000
  let warehouseBonus = 0
  if (Array.isArray(slots)) {
    slots.forEach((s) => {
      if (s.buildingId === 'almacen' && !s.isConstructing) {
        warehouseBonus += (s.level || 1) * 6000
      }
    })
  }
  let total = baseCap + warehouseBonus
  if (vipStatus?.hasEngineering) {
    total = Math.round(total * 1.25)
  }
  return total
}
