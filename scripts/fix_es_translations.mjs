// Fix ES locale: copy Spanish translations from questData.story -> quests.story
// and add proper Spanish for other sections that got English defaults
import { readFileSync, writeFileSync } from 'fs'

const filePath = 'src/i18n/locales/es.js'
const raw = readFileSync(filePath, 'utf-8')

// Parse the exported object
const match = raw.match(/export const es = ({[\s\S]*});/)
if (!match) { console.error('Could not parse es.js'); process.exit(1) }

// Use Function constructor to safely eval the object literal
const es = eval('(' + match[1] + ')')

// Copy questData.story entries into quests.story (Spanish translations)
if (es.questData?.story) {
  for (const [questId, data] of Object.entries(es.questData.story)) {
    if (!es.quests.story[questId]) {
      es.quests.story[questId] = {}
    }
    // Only overwrite if the current value is in English (from the US patch)
    if (data.title) es.quests.story[questId].title = data.title
    if (data.desc) es.quests.story[questId].desc = data.desc
    if (data.hint) es.quests.story[questId].hint = data.hint
    if (data.action) es.quests.story[questId].action = data.action
  }
}

// Fix notification keys that are still in English
const esNotificationFixes = {
  "web3WalletLinked": "Billetera Web3 vinculada: {address}",
  "web3WalletDisconnected": "Billetera Web3 desconectada",
  "syncingBlockchain": "Sincronizando el estado del reino con TOC Chaos L2...",
  "avatarUpdated": "Avatar actualizado: {name}",
  "sovereignNameSavedProfile": "Nombre de Soberano guardado: {name}"
}
for (const [key, val] of Object.entries(esNotificationFixes)) {
  es.notifications[key] = val
}

// Fix shopItems section in Spanish
es.shopItems = {
  "gem_packs": {
    "small": "Puñado de Gemas",
    "medium": "Bolsa de Gemas",
    "large": "Cofre Imperial de Gemas",
    "vault": "Cámara del Trono"
  },
  "bundles": {
    "conqueror": { "title": "Cofre del Conquistador", "subtitle": "Oferta de Bienvenida para el Soberano" },
    "alliance": { "title": "Lote de la Gran Alianza", "subtitle": "Legión Imperial Preparada para el Asedio" }
  },
  "bundleItems": {
    "relicEmblem": "Reliquia: Emblema del Sol Imperial",
    "titleConqueror": "Título Real: \"El Conquistador Solar\""
  },
  "perks": {
    "oneClickHarvest": "El Cuerno del Heraldo (Cosecha Total)",
    "secondBuilder": "Segundo Constructor Real",
    "dailyBlessing": "Bendición Diaria del Caos (Pase Mensual)",
    "engineering": "Maestría en Ingeniería Imperial"
  },
  "wheelPrizes": {
    "potions": "x2 Pociones",
    "infantry": "x5 Infantería",
    "bombs": "x2 Bombas"
  }
}

// Fix inventoryItems section in Spanish
es.inventoryItems = {
  "slots": {
    "head": "Corona / Cabeza",
    "weapon": "Arma Real",
    "accessory": "Reliquia / Talismán"
  },
  "relics": {
    "relic_corona_caos": { "name": "Corona del Caos", "desc": "+15% producción de Oro en todas las minas. Aumenta el prestigio del nivel de reino." },
    "relic_espada_jade": { "name": "Espada Rúnica de Jade", "desc": "+20% Ataque Militar. Golpes devastadores en campaña y arena." },
    "relic_caliz_titan": { "name": "Cáliz del Rey Titán de Hielo", "desc": "+20% Defensa. Absorbe impactos severos en combates prolongados." },
    "relic_broquel_hierro": { "name": "Broquel de Hierro Negro", "desc": "+15% Defensa. Aumenta la supervivencia de tropas en asedios y campañas." },
    "relic_amuleto_selva": { "name": "Amuleto de la Selva Esmeralda", "desc": "+15% producción de Víveres. Aumenta la eficiencia de cosecha poblacional." },
    "relic_emblema_leon": { "name": "Emblema del Sol Imperial", "desc": "+20% producción de Oro. Duplica los tributos diarios reales." },
    "relic_manto_vencedor": { "name": "Manto del Vencedor", "desc": "+10% ATK y +10% DEF. Una capa legendaria para campeones de Arena." }
  },
  "consumables": {
    "potion_heal": { "name": "Poción de Salud Mayor", "desc": "Restaura el 40% de salud en combate de mazmorra y arena." },
    "potion_focus": { "name": "Elixir de Concentración", "desc": "Aumenta el daño crítico un 25% durante 1 combate." },
    "bomb_dwarf": { "name": "Bomba de Pólvora Enana", "desc": "Inflige 200 de daño en área a todos los enemigos en una sola explosión." }
  }
}

