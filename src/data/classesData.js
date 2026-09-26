// Classes Data System for Realm of The Clouds / PWA Web3 Core Engine
// Defined Classes:
// 1. Knight (Kina) -> Melee Tank / High Defense & HP (Male & Female)
// 2. Paladin (Archer) -> Ranged Holy Marksman / High Speed & Precision (Male & Female)
// 3. Mage (Mago) -> Offensive Burst Caster / High Arcane Power (Male & Female)
// 4. Healer (Sanador) -> Support & Restoration / Shares Mage Character with Class-specific Role (Male & Female)

export const CLASSES_CONFIG = {
  knight: {
    id: 'knight',
    name: 'Knight',
    alias: 'Knight',
    title: 'Caballero Guardián',
    role: 'Tanque de Vanguardia',
    element: 'Tierra y Acero',
    icon: 'Shield',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #38bdf8 100%)',
    description: 'Guerrero pesado impenetrable. Domina la armadura de placas, los escudos sagrados y el combate en la primera línea para absorber el mayor daño enemigo.',
    primaryStat: 'DEF',
    defaultGender: 'male',
    genders: {
      male: {
        id: 'knight_male',
        name: 'Knight',
        gender: 'male',
        genderLabel: 'Masculino',
        avatar: '/CHAMPIONS/KINA_MALE/avatar.webp',
        fullImage: '/CHAMPIONS/KINA_MALE/idle.webp',
        poster: '/CHAMPIONS/KINA_MALE/idle_poster.webp',
        idleAnim: '/CHAMPIONS/KINA_MALE/idle.webp',
        hp: 6200,
        atk: 88,
        def: 98,
        speed: 82,
        skillName: 'Muro Inquebrantable',
        skillDesc: 'Despliega una guardia férrea que eleva la resistencia física e inflige un golpe aturdidor.',
        quote: '¡Mi escudo defenderá el reino hasta el último aliento!',
      },
      female: {
        id: 'knight_female',
        name: 'Knight',
        gender: 'female',
        genderLabel: 'Femenino',
        avatar: '/CHAMPIONS/KINA_FEMALE/avatar.webp',
        fullImage: '/CHAMPIONS/KINA_FEMALE/idle.webp',
        poster: '/CHAMPIONS/KINA_FEMALE/idle_poster.webp',
        idleAnim: '/CHAMPIONS/KINA_FEMALE/idle.webp',
        hp: 6000,
        atk: 90,
        def: 96,
        speed: 85,
        skillName: 'Bastión Valiente',
        skillDesc: 'Carga frontal reforzada con un escudo de energía que desvía ataques mortales.',
        quote: '¡La fortaleza celestial no cederá ante nadie!',
      },
    },
  },

  paladin: {
    id: 'paladin',
    name: 'Paladin',
    alias: 'Paladin',
    title: 'Tirador de la Luz',
    role: 'Tirador a Distancia',
    element: 'Luz Sagrada y Viento',
    icon: 'Crosshair',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
    description: 'Tirador consagrado de precisión milimétrica. Emplea el arco y flechas imbuidas en luz sagrada para infligir daño crítico a larga distancia con máxima agilidad.',
    primaryStat: 'SPD',
    defaultGender: 'male',
    genders: {
      male: {
        id: 'paladin_male',
        name: 'Paladin',
        gender: 'male',
        genderLabel: 'Masculino',
        avatar: '/CHAMPIONS/PALADIN_MALE/avatar.webp',
        fullImage: '/CHAMPIONS/PALADIN_MALE/idle.webp',
        poster: '/CHAMPIONS/PALADIN_MALE/idle_poster.webp',
        idleAnim: '/CHAMPIONS/PALADIN_MALE/idle.webp',
        hp: 4800,
        atk: 96,
        def: 82,
        speed: 97,
        skillName: 'Lluvia de Flechas Sagradas',
        skillDesc: 'Dispara una andanada de proyectiles luminosos que perforan armaduras a gran distancia.',
        quote: '¡Ningún objetivo escapa a la flecha bendecida!',
      },
      female: {
        id: 'paladin_female',
        name: 'Paladin',
        gender: 'female',
        genderLabel: 'Femenino',
        avatar: '/CHAMPIONS/PALADIN_FEMALE/avatar.webp',
        fullImage: '/CHAMPIONS/PALADIN_FEMALE/idle.webp',
        poster: '/CHAMPIONS/PALADIN_FEMALE/idle_poster.webp',
        idleAnim: '/CHAMPIONS/PALADIN_FEMALE/idle.webp',
        hp: 4700,
        atk: 98,
        def: 80,
        speed: 99,
        skillName: 'Disparo de Fe Relámpago',
        skillDesc: 'Tiro concentrado de extrema velocidad que impacta puntos vitales con precisión fatal.',
        quote: '¡Rápida como el viento y certera como la luz!',
      },
    },
  },

  mage: {
    id: 'mage',
    name: 'Mage',
    alias: 'Mage',
    title: 'Archimago Elemental',
    role: 'Hechicero Ofensivo',
    element: 'Fuego y Arcano',
    icon: 'Flame',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #6b21a8 0%, #8b5cf6 50%, #c084fc 100%)',
    description: 'Canalizador supremo de la energía arcana y elemental. Domina hechizos destructivos capaces de pulverizar las defensas más resistentes.',
    primaryStat: 'ATK',
    defaultGender: 'male',
    genders: {
      male: {
        id: 'mage_male',
        name: 'Mage',
        gender: 'male',
        genderLabel: 'Masculino',
        avatar: '/CHAMPIONS/MAGE_MALE/avatar.webp',
        fullImage: '/CHAMPIONS/MAGE_MALE/idle.webp',
        poster: '/CHAMPIONS/MAGE_MALE/idle_poster.webp',
        idleAnim: '/CHAMPIONS/MAGE_MALE/idle.webp',
        hp: 4400,
        atk: 100,
        def: 74,
        speed: 88,
        skillName: 'Tormenta Arcana',
        skillDesc: 'Desata una tempestad de esferas arcanas que estallan sobre el enemigo con fuerza destructiva.',
        quote: '¡El poder de los cosmos arde bajo mi llamado!',
      },
      female: {
        id: 'mage_female',
        name: 'Mage',
        gender: 'female',
        genderLabel: 'Femenino',
        avatar: '/CHAMPIONS/MAGE_FEMALE/avatar.webp',
        fullImage: '/CHAMPIONS/MAGE_FEMALE/idle.webp',
        poster: '/CHAMPIONS/MAGE_FEMALE/idle_poster.webp',
        idleAnim: '/CHAMPIONS/MAGE_FEMALE/idle.webp',
        hp: 4300,
        atk: 102,
        def: 72,
        speed: 90,
        skillName: 'Vórtice Astral',
        skillDesc: 'Invocación de ondas cósmicas que desgarran la energía enemiga y causan daño masivo.',
        quote: '¡Que los astros sellen tu destino en la batalla!',
      },
    },
  },

  healer: {
    id: 'healer',
    name: 'Healer',
    alias: 'Healer',
    title: 'Custodio de la Restauración',
    role: 'Soporte y Sanación',
    element: 'Luz Celestial y Vida',
    icon: 'HeartHandshake',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)',
    description: 'Canalizador benévolo de la vida y el alivio divino. Consagra su energía a la protección, la regeneración vital y la bendición del equipo portando hábitos sagrados de luz.',
    primaryStat: 'HP',
    defaultGender: 'male',
    genders: {
      male: {
        id: 'healer_male',
        name: 'Healer',
        gender: 'male',
        genderLabel: 'Masculino',
        avatar: '/CHAMPIONS/HEALER_MALE/avatar.webp',
        fullImage: '/CHAMPIONS/HEALER_MALE/idle.webp',
        poster: '/CHAMPIONS/HEALER_MALE/idle_poster.webp',
        idleAnim: '/CHAMPIONS/HEALER_MALE/idle.webp',
        hp: 5400,
        atk: 84,
        def: 86,
        speed: 88,
        skillName: 'Gracia Restauradora',
        skillDesc: 'Emana una bendición celestial que cura heridas y otorga un escudo de regeneración continua.',
        quote: '¡La luz sagrada renueva toda vida y disipa las sombras!',
      },
      female: {
        id: 'healer_female',
        name: 'Healer',
        gender: 'female',
        genderLabel: 'Femenino',
        avatar: '/CHAMPIONS/HEALER_FEMALE/avatar.webp',
        fullImage: '/CHAMPIONS/HEALER_FEMALE/idle.webp',
        poster: '/CHAMPIONS/HEALER_FEMALE/idle_poster.webp',
        idleAnim: '/CHAMPIONS/HEALER_FEMALE/idle.webp',
        hp: 5300,
        atk: 85,
        def: 85,
        speed: 89,
        skillName: 'Aura de Vida Serena',
        skillDesc: 'Onda curativa expansiva que restaura la salud y otorga resistencia mística inmediata.',
        quote: '¡Mientras quede esperanza, la luz de la sanación no se extinguirá!',
      },
    },
  },
}

