// questsData.js - Dynamic Chapter-based Quests and Objective Tracking Engine
import { BUILDING_TYPES } from './buildingsData.js'

export const CHAPTERS_DATA = [
  {
    id: 1,
    title: 'Capítulo I: El Despertar en las Alturas',
    subtitle: 'Reconstruye el santuario sagrado y consolida tu primer asentamiento sobre el mar de nubes.',
    badge: 'Capítulo I',
    icon: '/assets/hud_icons/btn_upgrade.webp',
  },
  {
    id: 2,
    title: 'Capítulo II: La Tempestad en las Alturas',
    subtitle: 'Repele a los invasores del abismo y refuerza la flota defensiva de la ciudadela.',
    badge: 'Capítulo II',
    icon: '/assets/hud_icons/btn_army.webp',
  },
  {
    id: 3,
    title: 'Capítulo III: Los Guardianes del Firmamento',
    subtitle: 'Purifica las criaturas legendarias corrompidas y restaura la armonía del cielo.',
    badge: 'Capítulo III',
    icon: '/assets/hud_icons/icon_skull.webp',
  },
  {
    id: 4,
    title: 'Capítulo IV: La Gloria del Reino Celestial',
    subtitle: 'Domina los portales astrales y alza la ciudadela más resplandeciente sobre las nubes.',
    badge: 'Capítulo IV',
    icon: '/assets/hud_icons/icon_crown.webp',
  },
]

