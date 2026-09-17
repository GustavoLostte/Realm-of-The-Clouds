// Champions Data System for Character Selection & PvP Combat
// Exactly 2 official playable champions with ultra-optimized arcade animations:
// Luke (Ángel Celestial) & Lord Malakor (Señor del Caos)

export const CHAMPIONS_LIST = [
  {
    id: 'luke',
    name: 'Luke',
    title: 'Ángel Celestial',
    role: 'Paladín Sagrado',
    element: 'Luz Celestial',
    avatar: '/assets/champions/luke_avatar.webp',
    fullImage: '/assets/champions/luke/idle.webp',
    poster: '/assets/champions/luke/idle_poster.webp',
    idleAnim: '/assets/champions/luke/idle.webp',
    animations: {
      idle: '/assets/champions/luke/idle.webp',
      walk: '/assets/champions/luke/walk.webp',
      run: '/assets/champions/luke/run.webp',
      attack1: '/assets/champions/luke/attack1.webp',
      attack2: '/assets/champions/luke/attack2.webp',
      special: '/assets/champions/luke/attack_special.webp',
      defend: '/assets/champions/luke/defend.webp',
      defend_hold: '/assets/champions/luke/defend_hold.webp',
      hit: '/assets/champions/luke/hit.webp',
      knockdown: '/assets/champions/luke/knockdown.webp',
      jump: '/assets/champions/luke/jump.webp',
      lose: '/assets/champions/luke/lose.webp',
      lose_hold: '/assets/champions/luke/lose_hold.webp',
      victory: '/assets/champions/luke/victory.webp',
    },
    sounds: {
      attack1: '/assets/champions/luke/sounds/attack1.mp3',
      attack2: '/assets/champions/luke/sounds/attack2.mp3',
      special: '/assets/champions/luke/sounds/attack_special.mp3',
      jump: '/assets/champions/luke/sounds/jump.mp3',
      run: '/assets/champions/luke/sounds/run.mp3',
      walk: '/assets/champions/luke/sounds/walk.mp3',
      hit: '/assets/champions/luke/sounds/hit.mp3',
      knockdown: '/assets/champions/luke/sounds/knockdown.mp3',
      lose: '/assets/champions/luke/sounds/knockdown.mp3',
      victory: '/assets/champions/luke/sounds/victory.mp3',
    },
    scale: 1.0,
    hp: 4800,
    atk: 93,
    def: 87,
    speed: 82,
    skillName: 'Sentencia Celestial',
    skillDesc: 'Desata el fulgor de las alas celestiales con ráfagas de luz sagrada que pulverizan las defensas.',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #93c5fd 100%)',
    statsSummary: { fuerza: '★★★★☆', vida: '★★★★★', agilidad: '★★★★☆' },
    quote: '¡Por las alas de Aetheria y la gloria de la luz!',
    unlocked: true,
  },
  {
    id: 'malakor',
    name: 'Lord Malakor',
    title: 'Señor del Caos',
    role: 'Conquistador Oscuro',
    element: 'Fuego Infernal',
    avatar: '/assets/champions/malakor_avatar.webp',
    fullImage: '/assets/champions/malakor/idle.webp',
    poster: '/assets/champions/malakor/idle_poster.webp',
    idleAnim: '/assets/champions/malakor/idle.webp',
    animations: {
      idle: '/assets/champions/malakor/idle.webp',
      walk: '/assets/champions/malakor/walk.webp',
      run: '/assets/champions/malakor/run.webp',
      attack1: '/assets/champions/malakor/attack1.webp',
      attack2: '/assets/champions/malakor/attack2.webp',
      special: '/assets/champions/malakor/attack_special.webp',
      defend: '/assets/champions/malakor/defend.webp',
      defend_hold: '/assets/champions/malakor/defend_hold.webp',
      hit: '/assets/champions/malakor/hit.webp',
      knockdown: '/assets/champions/malakor/knockdown.webp',
      jump: '/assets/champions/malakor/jump.webp',
      lose: '/assets/champions/malakor/lose.webp',
      lose_hold: '/assets/champions/malakor/lose_hold.webp',
      victory: '/assets/champions/malakor/victory.webp',
    },
    sounds: {
      attack1: '/assets/champions/malakor/sounds/attack1.mp3',
      attack2: '/assets/champions/malakor/sounds/attack2.mp3',
      special: '/assets/champions/malakor/sounds/attack_special.mp3',
      jump: '/assets/champions/malakor/sounds/jump.mp3',
      run: '/assets/champions/malakor/sounds/run.mp3',
      hit: '/assets/champions/malakor/sounds/hit.mp3',
      knockdown: '/assets/champions/malakor/sounds/knockdown.mp3',
      lose: '/assets/champions/malakor/sounds/knockdown.mp3',
      victory: '/assets/champions/malakor/sounds/victory.mp3',
    },
    scale: 1.0,
    hp: 5000,
    atk: 95,
    def: 84,
    speed: 78,
    skillName: 'Ira Devastadora',
    skillDesc: 'Canaliza llamas oscuras que calcinan la armadura enemiga provocando daño devastador por quemadura.',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #b91c1c 0%, #ef4444 50%, #fca5a5 100%)',
    statsSummary: { fuerza: '★★★★★', vida: '★★★★☆', agilidad: '★★★★☆' },
    quote: '¡Arrodíllate ante el poder supremo del fuego oscuro!',
    unlocked: true,
  },
]

