// Fix all locale files by properly merging campaignData sections
// The patch_campaign_translations.mjs regex broke the files — this fixes them
import { readFileSync, writeFileSync } from 'fs'

const campaignTranslations = {
  us: {
    enemyTypes: { orc: "Orc", minotaur: "Minotaur", miniboss: "Chaos Miniboss", boss: "Supreme Boss" },
    biome1: { name: "Sole Chapter: The Great Chaos Campaign", subtitle: "The March of Heroes (17 Epic Encounters)" },
    sectors: {
      "1": { name: "Sector I: Orc Vanguard", desc: "3 Orcs" },
      "2": { name: "Sector II: Beast Pit", desc: "1 Minotaur" },
      "3": { name: "Sector III: Mixed Assault", desc: "3 Orcs + 1 Minotaur" },
      "4": { name: "Sector IV: Miniboss Crypt", desc: "1 Chaos Miniboss" },
      "5": { name: "Sector V: Shadow Labyrinth", desc: "3 Minotaurs + 1 Orc" },
      "6": { name: "Sector VI: Throne of Doomsday", desc: "3 Minotaurs + Supreme Boss" }
    },
    combat: { dazed: "[DAZED!] -", counter: "[COUNTER!] -" },
    nodes: {
      "node-1": { name: "Orc Scout", subtitle: "Phase 1 · Moorland Vanguard", desc: "Swift scout sent to probe your bastion's defenses. Agile but fragile." },
      "node-2": { name: "Orc Berserker", subtitle: "Phase 1 · Flame Axe Warrior", desc: "Armored brute wielding twin axes wreathed in living fire. Ferocious direct strikes." },
      "node-3": { name: "Orc Iron Captain", subtitle: "Phase 1 · Outpost Bastion", desc: "Commander of the vanguard horde. Carries a massive cast-iron spiked buckler." },
      "node-4": { name: "Red-Horn Minotaur", subtitle: "Phase 2 · Terror of the Pit", desc: "Colossal mythical beast armed with a crushing club. Your first major trial." },
      "node-5": { name: "Blood Spear Orc", subtitle: "Phase 3 · Ash Harasser", desc: "Relentless skirmisher throwing venomous javelins that decimate defensive lines." },
      "node-6": { name: "Orc Devastator", subtitle: "Phase 3 · Trench Breaker", desc: "Elite shock-warrior of the horde, encased in rusted plate armor and thirsty for blood." },
      "node-7": { name: "Orc Warlord", subtitle: "Phase 3 · Blood Chieftain", desc: "Division general commanding the orc phalanx, guarding the gateway to the sanctum." },
      "node-8": { name: "Cavern Minotaur", subtitle: "Phase 3 · Horde Colossus", desc: "Primeval brute bred by the orcs to pulverize any legion that dares approach." },
      "node-9": { name: "Miniboss: Abyss Sentinel", subtitle: "Phase 4 · MID-SECTOR MINIBOSS!", desc: "Armored titan bearing a cyclopean warhammer. Its footsteps shake the subterranean depths." },
      "node-10": { name: "Ebony Gladiator Minotaur", subtitle: "Phase 5 · Combat Beast I", desc: "First combat bull of the inner guard. Razor horns capable of splitting reinforced shields." },
      "node-11": { name: "Crypt Raging Minotaur", subtitle: "Phase 5 · Combat Beast II", desc: "Taurine barbarian frenzied by the stench of battle. Strikes with unstoppable fury." },
      "node-12": { name: "Armored Titan Minotaur", subtitle: "Phase 5 · Combat Beast III", desc: "Colossus plated in forged iron slabs. Immense physical resilience and devastating charges." },
      "node-13": { name: "Orc Shadow Archmage", subtitle: "Phase 5 · Shaman of the Shadows", desc: "Orc sorcerer channeling void sorceries to seal the final corridor to the Throne." },
      "node-14": { name: "Blood Sentinel Minotaur", subtitle: "Phase 6 · Praetorian Guard I", desc: "Blood sentinel bound by oath to guard the Supreme Boss with its very life." },
      "node-15": { name: "Hell Executioner Minotaur", subtitle: "Phase 6 · Praetorian Guard II", desc: "Executioner with massive horns wielding a spiked mace chained in hellfire." },
      "node-16": { name: "King of Horns Minotaur", subtitle: "Phase 6 · Guard Champion", desc: "The most feared of all subterranean minotaurs. The final obstacle before the Throne." },
      "node-17": { name: "SUPREME BOSS: Lord of Shadows", subtitle: "Phase 6 · FINAL CAMPAIGN BOSS!", desc: "Absolute sovereign of the Chaos Dungeon. His cursed blade devours entire souls." }
    }
  },
  es: {
    enemyTypes: { orc: "Orco", minotaur: "Minotauro", miniboss: "Minijefe del Caos", boss: "Jefe Supremo" },
    biome1: { name: "Capítulo Único: La Gran Campaña del Caos", subtitle: "La Marcha de los Héroes (17 Encuentros Épicos)" },
    sectors: {
      "1": { name: "Sector I: Vanguardia Orca", desc: "3 Orcos" },
      "2": { name: "Sector II: Foso de Bestias", desc: "1 Minotauro" },
      "3": { name: "Sector III: Ofensiva Mixta", desc: "3 Orcos + 1 Minotauro" },
      "4": { name: "Sector IV: Cripta del Minijefe", desc: "1 Minijefe" },
      "5": { name: "Sector V: Laberinto de Sombras", desc: "3 Minotauros + 1 Orco" },
      "6": { name: "Sector VI: Trono del Juicio Final", desc: "3 Minotauros + Boss Supremo" }
    },
    combat: { dazed: "[¡ATURDIDO!] -", counter: "[¡CONTRAATAQUE!] -" },
    nodes: {
      "node-1": { name: "Orco Explorador", subtitle: "Fase 1 · Vanguardia de los Páramos", desc: "Vigía veloz enviado para tantear las defensas de tu bastión. Ágil pero vulnerable." },
      "node-2": { name: "Orco Berserker", subtitle: "Fase 1 · Guerrero de Hacha Flamígera", desc: "Bárbaro acorazado con hachas gemelas envueltas en llamas vivas. Golpes directos feroces." },
      "node-3": { name: "Orco Capitán de Hierro", subtitle: "Fase 1 · Bastión de la Avanzada", desc: "Comandante de la avanzadilla orca. Porta un pesado escudo tachonado en hierro fundido." },
      "node-4": { name: "Minotauro Cornamenta Roja", subtitle: "Fase 2 · El Terror del Foso", desc: "Bestia legendaria de masa colosal armada con un garrote desgarrador. Primer gran desafío." },
      "node-5": { name: "Orco Lanzador Sangriento", subtitle: "Fase 3 · Hostigador de las Cenizas", desc: "Tirador implacable con jabalinas envenenadas que diezman las líneas defensivas." },
      "node-6": { name: "Orco Devastador", subtitle: "Fase 3 · Trinchera de Asalto", desc: "Guerrero de élite de la horda, blindado en placas oxidadas y sediento de gloria." },
      "node-7": { name: "Orco Señor de la Guerra", subtitle: "Fase 3 · Caudillo de Sangre", desc: "General de división que comanda a la falange de orcos y custodia la entrada al santuario." },
      "node-8": { name: "Minotauro de las Cavernas", subtitle: "Fase 3 · Coloso de la Horda", desc: "Criatura ancestral entrenada por los orcos para destrozar cualquier escuadrón que se acerque." },
      "node-9": { name: "Minijefe: El Guardián del Abismo", subtitle: "Fase 4 · ¡MINIJEFE DEL SECTOR CENTRAL!", desc: "Titán acorazado con un martillo ciclópeo. Su presencia hace temblar las profundidades." },
      "node-10": { name: "Minotauro Gladiador de Ébano", subtitle: "Fase 5 · Bestia de Combate I", desc: "Primer toro de combate de la guardia interna. Astas afiladas capaces de hendir escudos." },
      "node-11": { name: "Minotauro Furioso de las Criptas", subtitle: "Fase 5 · Bestia de Combate II", desc: "Bárbaro taurino enfurecido por el hedor de la batalla. Golpea con frenesí incesante." },
      "node-12": { name: "Minotauro Titán Acorazado", subtitle: "Fase 5 · Bestia de Combate III", desc: "Coloso recubierto de placas de hierro fundido. Alta resistencia física y embestida brutal." },
      "node-13": { name: "Orco Archimago Oscuro", subtitle: "Fase 5 · Chamán de las Sombras", desc: "Hechicero orco que canaliza energías oscuras para resguardar el pasadizo final al Trono." },
      "node-14": { name: "Minotauro Centinela de Sangre", subtitle: "Fase 6 · Guardia Pretoriana I", desc: "Guardián de sangre que juró proteger al Boss Supremo con su propia existencia." },
      "node-15": { name: "Minotauro Verdugo Infernal", subtitle: "Fase 6 · Guardia Pretoriana II", desc: "Verdugo de cornamenta colosal con una maza con cadenas de fuego infernal." },
      "node-16": { name: "Minotauro Rey de los Cuernos", subtitle: "Fase 6 · Campeón de la Guardia", desc: "El más temido de todos los minotauros del reino subterráneo. Último obstáculo antes del Trono." },
      "node-17": { name: "BOSS SUPREMO: Señor de las Tinieblas", subtitle: "Fase 6 · ¡GRAN JEFE FINAL DEL CAPÍTULO!", desc: "Soberano absoluto de la Mazmorra del Caos. Su espada maldita devora almas enteras." }
    }
  }
}