export const CLASSES_LIST = Object.values(CLASSES_CONFIG)

export function getClassById(classId) {
  if (!classId) return CLASSES_CONFIG.knight
  const lower = String(classId).toLowerCase()
  if (lower === 'kina' || lower === 'knight') return CLASSES_CONFIG.knight
  if (lower === 'archer' || lower === 'archert' || lower === 'paladin') return CLASSES_CONFIG.paladin
  if (lower === 'mage' || lower === 'mago') return CLASSES_CONFIG.mage
  if (lower === 'healer' || lower === 'sanador' || lower === 'druid') return CLASSES_CONFIG.healer
  return CLASSES_CONFIG[lower] || CLASSES_CONFIG.knight
}

export function getChampionByClassAndGender(classId, gender = 'male') {
  const cls = getClassById(classId)
  const gKey = gender === 'female' ? 'female' : 'male'
  return cls.genders[gKey]
}

// ============================================================
// CHAMPION SCALES PERSISTENCE SYSTEM (Workbench & Gameplay)
// Supports independent per-animation calibration (idle, walk, run, jump, dash)
// ============================================================
// CHAMPION SCALING SYSTEM (Per-Animation & Per-Gender Support)
// ============================================================
export const ANIM_SCALE_KEYS = [
  'idle', 
  'walk', 
  'run', 
  'jump', 
  'dash_front', 
  'dash_back', 
  'attack1', 
  'attack2', 
  'special', 
  'special2'
]

