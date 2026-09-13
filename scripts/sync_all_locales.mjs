import { writeFileSync } from 'fs'
import { us } from '../src/i18n/locales/us.js'
import { es } from '../src/i18n/locales/es.js'
import { br } from '../src/i18n/locales/br.js'
import { kr } from '../src/i18n/locales/kr.js'
import { cn } from '../src/i18n/locales/cn.js'

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {}
      deepMerge(target[key], source[key])
    } else {
      target[key] = source[key]
    }
  }
}

// 1. Data additions for US (English canonical)
const usAdditions = {
  inventory: {
    tag: "Royal Treasure Chamber",
    title: "Relic Chest & Backpack",
    legendaryRelics: "Relics ({current}/{total})",
    battleBag: "Battle Bag & Potions",
    activeGear: "Sovereign's Active Gear",
    emptySlot: "Empty Slot",
    unequip: "Unequip",
    activeBonuses: "Active Bonuses:",
    relicCollection: "Unlocked Relics Collection",
    dropSourcePrefix: "Source:",
    equipped: "Equipped",
    equipRelic: "Equip Relic",
    defeatBossToObtain: "Defeat dungeon boss to obtain",
    consumablesIntro: "Consumables in your bag are available with quick-access during dungeon battles. Use them to save your hero or crush the boss!",
    inBag: "In bag: x{count}",
    craftCost: "Crafting cost:",
    craftOne: "Craft +1 Unit",
    insufficientRes: "Insufficient Resources"
  },
  inventoryItems: {
    relics: {
      relic_corona_caos: {
        dropSource: "Supreme Warlord Vorgath (Biome 1 Boss)"
      },
      relic_espada_jade: {
        dropSource: "Jade Arcane Dragon (Biome 2 Boss)"
      },
      relic_caliz_titan: {
        dropSource: "Ice Titan King (Biome 3 Final Boss)"
      },
      relic_broquel_hierro: {
        dropSource: "Iron Guard Orc (Biome 1)"
      },
      relic_amuleto_selva: {
        dropSource: "Shadow Panther (Biome 2)"
      },
      relic_emblema_leon: {
        dropSource: "Conqueror's Chest (Exclusive Offer)"
      },
      relic_manto_vencedor: {
        dropSource: "Coliseum Honor Shop"
      }
    }
  },
  arena: {
    headerSub: "Conquer rival citadels, amass Crowns and ascend in imperial glory.",
    lootMultiplier: "Raid Loot Multiplier:",
    nextLeague: "Next League:",
    maxLeague: "Max Rank Reached",
    seasonRewardLead: "Your Rank Reward:",
    defenseNoticeSub: "While you are away from the realm, other lords may assault your walls. Seek revenge to recover crowns and honor!",
    howToAttackTitle: "HOW TO ATTACK IN PVP?",
    howToAttackDesc: "Raid rival kingdoms, breach their walls, and pillage resources and Crowns to climb the Leagues.",
    showGuide: "View Attack Guide",
    hideGuide: "Hide Guide",
    step1Desc: "Compare their garrison against your troops and assess your military advantage.",
    step2Title: "⚔️ Press ATTACK NOW!",
    step2Desc: "Each assault consumes 1 of your 3 daily Assaults (recharges for free).",
    step3Desc: "In battle, strike 3 structures to breach their vaults and claim loot.",
    troopsSafe: "Your troops do not die!",
    troopsSafeDesc: "In coliseum raids your army remains intact. Training more troops in the Barracks increases your breach power and victory chances.",
    powerUnit: "Power",
    infantry: "Infantry",
    archers: "Archers",
    commanders: "Commanders",
    mages: "Mages",
    breachSuccess: "Breach Success",
    rivalsSectionSub: "Select a rival kingdom and press attack to begin the siege.",
    advantage: "Military Advantage!",
    advantageDesc: "Your troops overpower their defenses!",
    balanced: "Even Match",
    balancedDesc: "Balanced combat with good loot",
    danger: "Challenging Assault",
    dangerDesc: "High risk, maximum loot",
    defensivePower: "Defensive Power:",
    defensiveGarrison: "Defensive Garrison:",
    attackNow: "ATTACK NOW!",
    spendsTicket: "Spends 1 Assault ({tickets}/3 available)",
    noTicketsPrompt: "No Assaults • 10 Crystals 💎",
    successfulDefense: "Successful Defense (+{count} Crowns)",
    wallBreached: "Wall Breached ({trophies} Crowns, -{gold} Gold)",
    revengeClaimed: "Revenge Claimed",
    revengeNow: "Revenge!",
    emptyDefenseNotice: "No recent assaults received. Your walls stand strong!",
    honorSub: "Spend Honor Coins earned in combat on exclusive military relics and peace shields."
  },
  arenaItems: {
    honorShop: {
      item_relic_manto_vencedor: "Mantle of the Victor",
      item_shield_8h: "Peace Shield (8 Hours)",
      item_shield_24h: "Peace Shield (24 Hours)",
      item_gems_pouch: "Bag of 60 Arcane Gems",
      item_war_chest: "Military Supply Chest"
    }
  },
  profile: {
    subtitle: "Imperial identity, military statistics and noble titles",
    changeNameTitle: "Change Sovereign Name",
    progressToLevel: "Progress to Level {level} ({title})",
    chooseHeroEmblem: "Choose your Hero Emblem:",
    statMilitaryPower: "Military Power",
    statStructures: "Structures",
    statActivePop: "Active Population",
    statRoyalTreasury: "Royal Treasury",
    nftBadge: "PRESTIGE NFT",
    nftName: "Founder Sovereign OG Pass",
    nftPerk: "+10% Gold Production Speed & Access to Web3 Tournaments",
    completedBadge: "Completed!",
    inProgressBadge: "In Progress...",
    realmTitle: "Sovereign of the Throne Bastion",
    achievements: {
      "ach-1": {
        title: "First Settlement",
        desc: "Construct at least 3 structures on the floating plateau"
      },
      "ach-2": {
        title: "Lord of War",
        desc: "Recruit an army of more than 8 combat units"
      },
      "ach-3": {
        title: "Imperial Treasury",
        desc: "Accumulate a reserve of more than 1,000 gold coins"
      },
      "ach-4": {
        title: "Master of Magic",
        desc: "Recruit at least 2 Arcane Channelers in your garrison"
      }
    }
  },
  ranking: {
    yourSovereignty: "Your Sovereign Realm",
    chaosKingdom: "Throne of Chaos"
  },
  shop: {
    dailyBlessingDesc: "Claim 50 Crystals & 500 Gold every 24 hours directly from the Imperial Vault."
  },
  techTree: {
    mastered: "Mastered",
    prerequisite: "Prerequisite:",
    branches: {
      economy: {
        desc: "Optimize resource extraction and the yield of mines, fields, and sawmills."
      },
      military: {
        desc: "Improve weaponry, army durability, and damage in campaign dungeons."
      },
      arcane: {
        desc: "Unlock arcane secrets to empower elemental magic and gem acquisition."
      }
    }
  },
  techData: {
    techs: {
      "tech-swords": {
        name: "Tempered Steel Smithing",
        subtitle: "Heavy Armor",
        effect: "+30 Max HP for the hero and +10% military damage mitigation in dungeons."
      },
      "tech-tactics": {
        name: "Siege Strategy",
        subtitle: "Battle Tactics",
        effect: "+12 additional base damage in all impact categories (Normal, Perfect, Crit)."
      },
      "tech-fury": {
        name: "Unshakable Imperial Zeal",
        subtitle: "Royal Leadership",
        effect: "The 'Royal Fury' ability deals +35% additional damage and stuns with greater force."
      },
      "tech-crystals": {
        name: "Arcane Channeling",
        subtitle: "Ether Focus",
        effect: "Assault Mages add +8 direct arcane magic damage to every hit."
      },
      "tech-alchemy": {
        name: "Ether Transmutation",
        subtitle: "Forbidden Alchemy",
        effect: "Grants +1 additional Gem per dungeon victory and boosts Portal production."
      }
    }
  },
  common: {
    rarity: {
      common: "Common",
      rare: "Rare",
      legendary: "Legendary",
      mythic: "Mythic"
    }
  }
}