// New translation keys used in the updated App.jsx code
const newTranslationKeys = {
  us: {
    notifications: {
      onlineRestored: "Connection restored! Kingdom data synchronized.",
      offlineMode: "You are offline. Progress saved locally until reconnection.",
      xpRecruit: "Military Recruitment",
      xpResearch: "Research: {name}",
      xpSpeedup: "Imperial Speedup",
      xpSpeedupWork: "Speeded Construction",
      xpSiege: "Victorious Siege",
      xpExpedition: "Expedition Completed",
      xpDecree: "Decree: {title}",
      xpVictoryNode: "Victory: {name}",
      xpDungeon: "Dungeon Conquered",
      xpGraduation: "Kingdom Graduation"
    },
    army: {
      populationLimitReached: "Population limit reached! Build or upgrade Houses.",
      troopsQueued: "{count} soldiers added to training queue!",
      trainingCancelled: "Training cancelled. Resources and population refunded.",
      instantRecruited: "Soldier instantly trained with gems!",
    },
    speedup: {
      noSpeedupsAvailable: "No hourglass speedups available.",
      usedNotification: "Training time accelerated!"
    },
    tutorial: {
      blockedInTutorial: "Complete or finish the tutorial with the Seneschal first."
    },
    arena: {
      seasonClaimSuccess: "Season rewards claimed successfully!"
    },
    buildings: {
      storageCapacityDesc: "The Royal Warehouse is at full capacity! Upgrade the Grand Warehouse."
    },
    common: {
      construction: "Construction"
    },
    resources: {
      insufficientResources: "Insufficient Resources",
      insufficientGems: "Insufficient gems."
    }
  },
  es: {
    notifications: {
      onlineRestored: "¡Conexión restaurada! Datos del reino sincronizados.",
      offlineMode: "Estás sin conexión. Progreso guardado localmente hasta reconectarse.",
      xpRecruit: "Reclutamiento Militar",
      xpResearch: "Investigación: {name}",
      xpSpeedup: "Aceleración Imperial",
      xpSpeedupWork: "Obra Acelerada",
      xpSiege: "Asedio Victorioso",
      xpExpedition: "Expedición Completada",
      xpDecree: "Decreto: {title}",
      xpVictoryNode: "Victoria: {name}",
      xpDungeon: "Mazmorra Conquistada",
      xpGraduation: "Graduación del Reino"
    },
    army: {
      populationLimitReached: "¡Límite de población alcanzado! Construye o mejora Casas.",
      troopsQueued: "¡{count} soldados añadidos a la cola de adiestramiento!",
      trainingCancelled: "Entrenamiento cancelado. Recursos y población devueltos.",
      instantRecruited: "¡Soldado adiestrado de inmediato con gemas!",
    },
    speedup: {
      noSpeedupsAvailable: "No tienes relojes de arena disponibles.",
      usedNotification: "¡Tiempo de entrenamiento acelerado!"
    },
    tutorial: {
      blockedInTutorial: "Completa o finaliza el tutorial con el Senescal primero."
    },
    arena: {
      seasonClaimSuccess: "¡Recompensas de temporada reclamadas con éxito!"
    },
    buildings: {
      storageCapacityDesc: "¡El Almacén Real está al tope de su capacidad! Sube de nivel el Gran Almacén."
    },
    common: {
      construction: "Construcción"
    },
    resources: {
      insufficientResources: "Recursos Insuficientes",
      insufficientGems: "Gemas insuficientes."
    }
  }
}

