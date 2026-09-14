export const BUILDING_TYPES = {
  AYUNTAMIENTO: {
    id: 'ayuntamiento',
    name: 'Castillo Imperial',
    category: 'gobierno',
    minKingdomLevel: 1,
    maxAllowed: 1,
    isUnique: true,
    description: 'El corazón de tu reino y sede de la corona celestial. Incrementa el límite de población, defensa y la recaudación fiscal.',
    image: '/assets/buildings/castillo/castillo_idle.webp',
    animIdle: '/assets/buildings/castillo/castillo_idle.webp',
    animConstruct: null,
    poster: '/assets/buildings/castillo/castillo_poster.webp',
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
  GOLD_MINE: {
    id: 'gold_mine',
    name: 'Mina de Oro Profunda',
    category: 'produccion',
    minKingdomLevel: 1,
    maxAllowed: 2,
    isUnique: false,
    description: 'Extrae vetas de oro subterráneas y diamantes continuamente con vagonetas y poleas.',
    image: '/assets/buildings/gold_mine/gold_mine_idle.webp',
    animIdle: '/assets/buildings/gold_mine/gold_mine_idle.webp',
    animConstruct: '/assets/buildings/gold_mine/gold_mine_construccion.webp',
    poster: '/assets/buildings/gold_mine/gold_mine_poster.webp',
    atlasIdle: '/assets/buildings/gold_mine/gold_mine_idle_atlas.webp',
    atlasConstruct: '/assets/buildings/gold_mine/gold_mine_const_atlas.webp',
    cost: { gold: 90, wood: 80, stone: 30 },
    production: { gold: 40 },
    productionCycleSec: 120,
    populationUsed: 3,
    buildTimeSec: 35,
    size: { w: 1, h: 1 },
  },
  CUARTEL: {
    id: 'cuartel',
    name: 'Cuartel de Guerra',
    category: 'militar',
    minKingdomLevel: 1,
    maxAllowed: 1,
    isUnique: true,
    description: 'Entrena reclutas, arqueros e infantería pesada para defender tu feudo.',
    image: '/assets/buildings/cuartel/cuartel_idle.webp',
    animIdle: '/assets/buildings/cuartel/cuartel_idle.webp',
    animConstruct: '/assets/buildings/cuartel/cuartel_construccion.webp',
    poster: '/assets/buildings/cuartel/cuartel_poster.webp',
    atlasIdle: '/assets/buildings/cuartel/cuartel_idle_atlas.webp',
    atlasConstruct: '/assets/buildings/cuartel/cuartel_const_atlas.webp',
    cost: { gold: 120, wood: 100, stone: 50 },
    production: {},
    defense: 40,
    attack: 75,
    populationUsed: 5,
    buildTimeSec: 45,
    size: { w: 1, h: 1 },
  },
  ALMACEN: {
    id: 'almacen',
    name: 'Gran Almacén Real',
    category: 'produccion',
    minKingdomLevel: 2,
    maxAllowed: 1,
    isUnique: true,
    description: 'Bóveda acorazada con candado gigante, cofre de tesoro brillante y muelle con provisiones selladas.',
    image: '/assets/buildings/almacen/almacen.webp',
    animIdle: null,
    animConstruct: '/assets/buildings/almacen/almacen_construccion.webp',
    poster: '/assets/buildings/almacen/almacen_poster.webp',
    atlasConstruct: '/assets/buildings/almacen/almacen_const_atlas.webp',
    cost: { gold: 120, wood: 140, stone: 90 },
    production: { wood: 20, stone: 20 },
    productionCycleSec: 140,
    populationUsed: 2,
    buildTimeSec: 60,
    size: { w: 1, h: 1 },
  },
  ARCHER_TOWER: {
    id: 'archer_tower',
    name: 'Torre de Arqueros',
    category: 'militar',
    minKingdomLevel: 1,
    maxAllowed: 3,
    isUnique: false,
    description: 'Defensa fortificada con balista y arqueros en vigía. Dispara flechas perforantes contra invasores.',
    image: '/assets/buildings/archer_tower/archer_tower_idle.webp',
    animIdle: '/assets/buildings/archer_tower/archer_tower_idle.webp',
    animConstruct: '/assets/buildings/archer_tower/archer_tower_construccion.webp',
    poster: '/assets/buildings/archer_tower/archer_tower_poster.webp',
    atlasIdle: '/assets/buildings/archer_tower/archer_tower_idle_atlas.webp',
    atlasConstruct: '/assets/buildings/archer_tower/archer_tower_const_atlas.webp',
    cost: { gold: 90, wood: 70, stone: 40 },
    production: {},
    defense: 85,
    attack: 60,
    populationUsed: 2,
    buildTimeSec: 40,
    size: { w: 1, h: 1 },
  },
  CASA_MOLINO: {
    id: 'casa_molino',
    name: 'Aserradero del Río',
    category: 'produccion',
    minKingdomLevel: 1,
    maxAllowed: 2,
    isUnique: false,
    description: 'Aprovecha la corriente hidráulica para serrar troncos y abastecer al reino con madera refinada.',
    image: '/assets/buildings/casa_molino/casa_molino_idle.webp',
    animIdle: '/assets/buildings/casa_molino/casa_molino_idle.webp',
    animConstruct: '/assets/buildings/casa_molino/casa_molino_construccion.webp',
    poster: '/assets/buildings/casa_molino/casa_molino_poster.webp',
    atlasIdle: '/assets/buildings/casa_molino/casa_molino_idle_atlas.webp',
    atlasConstruct: '/assets/buildings/casa_molino/casa_molino_const_atlas.webp',
    cost: { gold: 80, wood: 50, stone: 20 },
    production: { wood: 35, gold: 8 },
    productionCycleSec: 120,
    populationUsed: 2,
    buildTimeSec: 40,
    size: { w: 1, h: 1 },
  },
  MINA_PIEDRA: {
    id: 'mina_piedra',
    name: 'Cantera de Granito',
    category: 'produccion',
    minKingdomLevel: 1,
    maxAllowed: 2,
    isUnique: false,
    description: 'Extrae y talla bloques macizos con grúa de elevación pesada para murallas y fortalezas.',
    image: '/assets/buildings/mina_piedra/mina_piedra_idle.webp',
    animIdle: '/assets/buildings/mina_piedra/mina_piedra_idle.webp',
    animConstruct: '/assets/buildings/mina_piedra/mina_piedra_construccion.webp',
    poster: '/assets/buildings/mina_piedra/mina_piedra_poster.webp',
    atlasIdle: '/assets/buildings/mina_piedra/mina_piedra_idle_atlas.webp',
    atlasConstruct: '/assets/buildings/mina_piedra/mina_piedra_const_atlas.webp',
    cost: { gold: 90, wood: 70, stone: 0 },
    production: { stone: 45, gold: 10 },
    productionCycleSec: 90,
    populationUsed: 2,
    buildTimeSec: 35,
    size: { w: 1, h: 1 },
  },
  PORTAL: {
    id: 'portal',
    name: 'Portal Arcano Celestial',
    category: 'arcano',
    minKingdomLevel: 3,
    maxAllowed: 1,
    isUnique: true,
    description: 'Canaliza energías cósmicas y cristales de éter para abrir fisuras dimensionales y expediciones.',
    image: '/assets/buildings/portal/portal_idle.webp',
    animIdle: '/assets/buildings/portal/portal_idle.webp',
    animConstruct: '/assets/buildings/portal/portal_construccion.webp',
    poster: '/assets/buildings/portal/portal_poster.webp',
    atlasIdle: '/assets/buildings/portal/portal_idle_atlas.webp',
    atlasConstruct: '/assets/buildings/portal/portal_const_atlas.webp',
    cost: { gold: 240, wood: 160, stone: 150, gems: 15 },
    production: { gems: 2, gold: 30 },
    productionCycleSec: 300,
    defense: 60,
    attack: 50,
    populationUsed: 2,
    buildTimeSec: 180,
    size: { w: 1, h: 1 },
  },
  CASA: {
    id: 'casa',
    name: 'Casa de Colonos',
    category: 'social',
    minKingdomLevel: 1,
    maxAllowed: 4,
    isUnique: false,
    description: 'Vivienda acogedora con chimenea humeante y flores. Proporciona techo y atrae nuevos habitantes.',
    image: '/assets/buildings/casa/casa_idle.webp',
    animIdle: '/assets/buildings/casa/casa_idle.webp',
    animConstruct: '/assets/buildings/casa/casa_construccion.webp',
    poster: '/assets/buildings/casa/casa_poster.webp',
    atlasIdle: '/assets/buildings/casa/casa_idle_atlas.webp',
    atlasConstruct: '/assets/buildings/casa/casa_const_atlas.webp',
    cost: { gold: 60, wood: 45, stone: 0 },
    production: { gold: 20, food: 5 },
    productionCycleSec: 60,
    populationProvided: 15,
    buildTimeSec: 20,
    size: { w: 1, h: 1 },
  },
  MOLINO: {
    id: 'molino',
    name: 'Molino de Viento Imperial',
    category: 'produccion',
    minKingdomLevel: 1,
    maxAllowed: 2,
    isUnique: false,
    description: 'Molino harinero con aspas giratorias, sacos de grano y terraza de molienda continua.',
    image: '/assets/buildings/molino/molino_idle.webp',
    animIdle: '/assets/buildings/molino/molino_idle.webp',
    animConstruct: '/assets/buildings/molino/molino_construccion.webp',
    poster: '/assets/buildings/molino/molino_poster.webp',
    atlasIdle: '/assets/buildings/molino/molino_idle_atlas.webp',
    atlasConstruct: '/assets/buildings/molino/molino_const_atlas.webp',
    cost: { gold: 120, wood: 100, stone: 60 },
    production: { food: 45, gold: 12 },
    productionCycleSec: 120,
    populationUsed: 2,
    buildTimeSec: 50,
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
  gold_mine: 3.3,
  cuartel: 3.0,
  almacen: 2.9,
  archer_tower: 2.7,
  casa_molino: 2.8,
  mina_piedra: 2.5,
  portal: 2.8,
  casa: 3.3,
  molino: 3.0,
}

export function getBuildingAnimationDuration(buildingId) {
  const norm = (buildingId || '').toLowerCase()
  return BUILDING_ANIM_DURATIONS[norm] || 3.2
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

    // Never allow a castle / ayuntamiento on slots other than slot-1, and completely remove academia
    if (matched.buildingId === 'ayuntamiento' || matched.buildingId === 'castillo' || matched.buildingId === 'academia') {
      return {
        ...baseSlot,
        buildingId: null,
        level: 0,
        isConstructing: false,
        progress: 0,
      }
    }

    return {
      ...baseSlot,
      ...matched,
    }
  })
}

export const INITIAL_RESOURCES = {
  gold: 950,
  wood: 750,
  stone: 650,
  food: 400,
  gems: 50,
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