// 2. Data additions for ES (Spanish)
const esAdditions = {
  inventory: {
    tag: "Cámara del Tesoro Real",
    title: "Baúl de Reliquias & Mochila",
    legendaryRelics: "Reliquias ({current}/{total})",
    battleBag: "Bolsa de Batalla & Pociones",
    activeGear: "Equipo Activo del Soberano",
    emptySlot: "Ranura Vacía",
    unequip: "Desequipar",
    activeBonuses: "Bonificaciones Activas:",
    relicCollection: "Colección de Reliquias Desbloqueadas",
    dropSourcePrefix: "Origen:",
    equipped: "Equipado",
    equipRelic: "Equipar Reliquia",
    defeatBossToObtain: "Derrota al jefe de mazmorra para obtener",
    consumablesIntro: "Los consumibles en tu bolsa están disponibles con acceso rápido durante las batallas en mazmorras. ¡Úsalos para salvar a tu héroe o aplastar al jefe!",
    inBag: "En bolsa: x{count}",
    craftCost: "Coste de fabricación:",
    craftOne: "Fabricar +1 Unidad",
    insufficientRes: "Recursos Insuficientes"
  },
  inventoryItems: {
    relics: {
      relic_corona_caos: {
        dropSource: "Caudillo Supremo Vorgath (Jefe Bioma 1)"
      },
      relic_espada_jade: {
        dropSource: "Dragón Arcano de Jade (Jefe Bioma 2)"
      },
      relic_caliz_titan: {
        dropSource: "Rey Titán de Hielo (Jefe Final Bioma 3)"
      },
      relic_broquel_hierro: {
        dropSource: "Orco Guardia de Hierro (Bioma 1)"
      },
      relic_amuleto_selva: {
        dropSource: "Pantera de Sombras (Bioma 2)"
      },
      relic_emblema_leon: {
        dropSource: "Cofre del Conquistador (Oferta Exclusiva)"
      },
      relic_manto_vencedor: {
        dropSource: "Tienda de Honor del Coliseo"
      }
    }
  },
  arena: {
    headerSub: "Conquista ciudadelas rivales, acumula Coronas y asciende en la gloria imperial.",
    lootMultiplier: "Multiplicador de botín de saqueo:",
    nextLeague: "Próxima Liga:",
    maxLeague: "Rango Máximo Alcanzado",
    seasonRewardLead: "Recompensa de tu rango:",
    defenseNoticeSub: "Cuando estás fuera del reino, otros señores pueden intentar asaltar tus murallas. ¡Cobra venganza para recuperar honor y coronas!",
    howToAttackTitle: "¿CÓMO ATACAR EN PVP?",
    howToAttackDesc: "Asalta reinos rivales, supera sus murallas y saquea recursos y Coronas para ascender de Liga.",
    showGuide: "Ver Guía de Ataque",
    hideGuide: "Ocultar Guía",
    step1Desc: "Compara su guarnición con tus tropas y revisa la ventaja militar.",
    step2Title: "⚔️ Pulsa ¡ATACAR AHORA!",
    step2Desc: "Cada asalto gasta 1 de tus 3 Asaltos diarios (se recargan gratis).",
    step3Desc: "En la batalla, toca 3 edificios para quebrar sus arcas y ganar botín.",
    troopsSafe: "¡Tus tropas no mueren!",
    troopsSafeDesc: "En los asaltos de coliseo tu ejército permanece intacto. Entrenar más tropas en el Cuartel aumenta tu poder de brecha y victoria.",
    powerUnit: "Poder",
    infantry: "Infantería",
    archers: "Arqueros",
    commanders: "Comandantes",
    mages: "Magos",
    breachSuccess: "Éxito en Brecha",
    rivalsSectionSub: "Selecciona un reino rival y pulsa el botón de atacar para iniciar el asalto.",
    advantage: "¡Ventaja Militar!",
    advantageDesc: "¡Tus tropas superan sus defensas!",
    balanced: "Duelo Parejo",
    balancedDesc: "Combate equilibrado con buen botín",
    danger: "Asalto Exigente",
    dangerDesc: "Alto riesgo, máximo botín",
    defensivePower: "Poder Defensivo:",
    defensiveGarrison: "Guarnición Defensiva:",
    attackNow: "¡ATACAR AHORA!",
    spendsTicket: "Gasta 1 Asalto ({tickets}/3 disponibles)",
    noTicketsPrompt: "Sin Asaltos • 10 Cristales 💎",
    successfulDefense: "Defensa Exitosa (+{count} Coronas)",
    wallBreached: "Muralla Rota ({trophies} Coronas, -{gold} Oro)",
    revengeClaimed: "Venganza Cobrada",
    revengeNow: "¡Venganza!",
    emptyDefenseNotice: "No has recibido asaltos recientes. ¡Tus murallas se mantienen intactas!",
    honorSub: "Gasta las Monedas de Honor ganadas en combate en reliquias militares exclusivas y escudos de paz."
  },
  arenaItems: {
    honorShop: {
      item_relic_manto_vencedor: "Manto del Vencedor",
      item_shield_8h: "Escudo de Paz (8 Horas)",
      item_shield_24h: "Escudo de Paz (24 Horas)",
      item_gems_pouch: "Bolsa de 60 Gemas Arcanas",
      item_war_chest: "Cofre de Suministros Militares"
    }
  },
  profile: {
    subtitle: "Identidad imperial, estadísticas bélicas y títulos nobiliarios",
    changeNameTitle: "Cambiar Nombre de Soberano",
    progressToLevel: "Progreso al Nivel {level} ({title})",
    chooseHeroEmblem: "Elige tu Emblema de Héroe:",
    statMilitaryPower: "Poder Militar",
    statStructures: "Estructuras",
    statActivePop: "Población Activa",
    statRoyalTreasury: "Tesoro Real",
    nftBadge: "NFT DE PRESTIGIO",
    nftName: "Pase de Soberano Fundador OG",
    nftPerk: "+10% Velocidad de Producción de Oro & Acceso a Torneos Web3",
    completedBadge: "¡Completado!",
    inProgressBadge: "En camino...",
    realmTitle: "Soberano del Bastión del Trono",
    achievements: {
      "ach-1": {
        title: "Primer Asentamiento",
        desc: "Construye al menos 3 estructuras en la meseta flotante"
      },
      "ach-2": {
        title: "Señor de la Guerra",
        desc: "Recluta un ejército de más de 8 unidades de combate"
      },
      "ach-3": {
        title: "Tesoro Imperial",
        desc: "Alcanza una reserva de más de 1,000 monedas de oro"
      },
      "ach-4": {
        title: "Maestro de la Magia",
        desc: "Recluta al menos 2 Canalizadores Arcanos en tu guarnición"
      }
    }
  },
  ranking: {
    yourSovereignty: "Tu Reino Soberano",
    chaosKingdom: "Bastión del Trono"
  },
  shop: {
    dailyBlessingDesc: "Reclama 50 Cristales y 500 de Oro cada 24 horas directamente desde la Cámara Imperial."
  },
  techTree: {
    mastered: "Dominado",
    prerequisite: "Requisito previo:",
    branches: {
      economy: {
        desc: "Optimiza la extracción de recursos y el rendimiento de minas, campos y aserraderos."
      },
      military: {
        desc: "Mejora el armamento, la resistencia del ejército y el daño en la campaña de mazmorras."
      },
      arcane: {
        desc: "Desbloquea secretos arcanos para potenciar la magia elemental y la obtención de gemas."
      }
    }
  },
  techData: {
    techs: {
      "tech-swords": {
        name: "Herrería de Acero Templado",
        subtitle: "Armaduras Pesadas",
        effect: "+30 HP máximo para el héroe y +10% de mitigación de daño militar en mazmorras."
      },
      "tech-tactics": {
        name: "Estrategia de Asedio",
        subtitle: "Tácticas de Batalla",
        effect: "+12 de daño base adicional en todas las categorías de impacto (Normal, Perfect, Crit)."
      },
      "tech-fury": {
        name: "Celo Imperial Inquebrantable",
        subtitle: "Liderazgo Real",
        effect: "La habilidad 'Furia Real' inflige +35% de daño adicional y aturde con mayor fuerza."
      },
      "tech-crystals": {
        name: "Canalización Arcana",
        subtitle: "Foco de Éter",
        effect: "Los Magos de Asalto añaden +8 de daño mágico arcano directo en cada impacto."
      },
      "tech-alchemy": {
        name: "Transmutación de Éter",
        subtitle: "Alquimia Prohibida",
        effect: "Otorga +1 Gema adicional en cada victoria de mazmorra y aumenta producción del Portal."
      }
    }
  },
  common: {
    rarity: {
      common: "Común",
      rare: "Raro",
      legendary: "Legendario",
      mythic: "Mítico"
    }
  }
}