export const STORY_QUESTS = [
  // --- CAPÍTULO I: EL RENACER DEL FEUDO (Flujo Progresivo del Reino) ---
  {
    id: 'q-c1-1',
    chapter: 1,
    title: 'La Sede de la Corona',
    desc: 'Posee el Castillo Imperial en la plaza mayor para consolidar el mando real.',
    hint: 'Tu castillo ya preside la plaza mayor. Reclama tu primer decreto real para recibir provisiones iniciales de la corona.',
    actionType: 'claim',
    targetBuilding: 'ayuntamiento',
    actionLabel: 'Reclamar Decreto',
    reward: { gold: 250, wood: 200, stone: 200, food: 150, xp: 120 },
    evaluate: (state) => {
      const hasCastle = state.slots.some(
        (s) => s.buildingId === 'ayuntamiento' || s.buildingId === 'castillo'
      )
      return { completed: hasCastle, current: hasCastle ? 1 : 0, max: 1 }
    },
  },
  {
    id: 'q-c1-2',
    chapter: 1,
    title: 'El Molino Alado',
    desc: 'Inspecciona el Molino Celestial en el flanco sur para asegurar las reservas de harina y trigo.',
    hint: 'El molino alado genera recursos indispensables para alimentar al reino y la guarnición.',
    actionType: 'inspect',
    targetBuilding: 'casa_molino',
    actionLabel: 'Ver Molino',
    reward: { gold: 250, wood: 150, stone: 150, gems: 10, xp: 150 },
    evaluate: (state) => {
      const hasMill = state.slots.some((s) => s.buildingId === 'casa_molino')
      return { completed: hasMill, current: hasMill ? 1 : 0, max: 1 }
    },
  },
  {
    id: 'q-c1-3',
    chapter: 1,
    title: 'La Gran Bóveda Real',
    desc: 'Inspecciona la Bóveda del Tesoro en la terraza oriental para gestionar el acopio imperial.',
    hint: 'La Gran Bóveda custodia los recursos imperiales y expande la capacidad de tus arcas.',
    actionType: 'inspect',
    targetBuilding: 'almacen',
    actionLabel: 'Ver Bóveda',
    reward: { gold: 200, wood: 180, stone: 180, food: 120, xp: 140 },
    evaluate: (state) => {
      const hasVault = state.slots.some((s) => s.buildingId === 'almacen')
      return { completed: hasVault, current: hasVault ? 1 : 0, max: 1 }
    },
  },
  {
    id: 'q-c1-4',
    chapter: 1,
    title: 'El Fruto del Trabajo',
    desc: 'Recolecta tributos o recursos generados por tus edificios en la plaza.',
    hint: 'Toca el globo flotante de recursos sobre un edificio o pulsa "Cosechar Todo" en la barra superior.',
    actionType: 'harvest',
    actionLabel: 'Recolectar Recursos',
    reward: { gold: 200, wood: 120, stone: 120, food: 100, xp: 130 },
    evaluate: (state) => {
      const harvestCount = state.totalHarvests || 0
      const hasCollected = harvestCount >= 1
      return { completed: hasCollected, current: hasCollected ? 1 : 0, max: 1 }
    },
  },
  {
    id: 'q-c1-5',
    chapter: 1,
    title: 'Crecimiento Progresivo',
    desc: 'Mejora el Molino Alado o cualquier edificio al Nivel 2 para elevar la prosperidad del reino.',
    hint: 'Haz clic en una estructura existente y selecciona "Mejorar Edificio" para subir su nivel al instante.',
    actionType: 'upgrade',
    actionLabel: 'Mejorar Estructura',
    reward: { gold: 220, wood: 150, stone: 150, xp: 160 },
    evaluate: (state) => {
      const upgraded = state.slots.some((s) => s.buildingId && (s.level || 1) >= 2)
      return { completed: upgraded, current: upgraded ? 1 : 0, max: 1 }
    },
  },
  {
    id: 'q-c1-6',
    chapter: 1,
    title: 'El Portal Arcano',
    desc: 'Inspecciona el Portal Arcano situado en la terraza occidental junto al Ángel Centinela.',
    hint: 'El portal místico canaliza las corrientes astrales y conecta el reino con dimensiones inexploradas.',
    actionType: 'inspect',
    targetBuilding: 'portal',
    actionLabel: 'Ver Portal',
    reward: { gold: 250, wood: 150, stone: 150, food: 150, xp: 180 },
    evaluate: (state) => {
      const hasPortal = state.slots.some((s) => s.buildingId === 'portal' || s.buildingId === 'portal_arcano')
      return { completed: hasPortal, current: hasPortal ? 1 : 0, max: 1 }
    },
  },
  {
    id: 'q-c1-7',
    chapter: 1,
    title: 'Instrucción de la Guardia',
    desc: 'Recluta al menos 4 soldados en tu guarnición desde el panel militar.',
    hint: 'Abre el menú militar y entrena reclutas usando oro y víveres para defender la plaza.',
    actionType: 'army',
    actionLabel: 'Reclutar Tropas',
    reward: { gold: 250, food: 150, gems: 10, xp: 200 },
    evaluate: (state) => {
      const totalTroops =
        (state.troops.infantry || 0) +
        (state.troops.archers || 0) +
        (state.troops.mages || 0) +
        (state.troops.commander || 0)
      return { completed: totalTroops >= 4, current: Math.min(totalTroops, 4), max: 4 }
    },
  },
  {
    id: 'q-c1-8',
    chapter: 1,
    title: 'Vigía y Defensa Imperial',
    desc: 'Eleva el Palacio Soberano al Nivel 2 para robustecer la soberanía de tu feudo.',
    hint: 'Selecciona el Castillo Imperial y auméntalo al Nivel 2 para desbloquear mayor capacidad y tributos.',
    actionType: 'upgrade',
    actionLabel: 'Mejorar Castillo',
    reward: { gold: 220, stone: 140, xp: 190 },
    evaluate: (state) => {
      const castleSlot = state.slots.find(
        (s) => s.buildingId === 'ayuntamiento' || s.buildingId === 'castillo'
      )
      const lvl = castleSlot?.level || 1
      return { completed: lvl >= 2, current: Math.min(lvl, 2), max: 2 }
    },
  },
  {
    id: 'q-c1-9',
    chapter: 1,
    title: 'Bautismo de Fuego',
    desc: '¡Tu feudo está listo para la guerra! Supera el primer encuentro en la Campaña de Mazmorras.',
    hint: 'Abre la Campaña desde el Heraldo o el dock inferior y vence al Orco Explorador (Nodo 1).',
    actionType: 'campaign',
    actionLabel: 'A la Batalla',
    reward: { gold: 350, gems: 15, xp: 250 },
    evaluate: (state) => {
      const defeated = (state.completedNodes || []).includes('node-1')
      return { completed: defeated, current: defeated ? 1 : 0, max: 1 }
    },
  },

  // --- CAPÍTULO II: LA AMENAZA DE LOS PÁRAMOS ---
  {
    id: 'q-c2-1',
    chapter: 2,
    title: 'Provisión del Reino',
    desc: 'Efectúa al menos 3 cosechas de tributos en tus edificios de la plaza.',
    hint: 'Recoge las cosechas periódicas de tus edificios para abastecer las arcas reales.',
    actionType: 'harvest',
    actionLabel: 'Cosechar Recursos',
    reward: { wood: 200, stone: 200, xp: 220 },
    evaluate: (state) => {
      const harvests = state.totalHarvests || 0
      return { completed: harvests >= 3, current: Math.min(harvests, 3), max: 3 }
    },
  },
  {
    id: 'q-c2-2',
    chapter: 2,
    title: 'Fortaleza en Expansión',
    desc: 'Mejora al menos dos edificios a Nivel 2 o superior en la plaza.',
    hint: 'Eleva el nivel de tus estructuras para maximizar su producción y resistencia.',
    actionType: 'upgrade',
    actionLabel: 'Mejorar Edificios',
    reward: { gold: 400, wood: 250, xp: 300 },
    evaluate: (state) => {
      const count = state.slots.filter((s) => s.buildingId && (s.level || 1) >= 2).length
      return { completed: count >= 2, current: Math.min(count, 2), max: 2 }
    },
  },
  {
    id: 'q-c2-3',
    chapter: 2,
    title: 'Frenar la Horda Orca',
    desc: 'Conquista el Nodo 3 (Orco Capitán de Hierro) en la Campaña.',
    hint: 'Supera las primeras tres defensas orcas para abrir las bifurcaciones.',
    actionType: 'campaign',
    actionLabel: 'Luchar en Nodo 3',
    reward: { gold: 450, stone: 200, gems: 15, xp: 320 },
    evaluate: (state) => {
      const defeated = (state.completedNodes || []).includes('node-3')
      return { completed: defeated, current: defeated ? 1 : 0, max: 1 }
    },
  },
  {
    id: 'q-c2-4',
    chapter: 2,
    title: 'Prosperidad de la Bóveda',
    desc: 'Eleva la Gran Bóveda Real al Nivel 2 para ampliar los depósitos y blindar el tesoro.',
    hint: 'Selecciona la Gran Bóveda en la terraza oriental y mejórala al Nivel 2.',
    actionType: 'upgrade',
    actionLabel: 'Mejorar Bóveda',
    reward: { gold: 500, gems: 20, xp: 350 },
    evaluate: (state) => {
      const vault = state.slots.find((s) => s.buildingId === 'almacen')
      const lvl = vault?.level || 1
      return { completed: lvl >= 2, current: Math.min(lvl, 2), max: 2 }
    },
  },
  {
    id: 'q-c2-5',
    chapter: 2,
    title: 'Fuerza Mística & Tiro',
    desc: 'Posee al menos 3 Arqueras y 1 Canalizador Mágico en tu guarnición.',
    hint: 'Las unidades de rango amplían tu precisión y causan daño demoledor.',
    actionType: 'army',
    actionLabel: 'Reclutar Magos/Arqueras',
    reward: { gold: 500, gems: 25, xp: 400 },
    evaluate: (state) => {
      const hasArchers = (state.troops.archers || 0) >= 3
      const hasMages = (state.troops.mages || 0) >= 1
      const count = (hasArchers ? 1 : 0) + (hasMages ? 1 : 0)
      return { completed: hasArchers && hasMages, current: count, max: 2 }
    },
  },

  // --- CAPÍTULO III ---
  {
    id: 'q-c3-1',
    chapter: 3,
    title: 'Cacería de Bestias',
    desc: 'Conquista la Caverna Volcánica (Nodo 4a) o el Foso de Sombras (Nodo 4b).',
    hint: 'Elige tu ruta en los Páramos Ardientes y derrota a la bestia de élite.',
    actionType: 'campaign',
    actionLabel: 'A la Bifurcación',
    reward: { gold: 600, wood: 350, stone: 350, xp: 450 },
    evaluate: (state) => {
      const nodes = state.completedNodes || []
      const done = nodes.includes('node-4a') || nodes.includes('node-4b')
      return { completed: done, current: done ? 1 : 0, max: 1 }
    },
  },
  {
    id: 'q-c3-2',
    chapter: 3,
    title: 'Reino Fortificado',
    desc: 'Eleva al menos 3 edificios de tu reino al Nivel 2 o superior.',
    hint: 'Fortalece la infraestructura permanente de la meseta celestial.',
    actionType: 'upgrade',
    actionLabel: 'Mejorar Reino',
    reward: { gold: 500, wood: 400, stone: 300, xp: 400 },
    evaluate: (state) => {
      const count = state.slots.filter((s) => s.buildingId && (s.level || 1) >= 2).length
      return { completed: count >= 3, current: Math.min(count, 3), max: 3 }
    },
  },
  {
    id: 'q-c3-3',
    chapter: 3,
    title: 'La Caída del Caudillo Vorgath',
    desc: '¡Derrota al Caudillo Supremo Vorgath (Nodo 6), el Jefe de los Páramos!',
    hint: 'El jefe posee golpes devastadores. Asegúrate de llevar soldados e infantería.',
    actionType: 'campaign',
    actionLabel: 'Enfrentar a Vorgath',
    reward: { gold: 1500, gems: 50, xp: 800 },
    evaluate: (state) => {
      const done = (state.completedNodes || []).includes('node-6')
      return { completed: done, current: done ? 1 : 0, max: 1 }
    },
  },
  {
    id: 'q-c3-4',
    chapter: 3,
    title: 'El Portal Arcano',
    desc: 'Activa el Portal Dimensional (Nodo 7) para abrir la Selva Mística (Bioma 2).',
    hint: 'Una vez derrotado Vorgath, interactúa con el portal en el mapa de campaña.',
    actionType: 'campaign',
    actionLabel: 'Cruzar el Portal',
    reward: { gold: 1200, gems: 60, xp: 900 },
    evaluate: (state) => {
      const done = (state.unlockedBiomes || []).includes('biome-2')
      return { completed: done, current: done ? 1 : 0, max: 1 }
    },
  },

  // --- CAPÍTULO IV ---
  {
    id: 'q-c4-1',
    chapter: 4,
    title: 'Corona Imperial',
    desc: 'Alcanza el Nivel 3 de Reino con tu Comandante.',
    hint: 'Gana experiencia mejorando santuarios, reclutando y conquistando mazmorras.',
    actionType: 'level',
    actionLabel: 'Ver Perfil',
    reward: { gold: 2000, gems: 80, xp: 1200 },
    evaluate: (state) => {
      const lvl = state.kingdomLevel || 1
      return { completed: lvl >= 3, current: Math.min(lvl, 3), max: 3 }
    },
  },
  {
    id: 'q-c4-2',
    chapter: 4,
    title: 'El Héroe Comandante',
    desc: 'Recluta al Paladín Comandante (Héroe Supremo) en tu ejército.',
    hint: 'El Paladín otorga el ataque "Furia Real" en los duelos de campaña.',
    actionType: 'army',
    actionLabel: 'Reclutar Héroe',
    reward: { gold: 2500, gems: 100, xp: 1500 },
    evaluate: (state) => {
      const hasCommander = (state.troops.commander || 0) >= 1
      return { completed: hasCommander, current: hasCommander ? 1 : 0, max: 1 }
    },
  },
  {
    id: 'q-c4-3',
    chapter: 4,
    title: 'Cúspide de la Ciudadela',
    desc: 'Eleva el Palacio Soberano al Nivel 3 y consolida la supremacía de la ciudadela.',
    hint: 'Lleva el Castillo Imperial al Nivel 3 para convertirte en el soberano indiscutible del cielo.',
    actionType: 'upgrade',
    actionLabel: 'Elevar Palacio',
    reward: { gold: 3500, gems: 150, xp: 2000 },
    evaluate: (state) => {
      const castleSlot = state.slots.find(
        (s) => s.buildingId === 'ayuntamiento' || s.buildingId === 'castillo'
      )
      const lvl = castleSlot?.level || 1
      return { completed: lvl >= 3, current: Math.min(lvl, 3), max: 3 }
    },
  },
]

