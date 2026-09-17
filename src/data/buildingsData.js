export const BUILDING_TYPES = {
  AYUNTAMIENTO: {
    id: 'ayuntamiento',
    name: 'Palacio Soberano',
    category: 'gobierno',
    minKingdomLevel: 1,
    maxAllowed: 1,
    isUnique: true,
    description: 'El corazón sagrado de tu reino. Incrementa el límite de población, defensa global y la recaudación de tributos.',
    image: '/assets/structures/cutout/01_palacio_soberano.webp',
    animIdle: '/assets/structures/cutout/01_palacio_soberano.webp',
    animConstruct: '/assets/structures/cimientos/cimientos.json',
    poster: '/assets/structures/cutout/01_palacio_soberano.webp',
    atlasIdle: null,
    atlasConstruct: null,
    cost: { gold: 250, wood: 200, stone: 150 },
    production: { gold: 80, wood: 40, stone: 40, food: 30 },
    productionCycleSec: 90,
    populationProvided: 40,
    defense: 150,
    attack: 60,
    buildTimeSec: 90,
    size: { w: 1, h: 1 },
  },
  CUARTEL: {
    id: 'cuartel',
    name: 'Cuartel Celestial',
    category: 'militar',
    minKingdomLevel: 1,
    maxAllowed: 2,
    description: 'Instrucción de huestes de élite. Potencia los atributos heroicos en Mazmorras PvE y refuerza la guarnición insular.',
    image: '/assets/structures/cutout/02_cuartel_celestial.webp',
    animIdle: '/assets/structures/cutout/02_cuartel_celestial.webp',
    animConstruct: '/assets/structures/cimientos/cimientos.json',
    poster: '/assets/structures/cutout/02_cuartel_celestial.webp',
    atlasIdle: null,
    atlasConstruct: null,
    cost: { gold: 180, wood: 150, stone: 100 },
    production: {},
    productionCycleSec: 0,
    populationProvided: 15,
    defense: 80,
    attack: 50,
    buildTimeSec: 60,
    size: { w: 1, h: 1 },
  },
  GOLD_MINE: {
    id: 'gold_mine',
    name: 'Mina de Oro',
    category: 'produccion',
    minKingdomLevel: 1,
    maxAllowed: 3,
    description: 'Extrae filones de oro puro de los riscos flotantes. Esencial para reclutar nuevos campeones y financiar la expansión.',
    image: '/assets/structures/cutout/03_mina_oro.webp',
    animIdle: '/assets/structures/cutout/03_mina_oro.webp',
    animConstruct: '/assets/structures/cimientos/cimientos.json',
    poster: '/assets/structures/cutout/03_mina_oro.webp',
    atlasIdle: null,
    atlasConstruct: null,
    cost: { gold: 100, wood: 120, stone: 80 },
    production: { gold: 120 },
    productionCycleSec: 60,
    populationProvided: 0,
    defense: 30,
    attack: 0,
    buildTimeSec: 45,
    size: { w: 1, h: 1 },
  },
  CASA_MOLINO: {
    id: 'casa_molino',
    name: 'Molino Alado',
    category: 'produccion',
    minKingdomLevel: 1,
    maxAllowed: 2,
    description: 'Aprovecha las corrientes del firmamento para moler grano sagrado y sostener la fuerza alimentaria del reino.',
    image: '/assets/structures/cutout/04_molino_alado.webp',
    animIdle: '/assets/structures/cutout/04_molino_alado.webp',
    animConstruct: '/assets/structures/cimientos/cimientos.json',
    poster: '/assets/structures/cutout/04_molino_alado.webp',
    atlasIdle: null,
    atlasConstruct: null,
    cost: { gold: 90, wood: 130, stone: 60 },
    production: { food: 95 },
    productionCycleSec: 60,
    populationProvided: 5,
    defense: 25,
    attack: 0,
    buildTimeSec: 45,
    size: { w: 1, h: 1 },
  },
  ARCHER_TOWER: {
    id: 'archer_tower',
    name: 'Torre de Vigilancia',
    category: 'militar',
    minKingdomLevel: 1,
    maxAllowed: 3,
    description: 'Vigías con arcos de luz divina. Disparan contra asaltantes rivales protegiendo los tesoros de la isla.',
    image: '/assets/structures/cutout/05_torre_vigilancia.webp',
    animIdle: '/assets/structures/cutout/05_torre_vigilancia.webp',
    animConstruct: '/assets/structures/cimientos/cimientos.json',
    poster: '/assets/structures/cutout/05_torre_vigilancia.webp',
    atlasIdle: null,
    atlasConstruct: null,
    cost: { gold: 150, wood: 90, stone: 140 },
    production: {},
    productionCycleSec: 0,
    populationProvided: 0,
    defense: 140,
    attack: 75,
    buildTimeSec: 50,
    size: { w: 1, h: 1 },
  },
  PORTAL: {
    id: 'portal',
    name: 'Portal Arcano',
    category: 'arcano',
    minKingdomLevel: 2,
    maxAllowed: 1,
    isUnique: true,
    description: 'Vórtice cósmico hacia Mazmorras secretas y Desafíos de Jefes. Permite conseguir gemas y skins de prestigio.',
    image: '/assets/structures/cutout/06_portal_arcano.webp',
    animIdle: '/assets/structures/cutout/06_portal_arcano.webp',
    animConstruct: '/assets/structures/cimientos/cimientos.json',
    poster: '/assets/structures/cutout/06_portal_arcano.webp',
    atlasIdle: null,
    atlasConstruct: null,
    cost: { gold: 300, wood: 200, stone: 250, gems: 10 },
    production: { gems: 1 },
    productionCycleSec: 300,
    populationProvided: 0,
    defense: 60,
    attack: 40,
    buildTimeSec: 120,
    size: { w: 1, h: 1 },
  },
  CASA: {
    id: 'casa',
    name: 'Morada de Colonos',
    category: 'gobierno',
    minKingdomLevel: 1,
    maxAllowed: 4,
    description: 'Hogar de los arquitectos, siervos y colonos. Aumenta la capacidad poblacional para sostener más faenas.',
    image: '/assets/structures/cutout/07_morada_residencia.webp',
    animIdle: '/assets/structures/cutout/07_morada_residencia.webp',
    animConstruct: '/assets/structures/cimientos/cimientos.json',
    poster: '/assets/structures/cutout/07_morada_residencia.webp',
    atlasIdle: null,
    atlasConstruct: null,
    cost: { gold: 80, wood: 100, stone: 60 },
    production: { gold: 25 },
    productionCycleSec: 60,
    populationProvided: 20,
    defense: 20,
    attack: 0,
    buildTimeSec: 35,
    size: { w: 1, h: 1 },
  },
  ALMACEN: {
    id: 'almacen',
    name: 'Gran Bóveda',
    category: 'gobierno',
    minKingdomLevel: 1,
    maxAllowed: 2,
    description: 'Cámara acorazada divina. Protege tus reservas de oro, madera y piedra para que ningún asaltante pueda saquearlas.',
    image: '/assets/structures/cutout/08_gran_boveda.webp',
    animIdle: '/assets/structures/cutout/08_gran_boveda.webp',
    animConstruct: '/assets/structures/cimientos/cimientos.json',
    poster: '/assets/structures/cutout/08_gran_boveda.webp',
    atlasIdle: null,
    atlasConstruct: null,
    cost: { gold: 200, wood: 180, stone: 200 },
    production: {},
    productionCycleSec: 0,
    populationProvided: 5,
    defense: 100,
    attack: 0,
    buildTimeSec: 75,
    size: { w: 1, h: 1 },
  },
  ASERRADERO: {
    id: 'aserradero',
    name: 'Aserradero Sagrado',
    category: 'produccion',
    minKingdomLevel: 1,
    maxAllowed: 2,
    description: 'Trabaja troncos benditos de las arboledas etéreas. Genera madera continua para edificaciones y mejoras.',
    image: '/assets/structures/cutout/09_aserradero_madera.webp',
    animIdle: '/assets/structures/cutout/09_aserradero_madera.webp',
    animConstruct: '/assets/structures/cimientos/cimientos.json',
    poster: '/assets/structures/cutout/09_aserradero_madera.webp',
    atlasIdle: null,
    atlasConstruct: null,
    cost: { gold: 90, wood: 50, stone: 90 },
    production: { wood: 110 },
    productionCycleSec: 60,
    populationProvided: 0,
    defense: 25,
    attack: 0,
    buildTimeSec: 40,
    size: { w: 1, h: 1 },
  },
  MINA_PIEDRA: {
    id: 'mina_piedra',
    name: 'Cantera de Granito',
    category: 'produccion',
    minKingdomLevel: 1,
    maxAllowed: 2,
    description: 'Extrae sillares de mármol y granito celestial para erigir defensas y ciudadelas inexpugnables.',
    image: '/assets/structures/cutout/10_cantera_marmol.webp',
    animIdle: '/assets/structures/cutout/10_cantera_marmol.webp',
    animConstruct: '/assets/structures/cimientos/cimientos.json',
    poster: '/assets/structures/cutout/10_cantera_marmol.webp',
    atlasIdle: null,
    atlasConstruct: null,
    cost: { gold: 110, wood: 90, stone: 40 },
    production: { stone: 110 },
    productionCycleSec: 60,
    populationProvided: 0,
    defense: 35,
    attack: 0,
    buildTimeSec: 40,
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

    return {
      ...baseSlot,
      ...matched,
      buildingId: matched.buildingId || null,
      level: matched.level || 0,
      isConstructing: Boolean(matched.isConstructing),
      progress: typeof matched.progress === 'number' ? matched.progress : (matched.buildingId ? 100 : 0),
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