export const CHAMPION_SCALE_KEYS = [
  'knight_male',
  'knight_female',
  'paladin_male',
  'paladin_female',
  'mage_male',
  'mage_female',
  'healer_male',
  'healer_female',
]

export const DEFAULT_ANIM_SCALES = {
  idle: 1.0,
  walk: 1.0,
  run: 1.0,
  jump: 1.0,
  dash_front: 1.0,
  dash_back: 1.0,
  attack1: 1.0,
  attack2: 1.0,
  special: 1.0,
  special2: 1.0,
}

// Morphologically normalized animation scales: matches body stature of idle without shrinking/morphing
export const DEFAULT_CHAMPION_SCALES = {
  knight_male: {
    idle: 0.80,       // Sacred baseline (UNTOUCHED)
    walk: 1.14,       // Uniform action scale: aligns 288 canvas body stature with idle 576 canvas
    run: 1.14,        // Uniform action scale
    jump: 1.46,       // Jump compensation scale: perfectly aligns 145px tuck frame to 212px idle stature
    dash_front: 1.14, // Uniform action scale
    dash_back: 1.14,  // Uniform action scale
    attack1: 1.14,    // Uniform action scale: identical across all attack combos
    attack2: 1.14,    // Uniform action scale: identical across all attack combos
    special: 1.14,    // Uniform action scale: exact match to walk/idle (no morphing/shrinking)
    special2: 1.14,   // Uniform action scale: exact match to walk/idle (no morphing/shrinking)
  },
  knight_female: {
    idle: 0.80,       // Sacred baseline (UNTOUCHED)
    walk: 1.16,       // Uniform action scale
    run: 1.16,        // Uniform action scale
    jump: 1.50,       // Jump compensation scale: aligns 140px tuck frame to 212px idle stature
    dash_front: 1.16, // Uniform action scale
    dash_back: 1.16,  // Uniform action scale
    attack1: 1.16,    // Uniform action scale
    attack2: 1.16,    // Uniform action scale
    special: 1.16,    // Uniform action scale
    special2: 1.16,   // Uniform action scale
  },
  paladin_male: {
    idle: 0.80,       // Sacred baseline (UNTOUCHED)
    walk: 0.89,       // Aligns 239px walk frame to idle stature (214px)
    run: 1.04,        // +20% boost (from 0.87) for commanding sprint presence
    jump: 1.18,       // Jump compensation: aligns 181px jump frame to 214px idle stature
    dash_front: 0.98, // Proportional dash scale matching idle stature (212px)
    dash_back: 0.98,  // Proportional dash scale matching idle stature (212px)
    attack1: 0.86,    // Aligns 247px attack frame to idle stature (212.4px)
    attack2: 0.86,    // Aligns attack2 to idle stature (212.4px)
    special: 0.91,    // Aligns special sweep to idle stature (212.9px)
    special2: 0.91,   // Aligns special2 to idle stature (212.9px)
  },
  paladin_female: {
    idle: 0.80,       // Sacred baseline (UNTOUCHED)
    walk: 0.89,       // Aligns 240px walk frame to idle stature (214px)
    run: 1.02,        // +20% boost (from 0.85) for commanding sprint presence
    jump: 1.19,       // Jump compensation: aligns 179px jump frame to 213px idle stature
    dash_front: 1.08, // Full proportional stature (213px) matching idle, feet fully intact
    dash_back: 1.05,  // Full proportional stature (216px) matching idle, feet fully intact
    attack1: 0.85,    // Aligns 249px attack frame to idle stature (211.6px)
    attack2: 0.85,    // Aligns attack2 to idle stature (211.6px)
    special: 0.91,    // Aligns special sweep to idle stature (212.9px)
    special2: 0.91,   // Aligns special2 to idle stature (212.9px)
  },
  mage_male: {
    idle: 1.00,       // Sacred baseline (UNTOUCHED)
    walk: 1.01,       // Exact 1:1 match to idle stature (270px)
    run: 1.01,        // Exact 1:1 match to idle stature (270px)
    jump: 1.00,       // Exact 1:1 match to idle stature (270px)
    dash_front: 1.01, // Exact 1:1 match to idle stature (270px)
    dash_back: 1.01,  // Exact 1:1 match to idle stature (270px)
    attack1: 1.01,    // Exact 1:1 match to idle stature (270px)
    attack2: 1.00,    // Exact 1:1 match to idle stature (270px)
    special: 1.01,    // Exact 1:1 match to idle stature (270px)
    special2: 1.01,   // Exact 1:1 match to idle stature (270px)
  },
  mage_female: {
    idle: 1.00,       // Sacred baseline (UNTOUCHED)
    walk: 1.01,       // Exact 1:1 match to idle stature (278px)
    run: 1.01,        // Exact 1:1 match to idle stature (278px)
    jump: 1.00,       // Exact 1:1 match to idle stature (278px)
    dash_front: 1.01, // Exact 1:1 match to idle stature (278px)
    dash_back: 1.01,  // Exact 1:1 match to idle stature (278px)
    attack1: 1.01,    // Exact 1:1 match to idle stature (278px)
    attack2: 1.00,    // Exact 1:1 match to idle stature (278px)
    special: 1.01,    // Exact 1:1 match to idle stature (278px)
    special2: 1.01,   // Exact 1:1 match to idle stature (278px)
  },
  healer_male: {
    idle: 1.00,       // Sacred baseline (UNTOUCHED)
    walk: 1.01,       // Exact 1:1 match to idle stature (265px)
    run: 1.01,        // Exact 1:1 match to idle stature (265px)
    jump: 1.00,       // Exact 1:1 match to idle stature (265px)
    dash_front: 1.01, // Exact 1:1 match to idle stature (265px)
    dash_back: 1.01,  // Exact 1:1 match to idle stature (265px)
    attack1: 1.01,    // Exact 1:1 match to idle stature (265px)
    attack2: 1.00,    // Exact 1:1 match to idle stature (265px)
    special: 1.01,    // Exact 1:1 match to idle stature (265px)
    special2: 1.01,   // Exact 1:1 match to idle stature (265px)
  },
  healer_female: {
    idle: 1.00,       // Sacred baseline (UNTOUCHED)
    walk: 1.01,       // Exact 1:1 match to idle stature (278px)
    run: 1.01,        // Exact 1:1 match to idle stature (278px)
    jump: 1.00,       // Exact 1:1 match to idle stature (278px)
    dash_front: 1.01, // Exact 1:1 match to idle stature (278px)
    dash_back: 1.01,  // Exact 1:1 match to idle stature (278px)
    attack1: 1.01,    // Exact 1:1 match to idle stature (278px)
    attack2: 1.00,    // Exact 1:1 match to idle stature (278px)
    special: 1.01,    // Exact 1:1 match to idle stature (278px)
    special2: 1.01,   // Exact 1:1 match to idle stature (278px)
  },
}

