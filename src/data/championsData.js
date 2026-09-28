// Champions & Classes Data System for Character Selection & PvP Combat
// Realm of The Clouds / PWA Web3 Core Engine
// 
// Classes:
// - Knight (Kina): Melee Heavy Tank (Male & Female)
// - Paladin (Archer): Holy Marksman (Male & Female)
// - Mage (Mago): Arcane & Elemental Burst Caster (Male & Female)
// - Healer (Sanador): Divine Restorer (Shares visual character with Mage)
// - Valiria: Ángel Valquiria (Champion Legend)

import { 
  CLASSES_CONFIG, 
  CLASSES_LIST, 
  getClassById, 
  getChampionByClassAndGender,
  DEFAULT_CLASS_SCALES,
  getSavedClassScales,
  saveClassScales,
  getClassScale
} from './classesData.js'

export { 
  CLASSES_CONFIG, 
  CLASSES_LIST, 
  getClassById, 
  getChampionByClassAndGender,
  DEFAULT_CLASS_SCALES,
  getSavedClassScales,
  saveClassScales,
  getClassScale
}

// Helper to generate champion animations with real assets and fallbacks
export const createChampionAnimations = (basePath, hasRun = false, hasCombatAnims = false, overrides = {}) => {
  const idle = `${basePath}/idle.webp`
  const walk = `${basePath}/walk.webp`
  const run = hasRun ? `${basePath}/run.webp` : walk
  const dash_front = `${basePath}/dash_front.webp`
  const dash_back = `${basePath}/dash_back.webp`
  const jump = `${basePath}/jump.webp`

  const attack1 = hasCombatAnims ? `${basePath}/attack1.webp` : dash_front
  const attack1_1 = hasCombatAnims ? `${basePath}/attack1_1.webp` : dash_front
  const attack1_2 = hasCombatAnims ? `${basePath}/attack1_2.webp` : dash_front
  const attack1_3 = hasCombatAnims ? `${basePath}/attack1_3.webp` : dash_front
  const attack2 = hasCombatAnims ? `${basePath}/attack2.webp` : jump
  const attack2_1 = hasCombatAnims ? `${basePath}/attack2_1.webp` : jump
  const attack2_2 = hasCombatAnims ? `${basePath}/attack2.webp` : jump
  const special = hasCombatAnims ? `${basePath}/special.webp` : dash_front
  const special2 = hasCombatAnims ? `${basePath}/special2.webp` : dash_front
  const defend = hasCombatAnims ? `${basePath}/defend.webp` : idle

  return {
    idle,
    walk,
    run,
    dash_front,
    dash_back,
    down: idle,
    jump,
    attack1,
    attack1_1,
    attack1_2,
    attack1_3,
    attack2,
    attack2_1,
    attack2_2,
    special,
    special2,
    defend,
    hit: idle,
    knockdown: idle,
    lose: idle,
    victory: idle,
    ...overrides,
  }
}

// Helper to generate champion sounds from OGG files
export const createChampionSounds = (basePath, hasRunWalkSounds = false, hasCombatSounds = false, overrides = {}) => {
  const s = `${basePath}/sounds`
  return {
    jump: `${s}/jump.ogg`,
    dash_front: `${s}/dash_front.ogg`,
    dash_back: `${s}/dash_back.ogg`,
    walk: hasRunWalkSounds ? `${s}/walk.ogg` : null,
    run: hasRunWalkSounds ? `${s}/run.ogg` : null,
    attack1: hasCombatSounds ? `${s}/attack1.ogg` : `${s}/dash_front.ogg`,
    attack1_1: hasCombatSounds ? `${s}/attack1_1.ogg` : `${s}/dash_front.ogg`,
    attack1_2: hasCombatSounds ? `${s}/attack1_2.ogg` : `${s}/dash_front.ogg`,
    attack1_3: hasCombatSounds ? `${s}/attack1_3.ogg` : `${s}/dash_front.ogg`,
    attack2: hasCombatSounds ? `${s}/attack2.ogg` : `${s}/jump.ogg`,
    attack2_1: hasCombatSounds ? `${s}/attack2_1.ogg` : `${s}/jump.ogg`,
    special: hasCombatSounds ? `${s}/special.ogg` : `${s}/dash_front.ogg`,
    special2: hasCombatSounds ? `${s}/special2.ogg` : `${s}/dash_front.ogg`,
    defend: hasCombatSounds ? `${s}/defend.ogg` : null,
    hit: null,
    knockdown: null,
    lose: null,
    victory: null,
    ...overrides,
  }
}