export const DAILY_QUESTS_TEMPLATE = [
  {
    id: 'daily-tribute',
    title: 'Tributo de la Mañana',
    desc: 'Recolecta tributos de los edificios de la plaza.',
    reward: { gold: 150, food: 80, xp: 100 },
    timeRemaining: '11h 45m',
    evaluate: (state) => {
      const readyToCollect = state.slots.filter((s) => s.buildingId).length
      return { completed: readyToCollect >= 3, current: Math.min(readyToCollect, 3), max: 3 }
    },
  },
  {
    id: 'daily-garrison',
    title: 'Ronda de Guardia',
    desc: 'Mantén al menos 6 combatientes preparados en la guarnición.',
    reward: { gold: 120, wood: 100, xp: 100 },
    timeRemaining: '11h 45m',
    evaluate: (state) => {
      const total =
        (state.troops.infantry || 0) +
        (state.troops.archers || 0) +
        (state.troops.mages || 0) +
        (state.troops.commander || 0)
      return { completed: total >= 6, current: Math.min(total, 6), max: 6 }
    },
  },
  {
    id: 'daily-campaign',
    title: 'Vigilancia de Frontera',
    desc: 'Conquista o vence en al menos 1 nodo de combate de la Campaña.',
    reward: { gold: 250, gems: 5, xp: 150 },
    timeRemaining: '11h 45m',
    evaluate: (state) => {
      const count = (state.completedNodes || []).length
      return { completed: count >= 1, current: Math.min(count, 1), max: 1 }
    },
  },
]