// 3. Data additions for BR (Portuguese)
const brAdditions = {
  inventory: {
    tag: "Câmara do Tesouro Real",
    title: "Baú de Relíquias e Mochila",
    legendaryRelics: "Relíquias ({current}/{total})",
    battleBag: "Bolsa de Batalha e Poções",
    activeGear: "Equipamento Ativo do Soberano",
    emptySlot: "Espaço Vazio",
    unequip: "Desequipar",
    activeBonuses: "Bônus Ativos:",
    relicCollection: "Coleção de Relíquias Desbloqueadas",
    dropSourcePrefix: "Origem:",
    equipped: "Equipado",
    equipRelic: "Equipar Relíquia",
    defeatBossToObtain: "Derrote o chefe da masmorra para obter",
    consumablesIntro: "Consumíveis em sua bolsa estão disponíveis com acesso rápido durante batalhas de masmorra. Use-os para salvar seu herói ou esmagar o chefe!",
    inBag: "Na bolsa: x{count}",
    craftCost: "Custo de criação:",
    craftOne: "Criar +1 Unidade",
    insufficientRes: "Recursos Insuficientes"
  },
  arena: {
    headerSub: "Conquiste ciudadelas rivais, acumule Coroas e suba na glória imperial.",
    lootMultiplier: "Multiplicador de saque:",
    nextLeague: "Próxima Liga:",
    maxLeague: "Classificação Máxima Atingida",
    seasonRewardLead: "Recompensa do seu nível:",
    defenseNoticeSub: "Enquanto você estiver fora do reino, outros senhores podem tentar invadir suas muralhas. Busque vingança para recuperar coroas e honra!",
    howToAttackTitle: "COMO ATACAR NO PVP?",
    howToAttackDesc: "Invada reinos rivais, rompa suas muralhas e saqueie recursos e Coroas para subir de Liga.",
    showGuide: "Ver Guia de Ataque",
    hideGuide: "Ocultar Guia",
    step1Desc: "Compare a guarnição deles com suas tropas e avalie sua vantagem militar.",
    step2Title: "⚔️ Pressione ATACAR AGORA!",
    step2Desc: "Cada ataque consome 1 de seus 3 Ataques diários (recarregam gratuitamente).",
    step3Desc: "Na batalha, ataque 3 edifícios para quebrar seus cofres e ganhar saques.",
    troopsSafe: "Suas tropas não morrem!",
    troopsSafeDesc: "Nas invasões do coliseu seu exército permanece intacto. Treinar mais tropas no Quartel aumenta seu poder de invasão e vitória.",
    powerUnit: "Poder",
    infantry: "Infantaria",
    archers: "Arqueiros",
    commanders: "Comandantes",
    mages: "Magos",
    breachSuccess: "Sucesso de Invasão",
    rivalsSectionSub: "Selecione um reino rival e pressione atacar para iniciar a invasão.",
    advantage: "Vantagem Militar!",
    advantageDesc: "Suas tropas superam as defesas deles!",
    balanced: "Duelo Equilibrado",
    balancedDesc: "Combate equilibrado com bom saque",
    danger: "Ataque Exigente",
    dangerDesc: "Alto risco, saque máximo",
    defensivePower: "Poder Defensivo:",
    defensiveGarrison: "Guarnição Defensiva:",
    attackNow: "ATACAR AGORA!",
    spendsTicket: "Gasta 1 Ataque ({tickets}/3 disponíveis)",
    noTicketsPrompt: "Sem Ataques • 10 Cristais 💎",
    successfulDefense: "Defesa Bem-sucedida (+{count} Coroas)",
    wallBreached: "Muralha Rompida ({trophies} Coroas, -{gold} Ouro)",
    revengeClaimed: "Vingança Concluída",
    revengeNow: "Vingança!",
    emptyDefenseNotice: "Nenhum ataque recente recebido. Suas muralhas continuam fortes!",
    honorSub: "Gaste as Moedas de Honra ganhas em combate em relíquias militares exclusivas e escudos de paz."
  },
  profile: {
    subtitle: "Identidade imperial, estatísticas militares e títulos nobres",
    changeNameTitle: "Alterar Nome do Soberano",
    progressToLevel: "Progresso para o Nível {level} ({title})",
    chooseHeroEmblem: "Escolha seu Emblema de Herói:",
    statMilitaryPower: "Poder Militar",
    statStructures: "Estruturas",
    statActivePop: "População Ativa",
    statRoyalTreasury: "Tesouro Real",
    nftBadge: "NFT DE PRESTÍGIO",
    nftName: "Passe de Soberano Fundador OG",
    nftPerk: "+10% Velocidade de Produção de Ouro e Acesso a Torneios Web3",
    completedBadge: "Concluído!",
    inProgressBadge: "Em andamento...",
    realmTitle: "Soberano do Bastião do Trono",
    achievements: {
      "ach-1": { title: "Primeiro Assentamento", desc: "Construa pelo menos 3 estruturas no planalto flutuante" },
      "ach-2": { title: "Senhor da Guerra", desc: "Recrute um exército de mais de 8 unidades de combate" },
      "ach-3": { title: "Tesouro Imperial", desc: "Alcance uma reserva de mais de 1.000 moedas de ouro" },
      "ach-4": { title: "Mestre da Magia", desc: "Recrute pelo menos 2 Canalizadores Arcanos em sua guarnição" }
    }
  },
  ranking: {
    yourSovereignty: "Seu Reino Soberano",
    chaosKingdom: "Bastião do Trono"
  },
  shop: {
    dailyBlessingDesc: "Reivindique 50 Cristais e 500 de Ouro a cada 24 horas diretamente da Câmara Imperial."
  },
  techTree: {
    mastered: "Dominado",
    prerequisite: "Pré-requisito:",
    branches: {
      economy: { desc: "Otimize a extração de recursos e o rendimento de minas, campos e serrarias." },
      military: { desc: "Melhore os armamentos, a resistência do exército e o dano na campanha de masmorras." },
      arcane: { desc: "Desbloqueie segredos arcanos para fortalecer a magia elemental e a obtenção de gemas." }
    }
  }
}