const createStarterAnimations = createChampionAnimations

export const CHAMPIONS_LIST = [
  // 1. KNIGHT (KINA) - MALE
  {
    id: 'knight_male',
    classId: 'knight',
    gender: 'male',
    name: 'Knight',
    title: 'Caballero Guardián',
    role: 'Tanque de Vanguardia',
    element: 'Tierra y Acero',
    avatar: '/CHAMPIONS/KINA_MALE/avatar.webp',
    fullImage: '/CHAMPIONS/KINA_MALE/idle.webp',
    poster: '/CHAMPIONS/KINA_MALE/idle_poster.webp',
    idleAnim: '/CHAMPIONS/KINA_MALE/idle.webp',
    animations: createChampionAnimations('/CHAMPIONS/KINA_MALE', true, true),
    sounds: createChampionSounds('/CHAMPIONS/KINA_MALE', true, true),
    scale: 1.0,
    hp: 6200,
    atk: 88,
    def: 98,
    speed: 82,
    skillName: 'Muro Inquebrantable',
    skillDesc: 'Despliega una guardia férrea que eleva la resistencia física e inflige un golpe aturdidor.',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #38bdf8 100%)',
    statsSummary: { fuerza: '★★★★☆', vida: '★★★★★', agilidad: '★★★☆☆' },
    quote: '¡Mi escudo defenderá el reino hasta el último aliento!',
    unlocked: true,
  },

  // 2. KNIGHT (KINA) - FEMALE
  {
    id: 'knight_female',
    classId: 'knight',
    gender: 'female',
    name: 'Knight',
    title: 'Caballera Guardiana',
    role: 'Tanque de Vanguardia',
    element: 'Tierra y Acero',
    avatar: '/CHAMPIONS/KINA_FEMALE/avatar.webp',
    fullImage: '/CHAMPIONS/KINA_FEMALE/idle.webp',
    poster: '/CHAMPIONS/KINA_FEMALE/idle_poster.webp',
    idleAnim: '/CHAMPIONS/KINA_FEMALE/idle.webp',
    animations: createChampionAnimations('/CHAMPIONS/KINA_FEMALE', true, true),
    sounds: createChampionSounds('/CHAMPIONS/KINA_FEMALE', true, true),
    scale: 1.0,
    hp: 6000,
    atk: 90,
    def: 96,
    speed: 85,
    skillName: 'Bastión Valiente',
    skillDesc: 'Carga frontal reforzada con un escudo de energía que desvía ataques mortales.',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #7dd3fc 100%)',
    statsSummary: { fuerza: '★★★★☆', vida: '★★★★★', agilidad: '★★★★☆' },
    quote: '¡La fortaleza celestial no cederá ante nadie!',
    unlocked: true,
  },

  // 3. PALADIN (ARCHER) - MALE
  {
    id: 'paladin_male',
    classId: 'paladin',
    gender: 'male',
    name: 'Paladin',
    title: 'Tirador de la Luz',
    role: 'Tirador a Distancia',
    element: 'Luz Sagrada y Viento',
    avatar: '/CHAMPIONS/PALADIN_MALE/avatar.webp',
    fullImage: '/CHAMPIONS/PALADIN_MALE/idle.webp',
    poster: '/CHAMPIONS/PALADIN_MALE/idle_poster.webp',
    idleAnim: '/CHAMPIONS/PALADIN_MALE/idle.webp',
    animations: createChampionAnimations('/CHAMPIONS/PALADIN_MALE', true),
    sounds: createChampionSounds('/CHAMPIONS/PALADIN_MALE', true),
    scale: 1.0,
    hp: 4800,
    atk: 96,
    def: 82,
    speed: 97,
    skillName: 'Lluvia de Flechas Sagradas',
    skillDesc: 'Dispara una andanada de proyectiles luminosos que perforan armaduras a gran distancia.',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
    statsSummary: { fuerza: '★★★★★', vida: '★★★☆☆', agilidad: '★★★★★' },
    quote: '¡Ningún objetivo escapa a la flecha bendecida!',
    unlocked: true,
  },

  // 4. PALADIN (ARCHER) - FEMALE
  {
    id: 'paladin_female',
    classId: 'paladin',
    gender: 'female',
    name: 'Paladin',
    title: 'Tiradora de la Luz',
    role: 'Tirador a Distancia',
    element: 'Luz Sagrada y Viento',
    avatar: '/CHAMPIONS/PALADIN_FEMALE/avatar.webp',
    fullImage: '/CHAMPIONS/PALADIN_FEMALE/idle.webp',
    poster: '/CHAMPIONS/PALADIN_FEMALE/idle_poster.webp',
    idleAnim: '/CHAMPIONS/PALADIN_FEMALE/idle.webp',
    animations: createChampionAnimations('/CHAMPIONS/PALADIN_FEMALE', true),
    sounds: createChampionSounds('/CHAMPIONS/PALADIN_FEMALE', true),
    scale: 1.0,
    hp: 4700,
    atk: 98,
    def: 80,
    speed: 99,
    skillName: 'Disparo de Fe Relámpago',
    skillDesc: 'Tiro concentrado de extrema velocidad que impacta puntos vitales con precisión fatal.',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fde047 100%)',
    statsSummary: { fuerza: '★★★★★', vida: '★★★☆☆', agilidad: '★★★★★' },
    quote: '¡Rápida como el viento y certera como la luz!',
    unlocked: true,
  },

  // 5. MAGE - MALE
  {
    id: 'mage_male',
    classId: 'mage',
    gender: 'male',
    name: 'Mage',
    title: 'Archimago Astral',
    role: 'Hechicero Ofensivo',
    element: 'Fuego y Arcano',
    avatar: '/CHAMPIONS/MAGE_MALE/avatar.webp',
    fullImage: '/CHAMPIONS/MAGE_MALE/idle.webp',
    poster: '/CHAMPIONS/MAGE_MALE/idle_poster.webp',
    idleAnim: '/CHAMPIONS/MAGE_MALE/idle.webp',
    animations: createChampionAnimations('/CHAMPIONS/MAGE_MALE', false),
    sounds: createChampionSounds('/CHAMPIONS/MAGE_MALE', false),
    scale: 1.0,
    hp: 4400,
    atk: 100,
    def: 74,
    speed: 88,
    skillName: 'Tormenta Arcana',
    skillDesc: 'Desata una tempestad de esferas arcanas que estallan sobre el enemigo con fuerza destructiva.',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #6b21a8 0%, #8b5cf6 50%, #c084fc 100%)',
    statsSummary: { fuerza: '★★★★★', vida: '★★★☆☆', agilidad: '★★★★☆' },
    quote: '¡El poder de los cosmos arde bajo mi llamado!',
    unlocked: true,
  },

  // 6. MAGE - FEMALE
  {
    id: 'mage_female',
    classId: 'mage',
    gender: 'female',
    name: 'Mage',
    title: 'Archimaga Arcana',
    role: 'Hechicero Ofensivo',
    element: 'Fuego y Arcano',
    avatar: '/CHAMPIONS/MAGE_FEMALE/avatar.webp',
    fullImage: '/CHAMPIONS/MAGE_FEMALE/idle.webp',
    poster: '/CHAMPIONS/MAGE_FEMALE/idle_poster.webp',
    idleAnim: '/CHAMPIONS/MAGE_FEMALE/idle.webp',
    animations: createChampionAnimations('/CHAMPIONS/MAGE_FEMALE', false),
    sounds: createChampionSounds('/CHAMPIONS/MAGE_FEMALE', false),
    scale: 1.0,
    hp: 4300,
    atk: 102,
    def: 72,
    speed: 90,
    skillName: 'Vórtice Astral',
    skillDesc: 'Invocación de ondas cósmicas que desgarran la energía enemiga y causan daño masivo.',
    color: '#c084fc',
    gradient: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 50%, #e879f9 100%)',
    statsSummary: { fuerza: '★★★★★', vida: '★★★☆☆', agilidad: '★★★★☆' },
    quote: '¡Que los astros sellen tu destino en la batalla!',
    unlocked: true,
  },

  // 7. HEALER - MALE
  {
    id: 'healer_male',
    classId: 'healer',
    gender: 'male',
    name: 'Healer',
    title: 'Custodio de la Restauración',
    role: 'Soporte y Sanación',
    element: 'Luz Celestial y Vida',
    avatar: '/CHAMPIONS/HEALER_MALE/avatar.webp',
    fullImage: '/CHAMPIONS/HEALER_MALE/idle.webp',
    poster: '/CHAMPIONS/HEALER_MALE/idle_poster.webp',
    idleAnim: '/CHAMPIONS/HEALER_MALE/idle.webp',
    animations: createChampionAnimations('/CHAMPIONS/HEALER_MALE', false),
    sounds: createChampionSounds('/CHAMPIONS/HEALER_MALE', false),
    scale: 1.0,
    hp: 5400,
    atk: 84,
    def: 86,
    speed: 88,
    skillName: 'Gracia Restauradora',
    skillDesc: 'Emana una bendición celestial que cura heridas y otorga un escudo de regeneración continua.',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)',
    statsSummary: { fuerza: '★★★☆☆', vida: '★★★★★', agilidad: '★★★★☆' },
    quote: '¡La luz sagrada renueva toda vida y disipa las sombras!',
    unlocked: true,
  },

  // 8. HEALER - FEMALE
  {
    id: 'healer_female',
    classId: 'healer',
    gender: 'female',
    name: 'Healer',
    title: 'Custodia de la Restauración',
    role: 'Soporte y Sanación',
    element: 'Luz Celestial y Vida',
    avatar: '/CHAMPIONS/HEALER_FEMALE/avatar.webp',
    fullImage: '/CHAMPIONS/HEALER_FEMALE/idle.webp',
    poster: '/CHAMPIONS/HEALER_FEMALE/idle_poster.webp',
    idleAnim: '/CHAMPIONS/HEALER_FEMALE/idle.webp',
    animations: createChampionAnimations('/CHAMPIONS/HEALER_FEMALE', false),
    sounds: createChampionSounds('/CHAMPIONS/HEALER_FEMALE', false),
    scale: 1.0,
    hp: 5300,
    atk: 85,
    def: 85,
    speed: 89,
    skillName: 'Aura de Vida Serena',
    skillDesc: 'Onda curativa expansiva que restaura la salud y otorga resistencia mística inmediata.',
    color: '#34d399',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #6ee7b7 100%)',
    statsSummary: { fuerza: '★★★☆☆', vida: '★★★★★', agilidad: '★★★★☆' },
    quote: '¡Mientras quede esperanza, la luz de la sanación no se extinguirá!',
    unlocked: true,
  },

  // 9. VALIRIA (ÁNGEL VALQUIRIA) - LEGEND
  {
    id: 'valiria',
    classId: 'valkyrie',
    gender: 'female',
    name: 'Valiria',
    title: 'Ángel Valquiria',
    role: 'Guerrera Celestial',
    element: 'Luz Divina',
    avatar: '/assets/champions/valiria_avatar.webp',
    fullImage: '/assets/champions/Valiria/idle.webp',
    poster: '/assets/champions/Valiria/idle_poster.webp',
    idleAnim: '/assets/champions/Valiria/idle.webp',
    animations: {
      idle: '/assets/champions/Valiria/idle.webp',
      walk: '/assets/champions/Valiria/walk.webp',
      run: '/assets/champions/Valiria/run.webp',
      dash_front: '/assets/champions/Valiria/dash_front.webp',
      dash_back: '/assets/champions/Valiria/dash_back.webp',
      down: '/assets/champions/Valiria/down.webp',
      jump: '/assets/champions/Valiria/jump.webp',
      attack1: '/assets/champions/Valiria/attack1.webp',
      attack1_1: '/assets/champions/Valiria/attack1_1.webp',
      attack1_2: '/assets/champions/Valiria/attack1_2.webp',
      attack1_3: '/assets/champions/Valiria/attack1_3.webp',
      attack2: '/assets/champions/Valiria/attack2.webp',
      attack2_1: '/assets/champions/Valiria/attack2_1.webp',
      attack2_2: '/assets/champions/Valiria/attack2_2.webp',
      special: '/assets/champions/Valiria/special.webp',
      special2: '/assets/champions/Valiria/special2.webp',
      defend: '/assets/champions/Valiria/defend.webp',
      defend_hold: '/assets/champions/Valiria/defend.webp',
      defend_down: '/assets/champions/Valiria/defend_down.webp',
      hit: '/assets/champions/Valiria/idle.webp',
      knockdown: '/assets/champions/Valiria/down.webp',
      lose: '/assets/champions/Valiria/down.webp',
      lose_hold: '/assets/champions/Valiria/down.webp',
      victory: '/assets/champions/Valiria/idle.webp',
    },
    sounds: {
      walk: '/assets/champions/Valiria/sounds/walk.mp3',
      run: '/assets/champions/Valiria/sounds/run.mp3',
      jump: '/assets/champions/Valiria/sounds/jump.mp3',
      dash_front: '/assets/champions/Valiria/sounds/dash_front.mp3',
      dash_back: '/assets/champions/Valiria/sounds/dash_back.mp3',
      attack1: '/assets/champions/Valiria/sounds/attack1.mp3',
      attack2: '/assets/champions/Valiria/sounds/attack2.mp3',
      special: '/assets/champions/Valiria/sounds/special.mp3',
      special2: '/assets/champions/Valiria/sounds/special2.mp3',
      defend: '/assets/champions/Valiria/sounds/defend.mp3',
      hit: null,
      knockdown: null,
      lose: null,
      victory: null,
    },
    scale: 1.0,
    hp: 5200,
    atk: 96,
    def: 90,
    speed: 94,
    skillName: 'Lanza del Destino',
    skillDesc: 'Desata el poder arcano de la lanza valquiria con estocadas de luz celestial a velocidad relámpago.',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #f59e0b 100%)',
    statsSummary: { fuerza: '★★★★★', vida: '★★★★☆', agilidad: '★★★★★' },
    quote: '¡Por los cielos eternos y la gloria celestial!',
    unlocked: true,
  },

  // 10. VALIRIA RIVAL (RIVAL DE ENTRENAMIENTO)
  {
    id: 'valiria_rival',
    classId: 'valkyrie',
    gender: 'female',
    name: 'Sombra de Valiria',
    title: 'Espejo Celestial',
    role: 'Rival de Entrenamiento',
    element: 'Fuerza Astral',
    avatar: '/assets/champions/valiria_avatar.webp',
    fullImage: '/assets/champions/Valiria/idle.webp',
    poster: '/assets/champions/Valiria/idle_poster.webp',
    idleAnim: '/assets/champions/Valiria/idle.webp',
    animations: {
      idle: '/assets/champions/Valiria/idle.webp',
      walk: '/assets/champions/Valiria/walk.webp',
      run: '/assets/champions/Valiria/run.webp',
      dash_front: '/assets/champions/Valiria/dash_front.webp',
      dash_back: '/assets/champions/Valiria/dash_back.webp',
      down: '/assets/champions/Valiria/down.webp',
      jump: '/assets/champions/Valiria/jump.webp',
      attack1: '/assets/champions/Valiria/attack1.webp',
      attack1_1: '/assets/champions/Valiria/attack1_1.webp',
      attack1_2: '/assets/champions/Valiria/attack1_2.webp',
      attack1_3: '/assets/champions/Valiria/attack1_3.webp',
      attack2: '/assets/champions/Valiria/attack2.webp',
      attack2_1: '/assets/champions/Valiria/attack2_1.webp',
      attack2_2: '/assets/champions/Valiria/attack2_2.webp',
      special: '/assets/champions/Valiria/special.webp',
      special2: '/assets/champions/Valiria/special2.webp',
      defend: '/assets/champions/Valiria/defend.webp',
      defend_hold: '/assets/champions/Valiria/defend.webp',
      defend_down: '/assets/champions/Valiria/defend_down.webp',
      hit: '/assets/champions/Valiria/idle.webp',
      knockdown: '/assets/champions/Valiria/down.webp',
      lose: '/assets/champions/Valiria/down.webp',
      lose_hold: '/assets/champions/Valiria/down.webp',
      victory: '/assets/champions/Valiria/idle.webp',
    },
    sounds: {
      walk: '/assets/champions/Valiria/sounds/walk.mp3',
      run: '/assets/champions/Valiria/sounds/run.mp3',
      jump: '/assets/champions/Valiria/sounds/jump.mp3',
      dash_front: '/assets/champions/Valiria/sounds/dash_front.mp3',
      dash_back: '/assets/champions/Valiria/sounds/dash_back.mp3',
      attack1: '/assets/champions/Valiria/sounds/attack1.mp3',
      attack2: '/assets/champions/Valiria/sounds/attack2.mp3',
      special: '/assets/champions/Valiria/sounds/special.mp3',
      special2: '/assets/champions/Valiria/sounds/special2.mp3',
      defend: '/assets/champions/Valiria/sounds/defend.mp3',
      hit: null,
      knockdown: null,
      lose: null,
      victory: null,
    },
    scale: 1.0,
    hp: 5000,
    atk: 92,
    def: 88,
    speed: 90,
    skillName: 'Ira Astral',
    skillDesc: 'Réplica sombría del poder valquirio para perfeccionar reflejos en entrenamiento.',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 50%, #ec4899 100%)',
    statsSummary: { fuerza: '★★★★☆', vida: '★★★★★', agilidad: '★★★★☆' },
    quote: '¡Ponte a prueba contra tu propio reflejo celestial!',
    unlocked: true,
  },
]