export const EPIC_FEATS_TEMPLATE = [
  {
    id: 'epic-castle-tier',
    title: 'El Palacio de las Nubes',
    desc: 'Mejora el Ayuntamiento al Nivel 3.',
    reward: { gold: 2000, gems: 50, xp: 600 },
    evaluate: (state) => {
      const castleSlot = state.slots.find(
        (s) => s.buildingId === 'ayuntamiento' || s.buildingId === 'castillo'
      )
      const lvl = castleSlot?.level || 1
      return { completed: lvl >= 3, current: Math.min(lvl, 3), max: 3 }
    },
  },
  {
    id: 'epic-population-boom',
    title: 'Imperio Superpoblado',
    desc: 'Alcanza una capacidad de población de al menos 50 colonos.',
    reward: { gold: 2500, gems: 60, xp: 800 },
    evaluate: (state) => {
      let totalPop = state.resources?.populationMax || 30
      let fromBuildings = 0
      state.slots.forEach((s) => {
        if (s.buildingId) {
          const bDef = Object.values(BUILDING_TYPES).find((b) => b.id === s.buildingId)
          const lvl = s.level || 1
          if (bDef?.populationProvided) fromBuildings += bDef.populationProvided * lvl
        }
      })
      totalPop = Math.max(totalPop, 30 + fromBuildings)
      return { completed: totalPop >= 50, current: Math.min(totalPop, 50), max: 50 }
    },
  },
  {
    id: 'epic-grand-army',
    title: 'Legión Invencible',
    desc: 'Recluta un contingente de más de 12 tropas en tu guarnición.',
    reward: { gold: 3000, gems: 80, xp: 1000 },
    evaluate: (state) => {
      const total =
        (state.troops.infantry || 0) +
        (state.troops.archers || 0) +
        (state.troops.mages || 0) +
        (state.troops.commander || 0)
      return { completed: total >= 12, current: Math.min(total, 12), max: 12 }
    },
  },
]