export const DEFAULT_CLASS_SCALES = {
  ...DEFAULT_CHAMPION_SCALES,
  // Class-level fallbacks
  knight: { ...DEFAULT_CHAMPION_SCALES.knight_male },
  paladin: { ...DEFAULT_CHAMPION_SCALES.paladin_male },
  mage: { ...DEFAULT_CHAMPION_SCALES.mage_male },
  healer: { ...DEFAULT_CHAMPION_SCALES.healer_male },
}

export const STORAGE_KEY_CLASS_SCALES = 'toc_champion_class_scales_v25'
export const STORAGE_KEY_LEGACY_SCALES = 'toc_champion_class_scales_v10'

export const DEFAULT_ANIM_OFFSETS = {
  idle: 0,
  walk: 0,
  run: 0,
  jump: 0,
  dash_front: 0,
  dash_back: 0,
  attack1: 0,
  attack2: 0,
  special: 0,
  special2: 0,
}

// Ground-contact alignment offsets (in pixels): grounds floating animations cleanly to floor
export const DEFAULT_CHAMPION_OFFSETS = {
  knight_male: {
    idle: 0,          // Sacred baseline (UNTOUCHED)
    walk: -6,         // Grounds walk firmly onto floor line
    run: -6,          // Grounds run
    jump: 0,          // Jump elevation handled by physics
    dash_front: -6,   // Grounds forward dash
    dash_back: -6,    // Grounds backdash
    attack1: -6,      // Grounds attack
    attack2: -6,      // Grounds shield bash
    special: -6,      // Grounds leap slam
    special2: -6,     // Grounds shield wall
  },
  knight_female: {
    idle: 0,          // Sacred baseline (UNTOUCHED)
    walk: -6,         // Grounds walk firmly onto floor line
    run: -6,          // Grounds run
    jump: 0,          // Jump elevation handled by physics
    dash_front: -6,   // Grounds forward dash
    dash_back: -6,    // Grounds backdash
    attack1: -6,      // Grounds attack
    attack2: -6,      // Grounds shield bash
    special: -6,      // Grounds leap slam
    special2: -6,     // Grounds shield wall
  },
  paladin_male: {
    idle: 0,          // Sacred baseline (UNTOUCHED)
    walk: -8,         // Grounds walk firmly onto floor line
    run: -8,          // Grounds sprint stride so feet plant cleanly on floor
    jump: -6,         // Grounds jump start/land firmly onto floor line
    dash_front: -4,   // Clean floor contact, zero cutting
    dash_back: -4,    // Clean floor contact, zero cutting
    attack1: -4,      // Grounds attack
    attack2: -4,      // Grounds attack
    special: -4,      // Grounds special
    special2: -4,     // Grounds special
  },
  paladin_female: {
    idle: 0,          // Sacred baseline (UNTOUCHED)
    walk: -8,         // Grounds walk firmly onto floor line
    run: -8,          // Grounds sprint stride so feet plant cleanly on floor
    jump: -6,         // Grounds jump start/land firmly onto floor line
    dash_front: -4,   // Clean floor contact, zero feet cutting
    dash_back: -4,    // Clean floor contact, zero feet cutting
    attack1: -4,      // Grounds attack
    attack2: -4,      // Grounds attack
    special: -4,      // Grounds special
    special2: -4,     // Grounds special
  },
  mage_male: {
    idle: 0,          // Sacred baseline (UNTOUCHED)
    walk: 0,          // Natural floor alignment (feet at 287px)
    run: 0,           // Natural floor alignment (feet at 287px)
    jump: -3,         // Grounds takeoff/landing firmly onto floor line
    dash_front: -4,   // Grounds lunge onto floor line
    dash_back: 0,     // Natural floor alignment (feet at 287px)
    attack1: -4,      // Grounds attack onto floor line
    attack2: -3,      // Grounds leap onto floor line
    special: -4,      // Grounds special onto floor line
    special2: -4,     // Grounds special onto floor line
  },
  mage_female: {
    idle: 0,          // Sacred baseline (UNTOUCHED)
    walk: 0,          // Natural floor alignment (feet at 287px)
    run: 0,           // Natural floor alignment (feet at 287px)
    jump: -3,         // Grounds takeoff/landing firmly onto floor line
    dash_front: -4,   // Grounds lunge onto floor line
    dash_back: 0,     // Natural floor alignment (feet at 287px)
    attack1: -4,      // Grounds attack onto floor line
    attack2: -3,      // Grounds leap onto floor line
    special: -4,      // Grounds special onto floor line
    special2: -4,     // Grounds special onto floor line
  },
  healer_male: {
    idle: 0,          // Sacred baseline (UNTOUCHED)
    walk: 0,          // Natural floor alignment (feet at 286px)
    run: 0,           // Natural floor alignment (feet at 286px)
    jump: -3,         // Grounds takeoff/landing firmly onto floor line
    dash_front: -4,   // Grounds lunge onto floor line
    dash_back: 0,     // Natural floor alignment (feet at 287px)
    attack1: -4,      // Grounds attack onto floor line
    attack2: -3,      // Grounds leap onto floor line
    special: -4,      // Grounds special onto floor line
    special2: -4,     // Grounds special onto floor line
  },
  healer_female: {
    idle: 0,          // Sacred baseline (UNTOUCHED)
    walk: 0,          // Natural floor alignment (feet at 287px)
    run: 0,           // Natural floor alignment (feet at 287px)
    jump: -3,         // Grounds takeoff/landing firmly onto floor line
    dash_front: -4,   // Grounds lunge onto floor line
    dash_back: 0,     // Natural floor alignment (feet at 287px)
    attack1: -4,      // Grounds attack onto floor line
    attack2: -3,      // Grounds leap onto floor line
    special: -4,      // Grounds special onto floor line
    special2: -4,     // Grounds special onto floor line
  },
}