// 4. Data additions for KR (Korean)
const krAdditions = {
  inventory: {
    tag: "왕실 보물실",
    title: "유물 상자 및 배낭",
    legendaryRelics: "유물 ({current}/{total})",
    battleBag: "전투 가방 및 물약",
    activeGear: "영주의 활성 장비",
    emptySlot: "빈 슬롯",
    unequip: "장착 해제",
    activeBonuses: "활성 보너스:",
    relicCollection: "해금된 유물 컬렉션",
    dropSourcePrefix: "획득처:",
    equipped: "장착됨",
    equipRelic: "유물 장착",
    defeatBossToObtain: "던전 보스를 처치하여 획득",
    consumablesIntro: "가방의 소모품은 던전 전투 중 빠른 접근으로 사용할 수 있습니다. 영웅을 구하거나 보스를 쓰러뜨리세요!",
    inBag: "가방 내: x{count}",
    craftCost: "제작 비용:",
    craftOne: "+1개 제작",
    insufficientRes: "자원 부족"
  },
  arena: {
    headerSub: "라이벌 성채를 정복하고 왕관을 모아 제국의 영광으로 승격하세요.",
    lootMultiplier: "약탈 전리품 배수:",
    nextLeague: "다음 리그:",
    maxLeague: "최고 등급 도달",
    seasonRewardLead: "당신 등급의 보상:",
    defenseNoticeSub: "왕국을 비운 동안 다른 영주들이 성벽을 공격할 수 있습니다. 복수하여 왕관과 명예를 되찾으세요!",
    howToAttackTitle: "PVP 공격 방법은?",
    howToAttackDesc: "라이벌 왕국을 습격하여 성벽을 부수고 자원과 왕관을 약탈하여 리그를 올리세요.",
    showGuide: "공격 가이드 보기",
    hideGuide: "가이드 숨기기",
    step1Desc: "적 주둔군과 아군을 비교하고 군사적 우위를 확인하세요.",
    step2Title: "⚔️ 지금 공격하기를 누르세요!",
    step2Desc: "공격 시 일일 3회의 공격권 중 1회가 소모됩니다 (무료 충전).",
    step3Desc: "전투에서 건물 3개를 타격하여 금고를 부수고 전리품을 획득하세요.",
    troopsSafe: "군대는 사망하지 않습니다!",
    troopsSafeDesc: "콜로세움 습격 시 군대는 온전하게 유지됩니다. 병영에서 군대를 더 훈련하면 돌파력과 승률이 증가합니다.",
    powerUnit: "전투력",
    infantry: "보병",
    archers: "궁수",
    commanders: "지휘관",
    mages: "마법사",
    breachSuccess: "돌파 성공률",
    rivalsSectionSub: "라이벌 왕국을 선택하고 공격 버튼을 눌러 포위를 시작하세요.",
    advantage: "군사적 우위!",
    advantageDesc: "아군 부대가 적 수비대를 압도합니다!",
    balanced: "호각의 대결",
    balancedDesc: "좋은 전리품이 있는 균형 잡힌 전투",
    danger: "도전적인 습격",
    dangerDesc: "고위험, 최대 전리품",
    defensivePower: "방어력:",
    defensiveGarrison: "수비 주둔군:",
    attackNow: "지금 공격!",
    spendsTicket: "공격 1회 소모 ({tickets}/3회 가능)",
    noTicketsPrompt: "공격권 없음 • 크리스탈 10개 💎",
    successfulDefense: "방어 성공 (+{count} 왕관)",
    wallBreached: "성벽 함락 ({trophies} 왕관, -{gold} 골드)",
    revengeClaimed: "복수 완료",
    revengeNow: "복수하기!",
    emptyDefenseNotice: "최근 공격을 받지 않았습니다. 성벽이 견고합니다!",
    honorSub: "전투에서 획득한 명예 주화를 독점 군사 유물과 평화의 방패에 사용하세요."
  },
  profile: {
    subtitle: "제국 신원, 군사 통계 및 귀족 칭호",
    changeNameTitle: "영주 이름 변경",
    progressToLevel: "{level}레벨 달성 진행도 ({title})",
    chooseHeroEmblem: "영웅 엠블럼을 선택하세요:",
    statMilitaryPower: "군사력",
    statStructures: "건물",
    statActivePop: "활동 인구",
    statRoyalTreasury: "왕실 금고",
    nftBadge: "프레스티지 NFT",
    nftName: "창립 영주 OG 패스",
    nftPerk: "+10% 금 생산 속도 및 Web3 토너먼트 참가 자격",
    completedBadge: "완료!",
    inProgressBadge: "진행 중...",
    realmTitle: "왕좌 요새의 영주",
    achievements: {
      "ach-1": { title: "첫 정착지", desc: "부유 고원에 최소 3개의 건물을 건설하세요" },
      "ach-2": { title: "전쟁의 영주", desc: "8개 이상의 전투 유닛으로 군대를 모집하세요" },
      "ach-3": { title: "제국 금고", desc: "1,000 골드 이상의 비축량을 달성하세요" },
      "ach-4": { title: "마법의 대가", desc: "주둔군에 비전 시전자를 2명 이상 모집하세요" }
    }
  },
  ranking: {
    yourSovereignty: "당신의 주권 왕국",
    chaosKingdom: "혼돈의 왕좌 요새"
  },
  shop: {
    dailyBlessingDesc: "제국 금고에서 24시간마다 50개의 크리스탈과 500개의 골드를 수령하세요."
  },
  techTree: {
    mastered: "완료",
    prerequisite: "선행 조건:",
    branches: {
      economy: { desc: "자원 추출과 광산, 농지, 제재소의 생산량을 최적화합니다." },
      military: { desc: "던전 캠페인에서 무기, 군대 내구도 및 피해량을 향상시킵니다." },
      arcane: { desc: "원소 마법과 보석 획득을 강화하는 비전 비밀을 해제하세요." }
    }
  }
}