// Level unlock thresholds and rewards
export const KINGDOM_LEVELS = [
  {
    level: 1,
    title: 'Aldea Inicial',
    xpRequired: 0,
    unlocks: ['Castillo Imperial', 'Casa de Colonos', 'Mina de Oro', 'Cuartel', 'Torre de Arqueros', 'Aserradero'],
    reward: { gold: 0, gems: 0 },
  },
  {
    level: 2,
    title: 'Feudo Fortificado',
    xpRequired: 400,
    unlocks: ['Cantera de Granito', 'Gran Almacén Real', 'Molino de Viento Imperial'],
    reward: { gold: 300, gems: 15, wood: 150, stone: 150 },
  },
  {
    level: 3,
    title: 'Condado Próspero',
    xpRequired: 1000,
    unlocks: ['Portal Arcano Celestial', 'Mejoras de Fortaleza Nivel II', '+10% Producción Global'],
    reward: { gold: 600, gems: 30, wood: 300, stone: 300 },
  },
  {
    level: 4,
    title: 'Bastión de las Nubes',
    xpRequired: 2000,
    unlocks: ['Paladín Comandante', 'Expediciones Dimensionales Arcanas', '+15% Poder Militar'],
    reward: { gold: 1200, gems: 60, wood: 500, stone: 500 },
  },
  {
    level: 5,
    title: 'Imperio Celestial',
    xpRequired: 3500,
    unlocks: ['+25% Capacidad Poblacional', '+20% Producción en Todos los Edificios'],
    reward: { gold: 2500, gems: 100, wood: 1000, stone: 1000 },
  },
]