export const DEFAULT_CLASS_OFFSETS = {
  ...DEFAULT_CHAMPION_OFFSETS,
  knight: { ...DEFAULT_CHAMPION_OFFSETS.knight_male },
  paladin: { ...DEFAULT_CHAMPION_OFFSETS.paladin_male },
  mage: { ...DEFAULT_CHAMPION_OFFSETS.mage_male },
  healer: { ...DEFAULT_CHAMPION_OFFSETS.healer_male },
}

export const STORAGE_KEY_CLASS_OFFSETS = 'toc_champion_class_offsets_v14'

function normalizeAnimOffsetObject(val, defaultObj = null) {
  if (typeof val === 'number') {
    const clamped = Math.max(-100, Math.min(100, Math.round(val)))
    const res = {}
    for (const k of ANIM_SCALE_KEYS) res[k] = clamped
    return res
  }
  const res = {}
  for (const k of ANIM_SCALE_KEYS) {
    const fallback = defaultObj?.[k] ?? defaultObj?.idle ?? 0
    const raw = val?.[k] ?? fallback
    const n = typeof raw === 'number' ? raw : parseFloat(raw)
    res[k] = (!isNaN(n) && n >= -100 && n <= 100) ? Math.round(n) : fallback
  }
  return res
}

export function getSavedClassOffsets() {
  if (typeof localStorage === 'undefined') {
    return JSON.parse(JSON.stringify(DEFAULT_CLASS_OFFSETS))
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLASS_OFFSETS)
    if (raw) {
      const parsed = JSON.parse(raw)
      const res = {}
      for (const k of CHAMPION_SCALE_KEYS) {
        const classPrefix = k.split('_')[0]
        const val = parsed?.[k] ?? parsed?.[classPrefix]
        res[k] = normalizeAnimOffsetObject(val, DEFAULT_CHAMPION_OFFSETS[k])
      }
      for (const c of ['knight', 'paladin', 'mage', 'healer']) {
        res[c] = res[`${c}_male`] || normalizeAnimOffsetObject(parsed?.[c], DEFAULT_CHAMPION_OFFSETS[`${c}_male`])
      }
      return res
    }
  } catch (e) {
    console.warn('Failed to parse saved class offsets:', e)
  }
  return JSON.parse(JSON.stringify(DEFAULT_CLASS_OFFSETS))
}