// 5. Data additions for CN (Simplified Chinese)
const cnAdditions = {
  inventory: {
    tag: "皇家藏宝室",
    title: "遗物箱与背包",
    legendaryRelics: "遗物 ({current}/{total})",
    battleBag: "战斗背包与药水",
    activeGear: "统治者的当前装备",
    emptySlot: "空槽位",
    unequip: "卸下",
    activeBonuses: "激活加成:",
    relicCollection: "已解锁遗物收藏",
    dropSourcePrefix: "来源:",
    equipped: "已装备",
    equipRelic: "装备遗物",
    defeatBossToObtain: "击败地牢首领以获取",
    consumablesIntro: "背包中的消耗品可在地牢战斗中快速使用。用它们拯救英雄或粉碎首领！",
    inBag: "背包中: x{count}",
    craftCost: "制造费用:",
    craftOne: "制造 +1 单位",
    insufficientRes: "资源不足"
  },
  arena: {
    headerSub: "征服对手城池，积累皇冠并在帝国荣耀中晋升。",
    lootMultiplier: "掠夺战利品倍率:",
    nextLeague: "下一联赛:",
    maxLeague: "已达最高段位",
    seasonRewardLead: "当前段位奖励:",
    defenseNoticeSub: "当你离开王国时，其他领主可能会围攻你的城墙。复仇夺回皇冠与荣誉！",
    howToAttackTitle: "PVP 中如何进攻？",
    howToAttackDesc: "突袭对手王国，攻破城墙并掠夺资源与皇冠以提升联赛段位。",
    showGuide: "查看进攻指南",
    hideGuide: "隐藏指南",
    step1Desc: "对比敌军驻军与己方部队，评估军事优势。",
    step2Title: "⚔️ 点击立即进攻！",
    step2Desc: "每次突袭消耗每日3次突袭机会中的1次（免费充能）。",
    step3Desc: "在战斗中攻击3处建筑以破开金库夺取战利品。",
    troopsSafe: "你的部队不会死亡！",
    troopsSafeDesc: "在竞技场突袭中你的军队保持完好无损。在兵营训练更多部队可提高攻破能力与胜率。",
    powerUnit: "战力",
    infantry: "步兵",
    archers: "弓箭手",
    commanders: "指挥官",
    mages: "法师",
    breachSuccess: "破城成功率",
    rivalsSectionSub: "选择对手王国并点击进攻以开始围攻。",
    advantage: "军事优势！",
    advantageDesc: "你的部队压制了对方防守！",
    balanced: "势均力敌",
    balancedDesc: "平衡战斗伴随丰厚战利品",
    danger: "艰巨突袭",
    dangerDesc: "高风险，最高战利品",
    defensivePower: "防御力量:",
    defensiveGarrison: "防守驻军:",
    attackNow: "立即进攻！",
    spendsTicket: "消耗 1 次突袭（可用 {tickets}/3）",
    noTicketsPrompt: "无突袭次数 • 10 水晶 💎",
    successfulDefense: "防守成功 (+{count} 皇冠)",
    wallBreached: "城墙失守 ({trophies} 皇冠, -{gold} 黄金)",
    revengeClaimed: "复仇已结",
    revengeNow: "复仇！",
    emptyDefenseNotice: "近期未受到突袭。你的城墙坚不可摧！",
    honorSub: "用战斗中获得的荣誉币兑换专属军事遗物和平安护盾。"
  },
  profile: {
    subtitle: "帝国身份、军事统计与贵族头衔",
    changeNameTitle: "更改领主名称",
    progressToLevel: "升至等级 {level} 进度 ({title})",
    chooseHeroEmblem: "选择你的英雄徽章:",
    statMilitaryPower: "军事力量",
    statStructures: "建筑结构",
    statActivePop: "活跃人口",
    statRoyalTreasury: "皇家金库",
    nftBadge: "声望 NFT",
    nftName: "创始领主 OG 通行证",
    nftPerk: "+10% 黄金生产速度与 Web3 锦标赛特权",
    completedBadge: "已完成！",
    inProgressBadge: "进行中...",
    realmTitle: "王座堡垒的统治者",
    achievements: {
      "ach-1": { title: "第一定居点", desc: "在浮空高原建造至少3座建筑" },
      "ach-2": { title: "战争领主", desc: "招募一支超过8个战斗单位的军队" },
      "ach-3": { title: "帝国金库", desc: "储备超过1,000枚金币" },
      "ach-4": { title: "魔法大师", desc: "在驻军中招募至少2名奥术引导者" }
    }
  },
  ranking: {
    yourSovereignty: "你的至高王国",
    chaosKingdom: "混沌王座堡垒"
  },
  shop: {
    dailyBlessingDesc: "每24小时直接从帝国金库领取50颗水晶和500枚黄金。"
  },
  techTree: {
    mastered: "已精通",
    prerequisite: "前置条件:",
    branches: {
      economy: { desc: "优化资源开采以及矿山、农田和伐木场的产量。" },
      military: { desc: "提升武器装备、军队防御力及地牢战役中的伤害。" },
      arcane: { desc: "解锁奥术秘辛，增强元素魔法并提高宝石获取率。" }
    }
  }
}