export function getChampionById(id) {
  if (!id) return CHAMPIONS_LIST[0]
  const lower = String(id).toLowerCase()
  
  // Aliases for classes
  if (lower === 'kina' || lower === 'knight') return CHAMPIONS_LIST.find((c) => c.id === 'knight_male') || CHAMPIONS_LIST[0]
  if (lower === 'archer' || lower === 'archert' || lower === 'paladin') return CHAMPIONS_LIST.find((c) => c.id === 'paladin_male') || CHAMPIONS_LIST[0]
  if (lower === 'mage' || lower === 'mago') return CHAMPIONS_LIST.find((c) => c.id === 'mage_male') || CHAMPIONS_LIST[0]
  if (lower === 'healer' || lower === 'sanador' || lower === 'druid') return CHAMPIONS_LIST.find((c) => c.id === 'healer_male') || CHAMPIONS_LIST[0]

  if (lower === 'valiria' || lower === 'luke' || lower === 'kael' || lower === 'malakor') {
    return CHAMPIONS_LIST.find((c) => c.id === 'valiria') || CHAMPIONS_LIST[0]
  }
  
  return CHAMPIONS_LIST.find((c) => c.id === lower) || CHAMPIONS_LIST.find((c) => c.id === 'valiria') || CHAMPIONS_LIST[0]
}