export function saveClassOffsets(offsets) {
  if (typeof localStorage === 'undefined') return false
  try {
    const sanitized = {}
    for (const k of CHAMPION_SCALE_KEYS) {
      const classPrefix = k.split('_')[0]
      const val = offsets?.[k] ?? offsets?.[classPrefix]
      sanitized[k] = normalizeAnimOffsetObject(val)
    }
    for (const c of ['knight', 'paladin', 'mage', 'healer']) {
      sanitized[c] = sanitized[`${c}_male`]
    }

    localStorage.setItem(STORAGE_KEY_CLASS_OFFSETS, JSON.stringify(sanitized))

    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('toc_champion_scales_updated', { detail: { offsets: sanitized } }))
      }, 0)
    }

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('toc_scales_sync_channel')
        channel.postMessage({ type: 'OFFSETS_UPDATED', offsets: sanitized, timestamp: Date.now() })
        channel.close()
      }
    } catch {}

    try {
      if (typeof fetch !== 'undefined') {
        fetch('/api/offsets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitized),
        }).catch(() => {})
      }
    } catch {}

    return true
  } catch (e) {
    console.error('Failed to save class offsets:', e)
    return false
  }
}

function normalizeAnimScaleObject(val, defaultObj = null) {
  if (typeof val === 'number') {
    const clamped = Math.max(0.2, Math.min(3.0, Math.round(val * 100) / 100))
    const res = {}
    for (const k of ANIM_SCALE_KEYS) res[k] = clamped
    return res
  }
  const res = {}
  for (const k of ANIM_SCALE_KEYS) {
    const fallback = defaultObj?.[k] ?? defaultObj?.idle ?? 1.0
    const raw = val?.[k] ?? fallback
    const n = typeof raw === 'number' ? raw : parseFloat(raw)
    res[k] = (!isNaN(n) && n >= 0.2 && n <= 3.0) ? Math.round(n * 100) / 100 : fallback
  }
  return res
}

export function resolveChampionScaleKey(identifier, gender = null) {
  if (!identifier) return 'knight_male'
  const str = String(
    (typeof identifier === 'object' ? (identifier.id || identifier.classId || identifier.className) : identifier) || ''
  ).toLowerCase()

  // 1. Detect class
  let classKey = 'knight'
  if (str.includes('paladin') || str.includes('archer') || str.includes('arquero') || str.includes('arquera')) {
    classKey = 'paladin'
  } else if (str.includes('mage') || str.includes('mago') || str.includes('maga') || str.includes('caster')) {
    classKey = 'mage'
  } else if (str.includes('healer') || str.includes('sanador') || str.includes('sanadora') || str.includes('druid')) {
    classKey = 'healer'
  } else {
    classKey = 'knight'
  }

  // 2. Detect gender
  let genderKey = 'male'
  const gStr = String(
    gender || 
    (typeof identifier === 'object' ? identifier.gender : '') || 
    ''
  ).toLowerCase()

  if (gStr === 'female' || gStr === 'femenino' || gStr === 'mujer' || gStr === 'f') {
    genderKey = 'female'
  } else if (gStr === 'male' || gStr === 'masculino' || gStr === 'hombre' || gStr === 'm') {
    genderKey = 'male'
  } else if (str.includes('female') || str.includes('mujer') || str.includes('valiria') || str.includes('arquera') || str.includes('maga')) {
    genderKey = 'female'
  } else {
    genderKey = 'male'
  }

  return `${classKey}_${genderKey}`
}

export function getSavedClassScales() {
  if (typeof localStorage === 'undefined') {
    return JSON.parse(JSON.stringify(DEFAULT_CLASS_SCALES))
  }
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY_CLASS_SCALES)
    if (rawV2) {
      const parsed = JSON.parse(rawV2)
      const res = {}
      for (const k of CHAMPION_SCALE_KEYS) {
        const classPrefix = k.split('_')[0]
        const val = parsed?.[k] ?? parsed?.[classPrefix]
        res[k] = normalizeAnimScaleObject(val, DEFAULT_CHAMPION_SCALES[k])
      }
      for (const c of ['knight', 'paladin', 'mage', 'healer']) {
        res[c] = res[`${c}_male`] || normalizeAnimScaleObject(parsed?.[c], DEFAULT_CHAMPION_SCALES[`${c}_male`])
      }
      return res
    }
  } catch (e) {
    console.warn('Failed to parse saved class scales:', e)
  }
  return JSON.parse(JSON.stringify(DEFAULT_CLASS_SCALES))
}