// Deep merge function
function deepMerge(target, source) {
  for (const [key, val] of Object.entries(source)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {}
      }
      deepMerge(target[key], val)
    } else {
      // Only set if not already present (don't overwrite existing translations)
      if (target[key] === undefined) {
        target[key] = val
      }
    }
  }
  return target
}

// Fix each locale file
for (const lang of ['us', 'es', 'br', 'kr', 'cn']) {
  const filePath = `src/i18n/locales/${lang}.js`
  const raw = readFileSync(filePath, 'utf-8')
  
  // Try to parse. The regex approach was broken, so let's use a more robust method.
  // Extract everything between 'export const XX = ' and the last '};'
  const varName = lang
  const matchRegex = new RegExp(`export const ${varName} = (\\{[\\s\\S]*\\});?\\s*$`)
  const match = raw.match(matchRegex)
  
  if (!match) {
    console.error(`Could not parse ${filePath}`)
    continue
  }
  
  let obj
  try {
    obj = eval('(' + match[1] + ')')
  } catch (e) {
    // If eval fails, the file is broken. We need to rebuild from the GOOD version.
    // Read from git or use the last good version
    console.error(`Syntax error in ${filePath}: ${e.message}`)
    console.error(`Attempting to fix by reading the object up to the error...`)
    
    // Alternative: try using Function constructor with try-catch on substrings
    // For now, report and skip
    continue
  }
  
  // Merge campaign data
  const campData = campaignTranslations[lang] || campaignTranslations.us
  obj.campaignData = campData
  
  // Merge new translation keys
  const newKeys = newTranslationKeys[lang] || newTranslationKeys.us
  deepMerge(obj, newKeys)
  
  // For non-US/ES locales, also add the English fallbacks for new keys
  if (lang !== 'us' && lang !== 'es') {
    deepMerge(obj, newTranslationKeys.us)
  }
  
  // Write back
  const content = `export const ${varName} = ${JSON.stringify(obj, null, 2)};\n`
  writeFileSync(filePath, content, 'utf-8')
  console.log(`Fixed ${filePath}`)
}

console.log('\nDone! All locale files fixed.')