export function getOpponentChampion(championId) {
  return CHAMPIONS_LIST.find((c) => c.id !== championId) || CHAMPIONS_LIST[0]
}

export function getRandomRivalChampion(excludeId = '') {
  const rivals = CHAMPIONS_LIST.filter((c) => c.id !== excludeId)
  if (rivals.length === 0) return CHAMPIONS_LIST[0]
  const randomIndex = Math.floor(Math.random() * rivals.length)
  return rivals[randomIndex]
}

// Frame durations & strike timings verified from animated WebP assets (24 FPS)
export const CHAMPION_ANIM_CONFIG = {
  valiria: {
    durations: {
      idle: 916,
      walk: 1560,
      run: 648,
      dash_front: 500,
      dash_back: 500,
      down: 2070,
      jump: 984,
      attack1: 2088,
      attack1_1: 990,
      attack1_2: 360,
      attack1_3: 720,
      attack2: 1320,
      attack2_1: 585,
      attack2_2: 720,
      special: 3384,
      special2: 3264,
      defend: 1176,
      defend_down: 1344,
      hit: 500,
      knockdown: 2000,
      victory: 2000,
      lose: 2000,
    },
    impactDelays: {
      attack1: 450,
      attack1_hit1: 450,
      attack1_hit2: 1150,
      attack1_hit3: 1750,
      attack2: 350,
      attack2_hit1: 350,
      attack2_hit2: 950,
      special: 1650,
      special2: 1550,
    },
    hitboxes: {
      attack1: 7.2,
      attack2: 6.8,
      special: 9.5,
      special2: 9.8,
    },
  },
  knight_male: {
    durations: {
      idle: 4312,
      walk: 1276,
      run: 660,
      dash_front: 500,
      dash_back: 500,
      jump: 504,
      attack1: 1148,
      attack1_1: 182,
      attack1_2: 350,
      attack1_3: 616,
      attack2: 742,
      attack2_1: 742,
      attack2_2: 742,
      special: 616,
      special2: 1414,
      defend: 1414,
    },
    impactDelays: {
      attack1: 40,
      attack1_hit1: 40,
      attack1_hit2: 336,
      attack1_hit3: 796,
      attack2: 190,
      attack2_hit1: 190,
      special: 260,
      special2: 200,
    },
    hitboxes: {
      attack1: 7.5,
      attack2: 7.0,
      special: 9.8,
      special2: 9.5,
    },
  },
  knight_female: {
    durations: {
      idle: 4312,
      walk: 1452,
      run: 792,
      dash_front: 500,
      dash_back: 500,
      jump: 504,
      attack1: 1148,
      attack1_1: 210,
      attack1_2: 364,
      attack1_3: 616,
      attack2: 742,
      attack2_1: 742,
      attack2_2: 742,
      special: 616,
      special2: 1414,
      defend: 1414,
    },
    impactDelays: {
      attack1: 40,
      attack1_hit1: 40,
      attack1_hit2: 346,
      attack1_hit3: 826,
      attack2: 190,
      attack2_hit1: 190,
      special: 260,
      special2: 200,
    },
    hitboxes: {
      attack1: 7.5,
      attack2: 7.0,
      special: 9.8,
      special2: 9.5,
    },
  },
  paladin_male: {
    durations: {
      idle: 2464,
      walk: 1320,
      run: 704,
      dash_front: 500,
      dash_back: 500,
      jump: 3036,
      attack1: 1320,
      attack2: 3036,
      special: 1320,
    },
  },
  paladin_female: {
    durations: {
      idle: 2464,
      walk: 1496,
      run: 704,
      dash_front: 500,
      dash_back: 500,
      jump: 2948,
      attack1: 1188,
      attack2: 2948,
      special: 1188,
    },
  },
  mage_male: { 
    durations: { 
      idle: 1672,
      walk: 3080,
      run: 3080,
      dash_front: 500,
      dash_back: 500,
      jump: 924,
      attack1: 792,
      attack2: 924,
      special: 792,
    },
  },
  mage_female: { 
    durations: { 
      idle: 2024,
      walk: 3080,
      run: 3080,
      dash_front: 500,
      dash_back: 500,
      jump: 924,
      attack1: 792,
      attack2: 924,
      special: 792,
    },
  },
  healer_male: { 
    durations: { 
      idle: 1760,
      walk: 3080,
      run: 3080,
      dash_front: 500,
      dash_back: 500,
      jump: 924,
      attack1: 792,
      attack2: 924,
      special: 792,
    },
  },
  healer_female: { 
    durations: { 
      idle: 2024,
      walk: 3080,
      run: 3080,
      dash_front: 500,
      dash_back: 500,
      jump: 924,
      attack1: 792,
      attack2: 924,
      special: 792,
    },
  },
}