export function saveClassScales(scales) {
  if (typeof localStorage === 'undefined') return false
  try {
    const sanitized = {}
    for (const k of CHAMPION_SCALE_KEYS) {
      const classPrefix = k.split('_')[0]
      const val = scales?.[k] ?? scales?.[classPrefix]
      sanitized[k] = normalizeAnimScaleObject(val)
    }
    // Also include class-level keys for backwards-compatibility
    for (const c of ['knight', 'paladin', 'mage', 'healer']) {
      sanitized[c] = sanitized[`${c}_male`]
    }

    // Save v2
    localStorage.setItem(STORAGE_KEY_CLASS_SCALES, JSON.stringify(sanitized))

    // Dispatch async event in the current window
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('toc_champion_scales_updated', { detail: { scales: sanitized, ...sanitized } }))
      }, 0)
    }

    // Broadcast in real-time to other browser tabs/windows (0ms latency for dual-monitor live tuning)
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('toc_scales_sync_channel')
        channel.postMessage({ type: 'SCALES_UPDATED', scales: sanitized, timestamp: Date.now() })
        channel.close()
      }
    } catch {}

    // 3. Broadcast to Tauri Desktop Launcher / Local Dev Server WebSocket bridge (<5ms latency across different apps/processes)
    try {
      if (typeof fetch !== 'undefined') {
        fetch('/api/scales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitized),
        }).catch(() => {})
      }
    } catch {}

    return true
  } catch (e) {
    console.error('Failed to save class scales:', e)
    return false
  }
}

// Global cross-window and cross-process listener (activates in Tauri Launcher, Chrome, Safari, etc.)
if (typeof window !== 'undefined') {
  // Purge any stale or corrupted scale/offset keys from older sessions
  try {
    const staleKeys = [
      'toc_champion_class_scales_v1',
      'toc_champion_class_scales_v2',
      'toc_champion_class_scales_v10',
      'toc_champion_class_scales_v11',
      'toc_champion_class_scales_v12',
      'toc_champion_class_scales_v13',
      'toc_champion_class_scales_v14',
      'toc_champion_class_scales_v15',
      'toc_champion_class_scales_v16',
      'toc_champion_class_scales_v17',
      'toc_champion_class_scales_v18',
      'toc_champion_class_scales_v24',
      'toc_champion_class_offsets_v1',
      'toc_champion_class_offsets_v2',
      'toc_champion_class_offsets_v3',
      'toc_champion_class_offsets_v4',
      'toc_champion_class_offsets_v5',
      'toc_champion_class_offsets_v6',
      'toc_champion_class_offsets_v7',
      'toc_champion_class_offsets_v8',
      'toc_champion_class_offsets_v13',
    ]
    staleKeys.forEach((k) => localStorage.removeItem(k))
  } catch {}

  // 1. Storage event listener (fires in all other tabs within the same browser engine)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY_CLASS_SCALES || e.key === STORAGE_KEY_CLASS_OFFSETS) {
      window.dispatchEvent(new CustomEvent('toc_champion_scales_updated', { 
        detail: { scales: getSavedClassScales(), offsets: getSavedClassOffsets() } 
      }))
    }
  })

  // 2. BroadcastChannel listener (instant sub-millisecond sync across tabs/monitors)
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const syncChannel = new BroadcastChannel('toc_scales_sync_channel')
      syncChannel.onmessage = (event) => {
        if (event.data?.type === 'SCALES_UPDATED' && event.data?.scales) {
          window.dispatchEvent(new CustomEvent('toc_champion_scales_updated', { detail: { scales: event.data.scales, ...event.data.scales } }))
        } else if (event.data?.type === 'OFFSETS_UPDATED' && event.data?.offsets) {
          window.dispatchEvent(new CustomEvent('toc_champion_scales_updated', { detail: { offsets: event.data.offsets, ...event.data.offsets } }))
        }
      }
    }
  } catch {}

  // 3. Vite WebSocket bridge: bridges Tauri Desktop App with external browsers (Chrome, Safari, Edge)
  if (typeof import.meta !== 'undefined' && import.meta.hot) {
    import.meta.hot.on('toc:scales_sync', (serverScales) => {
      if (serverScales && typeof serverScales === 'object') {
        try {
          localStorage.setItem(STORAGE_KEY_CLASS_SCALES, JSON.stringify(serverScales))
        } catch {}
        window.dispatchEvent(new CustomEvent('toc_champion_scales_updated', { detail: { scales: serverScales, ...serverScales } }))
      }
    })
    import.meta.hot.on('toc:offsets_sync', (serverOffsets) => {
      if (serverOffsets && typeof serverOffsets === 'object') {
        try {
          localStorage.setItem(STORAGE_KEY_CLASS_OFFSETS, JSON.stringify(serverOffsets))
        } catch {}
        window.dispatchEvent(new CustomEvent('toc_champion_scales_updated', { detail: { offsets: serverOffsets, ...serverOffsets } }))
      }
    })
  }

  // 4. Polling Fallback: guarantees 100% synchronization even if background tab throttles WebSockets
  if (typeof fetch !== 'undefined') {
    let lastKnownScalesJson = ''
    let lastKnownOffsetsJson = ''
    const pollServerSync = () => {
      fetch('/api/scales')
        .then((res) => (res.ok ? res.json() : null))
        .then((remoteData) => {
          if (remoteData && Object.keys(remoteData).length > 0) {
            const jsonStr = JSON.stringify(remoteData)
            if (jsonStr !== lastKnownScalesJson) {
              lastKnownScalesJson = jsonStr
              localStorage.setItem(STORAGE_KEY_CLASS_SCALES, jsonStr)
              window.dispatchEvent(new CustomEvent('toc_champion_scales_updated', { detail: { scales: remoteData, ...remoteData } }))
            }
          }
        })
        .catch(() => {})

      fetch('/api/offsets')
        .then((res) => (res.ok ? res.json() : null))
        .then((remoteOffsets) => {
          if (remoteOffsets && Object.keys(remoteOffsets).length > 0) {
            const jsonStr = JSON.stringify(remoteOffsets)
            if (jsonStr !== lastKnownOffsetsJson) {
              lastKnownOffsetsJson = jsonStr
              localStorage.setItem(STORAGE_KEY_CLASS_OFFSETS, jsonStr)
              window.dispatchEvent(new CustomEvent('toc_champion_scales_updated', { detail: { offsets: remoteOffsets, ...remoteOffsets } }))
            }
          }
        })
        .catch(() => {})
    }
    // Initial fetch on launch
    setTimeout(pollServerSync, 100)
    // Recurring fast poll (350ms) for instant live sync
    setInterval(pollServerSync, 350)
  }
}