// Deep clone
const usObj = JSON.parse(JSON.stringify(us))
const esObj = JSON.parse(JSON.stringify(es))
const brObj = JSON.parse(JSON.stringify(br))
const krObj = JSON.parse(JSON.stringify(kr))
const cnObj = JSON.parse(JSON.stringify(cn))

// Apply language-specific additions
deepMerge(usObj, usAdditions)
deepMerge(esObj, esAdditions)
deepMerge(brObj, brAdditions)
deepMerge(krObj, krAdditions)
deepMerge(cnObj, cnAdditions)

// Write updated US and ES
writeFileSync('src/i18n/locales/us.js', `export const us = ${JSON.stringify(usObj, null, 2)};\n`, 'utf-8')
writeFileSync('src/i18n/locales/es.js', `export const es = ${JSON.stringify(esObj, null, 2)};\n`, 'utf-8')

function flattenKeys(obj, prefix = '') {
  let keys = []
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      keys = keys.concat(flattenKeys(val, path))
    } else {
      keys.push(path)
    }
  }
  return keys
}

function getNestedValue(obj, keyPath) {
  const keys = keyPath.split('.')
  let val = obj
  for (const k of keys) {
    if (val && typeof val === 'object' && k in val) {
      val = val[k]
    } else {
      return undefined
    }
  }
  return val
}

function setNestedValue(obj, keyPath, value) {
  const keys = keyPath.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {}
    }
    current = current[keys[i]]
  }
  current[keys[keys.length - 1]] = value
}

const allUsKeys = flattenKeys(usObj)
console.log(`Total canonical US keys after additions: ${allUsKeys.length}`)

const otherLocales = [
  { code: 'br', obj: brObj, varName: 'br' },
  { code: 'kr', obj: krObj, varName: 'kr' },
  { code: 'cn', obj: cnObj, varName: 'cn' },
]

for (const loc of otherLocales) {
  let added = 0
  for (const k of allUsKeys) {
    if (getNestedValue(loc.obj, k) === undefined) {
      setNestedValue(loc.obj, k, getNestedValue(usObj, k))
      added++
    }
  }
  const filePath = `src/i18n/locales/${loc.code}.js`
  writeFileSync(filePath, `export const ${loc.varName} = ${JSON.stringify(loc.obj, null, 2)};\n`, 'utf-8')
  console.log(`${loc.code.toUpperCase()}: Synced (added ${added} fallback keys) -> ${filePath}`)
}

console.log('All 5 locales patched and synchronized!')