export function getChampionAnimConfig(champId) {
  return CHAMPION_ANIM_CONFIG[champId] || CHAMPION_ANIM_CONFIG.valiria
}

export function getActivePlayerChampion() {
  if (typeof window === 'undefined') return getChampionById('knight_male')
  try {
    // 1. Direct active champion saved by ChampionSelectScreen
    const rawActive = localStorage.getItem('toc_active_champion')
    if (rawActive) {
      const parsed = JSON.parse(rawActive)
      const champId = parsed.championId || (parsed.classId && parsed.gender ? `${parsed.classId}_${parsed.gender}` : parsed.id)
      const base = getChampionById(champId)
      if (base) {
        return {
          ...base,
          name: parsed.name || localStorage.getItem('toc_player_name') || base.name,
          title: parsed.title || base.title,
        }
      }
    }

    // 2. Champions list for guest account across servers (global, harmonia, or general)
    const guestKeys = ['toc_champions_guest_global', 'toc_champions_guest_harmonia', 'toc_champions_guest']
    for (const k of guestKeys) {
      const rawGuest = localStorage.getItem(k)
      if (rawGuest) {
        const list = JSON.parse(rawGuest)
        if (Array.isArray(list) && list.length > 0) {
          const last = list[list.length - 1]
          const champId = last.championId || (last.classId && last.gender ? `${last.classId}_${last.gender}` : last.id)
          const base = getChampionById(champId)
          if (base) {
            return {
              ...base,
              name: last.name || localStorage.getItem('toc_player_name') || base.name,
              title: last.title || base.title,
            }
          }
        }
      }
    }

    // 3. Fallback to saved player name with knight_male (Kina)
    const savedName = localStorage.getItem('toc_player_name')
    const defaultChamp = getChampionById('knight_male')
    if (savedName) {
      return {
        ...defaultChamp,
        name: savedName,
      }
    }
  } catch (err) {
    console.warn('[ChampionsData] Error loading active player champion:', err)
  }
  return getChampionById('knight_male')
}