export function getClassScale(identifier, animKey = 'idle', gender = null, overrideScales = null) {
  const scales = overrideScales || getSavedClassScales()
  const key = resolveChampionScaleKey(identifier, gender)
  const classAnimObj = scales[key] || scales[key.split('_')[0]] || DEFAULT_CHAMPION_SCALES[key] || DEFAULT_ANIM_SCALES
  if (typeof classAnimObj === 'number') return classAnimObj

  // Normalize animKey
  const aLower = String(animKey || 'idle').toLowerCase()
  let targetAnim = 'idle'
  if (aLower.includes('walk')) targetAnim = 'walk'
  else if (aLower.includes('run')) targetAnim = 'run'
  else if (aLower.includes('jump')) targetAnim = 'jump'
  else if (aLower.includes('dash_back')) targetAnim = 'dash_back'
  else if (aLower.includes('dash')) targetAnim = 'dash_front'
  else if (aLower.includes('special2') || aLower.includes('wall') || aLower.includes('muro')) targetAnim = 'special2'
  else if (aLower.includes('special') || aLower.includes('aoe') || aLower.includes('slam')) targetAnim = 'special'
  else if (aLower.includes('attack2') || aLower.includes('bash')) targetAnim = 'attack2'
  else if (aLower.includes('attack')) targetAnim = 'attack1'
  else targetAnim = 'idle'

  return classAnimObj[targetAnim] ?? classAnimObj.idle ?? DEFAULT_CHAMPION_SCALES[key]?.idle ?? 1.0
}

export function getClassOffsetY(identifier, animKey = 'idle', gender = null, overrideOffsets = null) {
  const offsets = overrideOffsets || getSavedClassOffsets()
  const key = resolveChampionScaleKey(identifier, gender)
  const classAnimObj = offsets[key] || offsets[key.split('_')[0]] || DEFAULT_ANIM_OFFSETS
  if (typeof classAnimObj === 'number') return classAnimObj

  // Normalize animKey
  const aLower = String(animKey || 'idle').toLowerCase()
  let targetAnim = 'idle'
  if (aLower.includes('walk')) targetAnim = 'walk'
  else if (aLower.includes('run')) targetAnim = 'run'
  else if (aLower.includes('jump')) targetAnim = 'jump'
  else if (aLower.includes('dash_back')) targetAnim = 'dash_back'
  else if (aLower.includes('dash')) targetAnim = 'dash_front'
  else if (aLower.includes('special2') || aLower.includes('wall') || aLower.includes('muro')) targetAnim = 'special2'
  else if (aLower.includes('special') || aLower.includes('aoe') || aLower.includes('slam')) targetAnim = 'special'
  else if (aLower.includes('attack2') || aLower.includes('bash')) targetAnim = 'attack2'
  else if (aLower.includes('attack')) targetAnim = 'attack1'
  else targetAnim = 'idle'

  return classAnimObj[targetAnim] ?? classAnimObj.idle ?? 0
}