// Predefined titles for extended imperial progression
export const PRESTIGE_LEVEL_TITLES = [
  'Imperio Eterno',
  'Corona Inmortal',
  'Dinastía de las Nubes',
  'Supremacía Feudal',
  'Reino Mítico',
  'Cúspide del Olimpo',
  'Supremacía Celestial',
  'Bastión del Infinito',
  'Gran Conquistador Cósmico',
  'Santuario del Firmamento',
  'Dominio del Fénix',
  'Imperio Primordial',
  'Legado Trascendental',
]

/**
 * Calculates XP requirement for ANY level up to infinity.
 * Progressive difficulty scaling: each level requires +30% more XP than the previous gap.
 */
export function getXpRequiredForLevel(level) {
  if (level <= 1) return 0
  if (level === 2) return 400
  if (level === 3) return 1000
  if (level === 4) return 2000
  if (level === 5) return 3500

  // For level >= 6, calculate progressive difficulty curve
  let xp = 3500
  let step = 2000
  for (let l = 6; l <= level; l++) {
    xp += Math.round(step)
    step = step * 1.30 // +30% exponential difficulty growth per level
  }
  return xp
}

/**
 * Generates or retrieves level definition for any level (infinite)
 */
export function getLevelDefinition(level) {
  const lvl = Math.max(1, Math.floor(level))
  if (lvl <= 5) {
    return KINGDOM_LEVELS[lvl - 1]
  }

  const xpRequired = getXpRequiredForLevel(lvl)
  const mult = lvl - 5
  const titleIdx = (lvl - 6) % PRESTIGE_LEVEL_TITLES.length
  const cycle = Math.floor((lvl - 6) / PRESTIGE_LEVEL_TITLES.length)
  const baseTitle = PRESTIGE_LEVEL_TITLES[titleIdx] || 'Mando Imperial'
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  const title = cycle > 0 ? `${baseTitle} ${romanNumerals[cycle % 10] || cycle + 1}` : baseTitle

  return {
    level: lvl,
    title,
    xpRequired,
    unlocks: [
      `+${Math.min(150, 20 + mult * 5)}% Producción Global`,
      `+${(1000 * mult).toLocaleString()} Capacidad de Almacén`,
      `+${20 * mult} Población Imperial`,
      `+${Math.min(200, 15 + mult * 10)}% Poder Militar`,
    ],
    reward: {
      gold: Math.round(2500 + mult * 1500 * Math.pow(1.12, Math.min(mult, 25))),
      gems: Math.min(1000, 100 + mult * 25),
      wood: Math.round(1000 + mult * 600),
      stone: Math.round(1000 + mult * 600),
    },
  }
}

/**
 * Calculates current level from total accumulated XP (infinite levels)
 */
export function getLevelForXp(xp) {
  const safeXp = Math.max(0, xp || 0)
  if (safeXp < 3500) {
    let cur = KINGDOM_LEVELS[0]
    for (let i = KINGDOM_LEVELS.length - 1; i >= 0; i--) {
      if (safeXp >= KINGDOM_LEVELS[i].xpRequired) {
        cur = KINGDOM_LEVELS[i]
        break
      }
    }
    return cur
  }

  // Infinite level scaling: climb up as high as the XP allows
  let lvl = 5
  while (safeXp >= getXpRequiredForLevel(lvl + 1)) {
    lvl++
  }
  return getLevelDefinition(lvl)
}

/**
 * Calculates progress towards the next level (never stops at level 5)
 */
export function getXpProgress(xp, currentLevelNum) {
  const safeXp = Math.max(0, xp || 0)
  const lvl = Math.max(1, currentLevelNum || 1)
  const curLevelDef = getLevelDefinition(lvl)
  const nextLevelDef = getLevelDefinition(lvl + 1)

  const base = curLevelDef.xpRequired
  const target = nextLevelDef.xpRequired
  const currentInTier = Math.max(0, safeXp - base)
  const tierRange = Math.max(1, target - base)
  const percent = Math.min(100, Math.max(0, Math.round((currentInTier / tierRange) * 100)))

  return {
    current: currentInTier,
    max: tierRange,
    percent,
    isMax: false, // Levels are INFINITE!
    nextTitle: nextLevelDef.title,
    unlocks: nextLevelDef.unlocks,
  }
}