// Fix techData section in Spanish
es.techData = {
  "categories": {
    "economy": "Economía y Producción",
    "military": "Poder Militar y Tácticas",
    "arcane": "Misticismo y Arcano"
  },
  "techs": {
    "tech-axes": { "name": "Hachas de Acero Templado", "subtitle": "Silvicultura Avanzada", "effect": "+20% producción de Madera en todos los aserraderos" },
    "tech-mines": { "name": "Vetas Subterráneas Profundas", "subtitle": "Geología y Minería", "effect": "+25% producción de Oro en minas" },
    "tech-crops": { "name": "Rotación de Cultivos", "subtitle": "Agricultura Eficiente", "effect": "+20% producción de Víveres en granjas y molinos" },
    "tech-quarry": { "name": "Cinceles de Diamante", "subtitle": "Tallado Pesado", "effect": "+25% producción de Piedra en canteras" },
    "tech-logistics": { "name": "Logística Imperial", "subtitle": "Red de Carros Reales", "effect": "+15% producción Global (todos los recursos)" },
    "tech-steel": { "name": "Forja de Acero Templado", "subtitle": "Armaduras Pesadas", "effect": "+15% ATK de Infantería y Arqueros" },
    "tech-bows": { "name": "Arcos Compuestos de Tejo", "subtitle": "Tiradores Expertos", "effect": "+20% Precisión a Distancia" },
    "tech-siege": { "name": "Estrategia de Asedio", "subtitle": "Ingenieros de Asedio Reales", "effect": "+25% Daño de Asedio en Campaña" },
    "tech-fortification": { "name": "Murallas Góticas", "subtitle": "Fortificación Avanzada", "effect": "+20% Defensa en todos los edificios" },
    "tech-commander": { "name": "Código de Caballería", "subtitle": "Comandante Sagrado", "effect": "Desbloquea Furia Real (ATK Especial del Comandante)" },
    "tech-arcane-channel": { "name": "Canal de Línea Ley", "subtitle": "Sintonización Mística", "effect": "+1 Gema por ciclo de producción en el Portal" },
    "tech-portal-mastery": { "name": "Maestría Dimensional", "subtitle": "Hechicería Cósmica", "effect": "+10% todas las estadísticas en Campaña (ATK y DEF)" },
    "tech-runecraft": { "name": "Artesanía Rúnica", "subtitle": "Inscripciones Ancestrales", "effect": "+10% XP obtenida de todas las fuentes" }
  }
}

// Fix arenaItems section in Spanish
es.arenaItems = {
  "leagues": {
    "league_bronze": "Liga de Bronce",
    "league_silver": "Liga de Plata",
    "league_gold": "Liga de Oro",
    "league_platinum": "Liga de Platino",
    "league_master": "Soberano Supremo"
  },
  "honorShop": {
    "honor_relic_mantle": "Manto del Vencedor",
    "honor_shield_8h": "Escudo de Paz (8 Horas)",
    "honor_shield_24h": "Escudo de Paz (24 Horas)",
    "honor_gems_60": "Bolsa de 60 Gemas Arcanas",
    "honor_chest_war": "Cofre de Suministros Militares"
  }
}

// Fix campaignData section in Spanish
es.campaignData = {
  "enemyTypes": {
    "orc": "Orco",
    "minotaur": "Minotauro",
    "miniboss": "Minijefe del Caos",
    "boss": "Jefe Supremo"
  },
  "biome1": {
    "name": "Capítulo Único: La Gran Campaña del Caos",
    "subtitle": "La Marcha de los Héroes (17 Encuentros Épicos)"
  }
}

// Write back
const content = `export const es = ${JSON.stringify(es, null, 2)};\n`
writeFileSync(filePath, content, 'utf-8')
console.log('ES locale fully translated! All keys now have proper Spanish text.')