export function getChampionById(id) {
  if (id === 'kael' || id === 'luke') {
    return CHAMPIONS_LIST.find((c) => c.id === 'luke') || CHAMPIONS_LIST[0]
  }
  return CHAMPIONS_LIST.find((c) => c.id === id) || CHAMPIONS_LIST[0]
}

export function getOpponentChampion(championId) {
  return (championId === 'luke' || championId === 'kael') ? CHAMPIONS_LIST[1] : CHAMPIONS_LIST[0]
}

export function getRandomRivalChampion(excludeId = '') {
  return getOpponentChampion(excludeId)
}

// Exact frame durations and strike impact timings verified from animated WebP assets (24 FPS)
export const CHAMPION_ANIM_CONFIG = {
  luke: {
    durations: {
      idle: 1230,
      walk: 1271,
      run: 984,
      attack1: 484,    // 22 frames @ 45fps (fast snappy response < 0.5s, audio: 0.54s)
      attack2: 1722,   // 42 frames @ 24fps
      special: 4223,   // 103 frames @ 24fps
      defend: 300,     // 15 frames @ 50fps (2x faster guard transition, 300ms)
      hit: 500,        // 36 frames @ 72fps (calibrated to exactly 0.50s on impact)
      jump: 1344,      // 48 frames @ 36fps (50% faster playback, audio: 1.36s)
      knockdown: 2665, // 65 frames @ 24fps
      victory: 2952,   // 72 frames @ 24fps
      lose: 2665,      // 65 frames @ 24fps
    },
    impactDelays: {
      attack1: 240,    // Impact at MIDPOINT of animation (~240ms / 484ms, when the sword strikes)
      attack2: 1722,   // Full animation duration (42 frames @ 24fps)
      attack2_hit1: 410,  // Impact 1: al principio del combo (frame 10, ~410ms)
      attack2_hit2: 860,  // Impact 2: segundo tajo sincronizado al filo (frame 21, ~860ms)
      special: 2100,   // Impact at midpoint of special burst (~2100ms / 4223ms)
    },
    hitboxes: {
      attack1: 5.8,    // Close-quarters melee reach (reduced from 11.6 to prevent hitting from afar)
      attack2: 6.8,    // Heavy blade arc reach (reduced from 12.4)
      special: 8.0,    // Melee burst radius (reduced from 14.0)
    },
  },
  malakor: {
    durations: {
      idle: 1517,
      walk: 1394,
      run: 820,
      attack1: 496,    // 31 frames @ 62fps (fast snappy response < 0.5s, audio: 0.60s)
      attack2: 902,    // 22 frames @ 24fps
      special: 3116,   // 76 frames @ 24fps
      defend: 420,     // 21 frames @ 50fps (2x faster guard transition, 420ms)
      hit: 500,        // 14 frames @ 28fps (calibrated to exactly 0.50s on impact)
      jump: 1260,      // 45 frames @ 36fps (50% faster playback, audio: 1.30s)
      knockdown: 2706, // 66 frames @ 24fps
      victory: 2173,   // 53 frames @ 24fps
      lose: 3936,      // 96 frames @ 24fps
    },
    impactDelays: {
      attack1: 240,    // Impact at MIDPOINT of animation (~240ms / 496ms, when the sword strikes)
      attack2: 902,    // Full animation duration (22 frames @ 24fps)
      attack2_hit1: 300,  // Impact 1: al principio del combo (frame 8, ~300ms)
      attack2_hit2: 670,  // Impact 2: al final del combo (frame 15, ~670ms)
      special: 1550,   // Impact at midpoint of special burst (~1550ms / 3116ms)
    },
    hitboxes: {
      attack1: 5.8,    // Close-quarters melee reach (reduced from 11.6 to prevent hitting from afar)
      attack2: 6.8,    // Heavy blade arc reach (reduced from 12.4)
      special: 8.0,    // Melee burst radius (reduced from 14.0)
    },
  },
}

export function getChampionAnimConfig(champId) {
  if (champId === 'luke' || champId === 'kael') {
    return CHAMPION_ANIM_CONFIG.luke
  }
  return CHAMPION_ANIM_CONFIG.malakor
}

