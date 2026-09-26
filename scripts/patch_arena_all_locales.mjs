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

const arenaPatch = {
  us: {
    honor: "Honor",
    you: "You",
    ticketsTooltip: "PvP Siege entries available",
    diff_easy: "Affordable Target",
    diff_normal: "Balanced Duel",
    diff_hard: "High-Risk Assault",
    leagueDescriptions: {
      league_bronze: "Initial tier of newly ascended warlords and border lords.",
      league_silver: "Organized baronies with tactical garrisons and veteran commanders.",
      league_gold: "Imperial counties with heavy infantry, elite archers, and arcane mages.",
      league_platinum: "Grand duchies with nearly impregnable fortresses and master tactics.",
      league_master: "The peak of the realm: the most legendary emperors of the server."
    },
    leagueChests: {
      league_bronze: "Gladiator Bronze Chest",
      league_silver: "Guard Silver Chest",
      league_gold: "Siege Golden Chest",
      league_platinum: "Heroes Platinum Ark",
      league_master: "Chaos Emperor Chest"
    },
    rivals: {
      rival_0: { name: "Lord Valerius", kingdom: "Crimson Fortress" },
      rival_1: { name: "Empress Aurelia", kingdom: "Dawn Bastion" },
      rival_2: { name: "Archmage Theron", kingdom: "Astral Tower" },
      rival_3: { name: "Paladin Siegfried", kingdom: "Imperial Guard" },
      rival_4: { name: "Baron Kaelen", kingdom: "Lands of Vengeance" },
      rival_5: { name: "Lady Sylvana", kingdom: "Shadow Forest" },
      rival_6: { name: "Marshal Roderic", kingdom: "Iron Walls" },
      rival_7: { name: "Vanguard Malakor", kingdom: "Storm Peak" },
      rival_8: { name: "Lady Cassandra", kingdom: "Golden Vanguard" },
      rival_9: { name: "Duke Balthazar", kingdom: "Dragon Citadel" }
    },
    attemptsCount: "Assault Attempts: {attempts} / 3",
    attemptAvailable: "Attempt {slot} available",
    attemptConsumed: "Attempt {slot} consumed",
    liveLootTooltip: "Accumulated loot in this siege",
    retreatTitle: "Retreat from Assault",
    directiveTitle: "⚔️ ASSAULT MISSION: TAP A BUILDING TO STRIKE!",
    directiveTitleDone: "Siege completed! Consolidating imperial loot...",
    directiveSub: "You have {attempts} of 3 assaults available. Tap the Castle or any structure to breach it.",
    directiveSubDone: "Your victorious troops secure the plundered vaults.",
    tapToAttack: "🎯 Tap to Attack!",
    tapToAttackTooltip: "Tap to strike {name} ({chance}% chance)",
    chanceTooltip: "Breach success rate",
    buildingLootTooltip: "Estimated loot from this building",
    statusLooted: "Breached!",
    statusDefended: "Defended!",
    sovereignRuler: "Sovereign {name}"
  },
  es: {
    honor: "Honor",
    you: "Tú",
    ticketsTooltip: "Entradas de Asedio PvP disponibles",
    diff_easy: "Objetivo Asequible",
    diff_normal: "Duelo Equilibrado",
    diff_hard: "Asalto de Alto Riesgo",
    leagueDescriptions: {
      league_bronze: "Tier inicial de caudillos y señores fronterizos recién ascendidos.",
      league_silver: "Baronías organizadas con guarniciones tácticas y comandantes veteranos.",
      league_gold: "Condados imperiales con infantería pesada, arqueros de élite y magos arcanos.",
      league_platinum: "Grandes Ducados con fortalezas casi inexpugnables y tácticas maestras.",
      league_master: "La cúspide del reino: los emperadores más legendarios del servidor."
    },
    leagueChests: {
      league_bronze: "Cofre de Bronce del Gladiador",
      league_silver: "Cofre de Plata de la Guardia",
      league_gold: "Cofre Dorado de Asedio",
      league_platinum: "Arca de Platino de los Héroes",
      league_master: "Cofre del Emperador del Caos"
    },
    rivals: {
      rival_0: { name: "Lord Valerius", kingdom: "Fortaleza Carmesí" },
      rival_1: { name: "Emperatriz Aurelia", kingdom: "Bastión del Alba" },
      rival_2: { name: "Archimago Theron", kingdom: "Torre Astral" },
      rival_3: { name: "Paladín Siegfried", kingdom: "Guardia Imperial" },
      rival_4: { name: "Barón Kaelen", kingdom: "Tierras de la Venganza" },
      rival_5: { name: "Señora Sylvana", kingdom: "Bosque de Sombras" },
      rival_6: { name: "Mariscal Roderic", kingdom: "Murallas de Hierro" },
      rival_7: { name: "Vanguardia Malakor", kingdom: "Pico de la Tormenta" },
      rival_8: { name: "Lady Cassandra", kingdom: "Vanguardia Dorada" },
      rival_9: { name: "Duque Balthazar", kingdom: "Ciudadela del Dragón" }
    },
    attemptsCount: "Intentos de Asalto: {attempts} / 3",
    attemptAvailable: "Intento {slot} disponible",
    attemptConsumed: "Intento {slot} consumido",
    liveLootTooltip: "Botín acumulado en este asedio",
    retreatTitle: "Retirarse del Asalto",
    directiveTitle: "⚔️ ¡MISIÓN DE ASALTO: TOCA UN EDIFICIO PARA ATACAR!",
    directiveTitleDone: "¡Asedio completado! Consolidando el botín imperial conquistado...",
    directiveSub: "Tienes {attempts} de 3 asaltos disponibles. Pulsa en el Castillo o en cualquier edificio para saquearlo.",
    directiveSubDone: "Tus tropas victoriosas aseguran las arcas saqueadas.",
    tapToAttack: "🎯 ¡Toca para Atacar!",
    tapToAttackTooltip: "Pulsar para atacar {name} ({chance}% éxito)",
    chanceTooltip: "Probabilidad de éxito en la brecha",
    buildingLootTooltip: "Botín estimado de esta edificación",
    statusLooted: "¡Saqueado!",
    statusDefended: "¡Defendido!",
    sovereignRuler: "Soberano {name}"
  },
  br: {
    honor: "Honra",
    you: "Você",
    ticketsTooltip: "Entradas de Cerco PvP disponíveis",
    diff_easy: "Alvo Acessível",
    diff_normal: "Duelo Equilibrado",
    diff_hard: "Assalto de Alto Risco",
    leagueDescriptions: {
      league_bronze: "Nível inicial de senhores da guerra e senhores da fronteira recém-promovidos.",
      league_silver: "Baronias organizadas com guarnições táticas e comandantes veteranos.",
      league_gold: "Condados imperiais com infantaria pesada, arqueiros de elite e magos arcanos.",
      league_platinum: "Grão-ducados com fortalezas quase inexpugnáveis e táticas magistrais.",
      league_master: "O ápice do reino: os imperadores mais lendários do servidor."
    },
    leagueChests: {
      league_bronze: "Baú de Bronze do Gladiador",
      league_silver: "Baú de Prata da Guarda",
      league_gold: "Baú Dourado de Cerco",
      league_platinum: "Arca de Platina dos Heróis",
      league_master: "Baú do Imperador do Caos"
    },
    rivals: {
      rival_0: { name: "Lord Valerius", kingdom: "Fortaleza Carmesim" },
      rival_1: { name: "Imperatriz Aurélia", kingdom: "Bastião da Alvorada" },
      rival_2: { name: "Arquimago Theron", kingdom: "Torre Astral" },
      rival_3: { name: "Paladino Siegfried", kingdom: "Guarda Imperial" },
      rival_4: { name: "Barão Kaelen", kingdom: "Terras da Vingança" },
      rival_5: { name: "Senhora Sylvana", kingdom: "Floresta das Sombras" },
      rival_6: { name: "Marechal Roderic", kingdom: "Muralhas de Ferro" },
      rival_7: { name: "Vanguarda Malakor", kingdom: "Pico da Tempestade" },
      rival_8: { name: "Lady Cassandra", kingdom: "Vanguarda Dourada" },
      rival_9: { name: "Duque Baltazar", kingdom: "Cidadela do Dragão" }
    },
    attemptsCount: "Tentativas de Ataque: {attempts} / 3",
    attemptAvailable: "Tentativa {slot} disponível",
    attemptConsumed: "Tentativa {slot} consumida",
    liveLootTooltip: "Espólio acumulado neste cerco",
    retreatTitle: "Recuar do Assalto",
    directiveTitle: "⚔️ MISSÃO DE CERCO: TOQUE EM UM EDIFÍCIO PARA ATACAR!",
    directiveTitleDone: "Cerco concluído! Consolidando os espólios imperiais...",
    directiveSub: "Você tem {attempts} de 3 ataques disponíveis. Toque no Castelo ou em qualquer edifício para saqueá-lo.",
    directiveSubDone: "Suas tropas vitoriosas asseguram os cofres saqueados.",
    tapToAttack: "🎯 Toque para Atacar!",
    tapToAttackTooltip: "Toque para atacar {name} ({chance}% chance)",
    chanceTooltip: "Taxa de sucesso de brecha",
    buildingLootTooltip: "Espólio estimado deste edifício",
    statusLooted: "Saqueado!",
    statusDefended: "Defendido!",
    sovereignRuler: "Soberano {name}"
  },
  kr: {
    honor: "명예",
    you: "나",
    ticketsTooltip: "사용 가능한 PvP 공성 입장권",
    diff_easy: "쉬운 목표",
    diff_normal: "균형잡힌 결투",
    diff_hard: "고위험 습격",
    leagueDescriptions: {
      league_bronze: "새로 승격된 국경 영주와 군주들의 시작 티어입니다.",
      league_silver: "전술적 주둔군과 베테랑 지휘관이 있는 조직화된 남작령.",
      league_gold: "중보병, 정예 궁수, 비전 마법사를 갖춘 제국 백작령.",
      league_platinum: "거의 난공불락의 요새와 뛰어난 전술을 갖춘 대공국.",
      league_master: "왕국의 정점: 서버에서 가장 전설적인 황제들."
    },
    leagueChests: {
      league_bronze: "검투사의 청동 상자",
      league_silver: "경비대의 은 상자",
      league_gold: "공성의 황금 상자",
      league_platinum: "영웅의 백금 궤",
      league_master: "혼돈의 황제 상자"
    },
    rivals: {
      rival_0: { name: "발레리우스 경", kingdom: "진홍빛 요새" },
      rival_1: { name: "아우렐리아 여제", kingdom: "새벽의 요새" },
      rival_2: { name: "대마법사 테론", kingdom: "별빛 탑" },
      rival_3: { name: "성기사 지크프리트", kingdom: "제국 근위대" },
      rival_4: { name: "카엘렌 남작", kingdom: "복수의 대지" },
      rival_5: { name: "실바나 여사", kingdom: "그림자 숲" },
      rival_6: { name: "로데릭 원수", kingdom: "철벽의 성벽" },
      rival_7: { name: "선봉장 말라코르", kingdom: "폭풍의 봉우리" },
      rival_8: { name: "카산드라 영애", kingdom: "황금 선봉대" },
      rival_9: { name: "발타자르 공작", kingdom: "용의 성채" }
    },
    attemptsCount: "습격 기회: {attempts} / 3",
    attemptAvailable: "{slot}번째 기회 사용 가능",
    attemptConsumed: "{slot}번째 기회 사용됨",
    liveLootTooltip: "이번 공성에서 획득한 전리품",
    retreatTitle: "습격에서 후퇴",
    directiveTitle: "⚔️ 습격 임무: 공격할 건물을 터치하세요!",
    directiveTitleDone: "공성 완료! 정복한 제국 전리품을 정산하는 중...",
    directiveSub: "{attempts}/3회의 습격 기회가 남았습니다. 성이나 건물을 터치하여 약탈하세요.",
    directiveSubDone: "승리한 군대가 약탈한 금고를 확보했습니다.",
    tapToAttack: "🎯 터치하여 공격!",
    tapToAttackTooltip: "터치하여 {name} 공격 (성공률 {chance}%)",
    chanceTooltip: "돌파 성공률",
    buildingLootTooltip: "이 건물의 예상 전리품",
    statusLooted: "약탈됨!",
    statusDefended: "방어됨!",
    sovereignRuler: "군주 {name}"
  },
  cn: {
    honor: "荣誉",
    you: "你",
    ticketsTooltip: "可用的PvP围攻入场券",
    diff_easy: "容易的目标",
    diff_normal: "势均力敌",
    diff_hard: "高风险突袭",
    leagueDescriptions: {
      league_bronze: "新晋军阀和边境领主的初级段位。",
      league_silver: "拥有战术驻军和经验丰富的指挥官的男爵领地。",
      league_gold: "拥有重装步兵、精锐弓箭手和奥术法师的帝国伯爵领地。",
      league_platinum: "拥有坚不可摧的堡垒和高超战术的大公国。",
      league_master: "王国的巅峰：全服最传奇的帝皇。"
    },
    leagueChests: {
      league_bronze: "角斗士青铜宝箱",
      league_silver: "守卫白银宝箱",
      league_gold: "围攻黄金宝箱",
      league_platinum: "英雄白金圣匣",
      league_master: "混沌帝皇宝箱"
    },
    rivals: {
      rival_0: { name: "瓦莱里乌斯领主", kingdom: "深红要塞" },
      rival_1: { name: "奥蕾莉亚女皇", kingdom: "黎明堡垒" },
      rival_2: { name: "大法师塞隆", kingdom: "星光塔" },
      rival_3: { name: "圣骑士齐格弗里德", kingdom: "帝国卫队" },
      rival_4: { name: "凯伦男爵", kingdom: "复仇之地" },
      rival_5: { name: "希尔瓦娜夫人", kingdom: "暗影之森" },
      rival_6: { name: "罗德里克元帅", kingdom: "铁壁之城" },
      rival_7: { name: "先锋马拉科尔", kingdom: "风暴之巅" },
      rival_8: { name: "卡珊德拉女士", kingdom: "黄金先锋" },
      rival_9: { name: "巴尔萨泽公爵", kingdom: "巨龙要塞" }
    },
    attemptsCount: "突袭机会: {attempts} / 3",
    attemptAvailable: "第 {slot} 次突袭可用",
    attemptConsumed: "第 {slot} 次突袭已消耗",
    liveLootTooltip: "本次围攻累积掠夺战利品",
    retreatTitle: "从突袭中撤退",
    directiveTitle: "⚔️ 突击任务：点击目标建筑发起攻击！",
    directiveTitleDone: "围攻完成！正在整理缴获的帝国战利品...",
    directiveSub: "你有 {attempts}/3 次突袭机会。点击城堡或任意建筑即可发起掠夺。",
    directiveSubDone: "胜利的军队正在清点掠夺的金库。",
    tapToAttack: "🎯 点击进攻！",
    tapToAttackTooltip: "点击进攻 {name} (成功率 {chance}%)",
    chanceTooltip: "突防成功率",
    buildingLootTooltip: "该建筑预估掠夺战利品",
    statusLooted: "已被掠夺！",
    statusDefended: "已被防守！",
    sovereignRuler: "统治者 {name}"
  }
}

const honorShopDetails = {
  us: {
    item_relic_manto_vencedor: {
      name: "Mantle of the Victor",
      desc: "Cape trimmed with imperial purple that strikes fear into rival citadels.",
      effect: "+20% base damage in the Arena and +12 permanent HP."
    },
    item_shield_8h: {
      name: "Peace Shield (8 Hours)",
      desc: "A magical veil protects your citadel against any rival siege while you rest.",
      effect: "Total immunity from player assaults for 8 hours."
    },
    item_shield_24h: {
      name: "Peace Shield (24 Hours)",
      desc: "The absolute blessing of ancient kings. None may breach your vaults for an entire day.",
      effect: "Total immunity from player assaults for 24 hours."
    },
    item_gems_pouch: {
      name: "Pouch of 60 Arcane Gems",
      desc: "Pure ether crystals extracted from the ruins of fallen gladiators.",
      effect: "+60 Royal Gems to accelerate or unlock perks."
    },
    item_war_chest: {
      name: "Military Supply Chest",
      desc: "Campaign supplies packed with provisions, gold, and veteran recruits.",
      effect: "Massive gold, materials, and reinforcement battalion ready to march."
    }
  },
  es: {
    item_relic_manto_vencedor: {
      name: "Manto del Vencedor",
      desc: "Capa con ribetes de púrpura imperial que infunde terror en las fortalezas rivales.",
      effect: "+20% de daño base en la Arena y +12 HP permanente."
    },
    item_shield_8h: {
      name: "Escudo de Paz (8 Horas)",
      desc: "Un velo mágico protege tu fortaleza contra cualquier asedio rival mientras descansas.",
      effect: "Inmunidad total contra asaltos de jugadores durante 8 horas."
    },
    item_shield_24h: {
      name: "Escudo de Paz (24 Horas)",
      desc: "La bendición absoluta de los antiguos reyes. Nadie podrá saquear tus arcas por un día entero.",
      effect: "Inmunidad total contra asaltos de jugadores durante 24 horas."
    },
    item_gems_pouch: {
      name: "Bolsa de 60 Gemas Arcanas",
      desc: "Cristales de éter puro extraídos de las ruinas de gladiadores caídos.",
      effect: "+60 Gemas Reales para acelerar o desbloquear beneficios."
    },
    item_war_chest: {
      name: "Cofre de Suministros Militares",
      desc: "Suministros de campaña con víveres, oro y reclutas veteranos.",
      effect: "Oro masivo, materiales y batallón de refuerzos listo para marchar."
    }
  },
  br: {
    item_relic_manto_vencedor: {
      name: "Manto do Vencedor",
      desc: "Capa com detalhes em púrpura imperial que incute medo nas fortalezas rivais.",
      effect: "+20% de dano base na Arena e +12 de HP permanente."
    },
    item_shield_8h: {
      name: "Escudo de Paz (8 Horas)",
      desc: "Um véu mágico protege sua fortaleza contra qualquer cerco rival enquanto você descansa.",
      effect: "Imunidade total contra ataques de jogadores por 8 horas."
    },
    item_shield_24h: {
      name: "Escudo de Paz (24 Horas)",
      desc: "A bênção absoluta dos reis antigos. Ninguém poderá saquear seus cofres por um dia inteiro.",
      effect: "Imunidade total contra ataques de jogadores por 24 horas."
    },
    item_gems_pouch: {
      name: "Bolsa de 60 Gemas Arcanas",
      desc: "Cristais de éter puro extraídos das ruínas de gladiadores caídos.",
      effect: "+60 Gemas Reais para acelerar ou desbloquear benefícios."
    },
    item_war_chest: {
      name: "Baú de Suprimentos Militares",
      desc: "Suprimentos de campanha com mantimentos, ouro e recrutas veteranos.",
      effect: "Ouro maciço, materiais e batalhão de reforços pronto para marchar."
    }
  },
  kr: {
    item_relic_manto_vencedor: {
      name: "승리자의 망토",
      desc: "라이벌 요새에 공포를 불어넣는 제국 자줏빛 테두리 망토.",
      effect: "투기장 기본 피해량 +20% 및 영구 HP +12."
    },
    item_shield_8h: {
      name: "평화의 방패 (8시간)",
      desc: "휴식을 취하는 동안 마법의 장막이 라이벌의 공성으로부터 요새를 보호합니다.",
      effect: "8시간 동안 플레이어 습격으로부터 완전 면역."
    },
    item_shield_24h: {
      name: "평화의 방패 (24시간)",
      desc: "고대 왕들의 절대적인 축복. 하루 종일 누구도 당신의 금고를 털 수 없습니다.",
      effect: "24시간 동안 플레이어 습격으로부터 완전 면역."
    },
    item_gems_pouch: {
      name: "비전 보석 60개 주머니",
      desc: "쓰러진 검투사의 유적에서 추출한 순수한 에테르 결정.",
      effect: "특전을 가속하거나 해제할 수 있는 왕실 보석 +60."
    },
    item_war_chest: {
      name: "군수 보급 상자",
      desc: "식량, 금, 베테랑 신병이 가득한 출정 보급품.",
      effect: "막대한 양의 금, 자원 및 즉시 출진 가능한 지원군 대대."
    }
  },
  cn: {
    item_relic_manto_vencedor: {
      name: "胜利者斗篷",
      desc: "饰有帝国紫边的披风，令敌对要塞闻风丧胆。",
      effect: "竞技场基础伤害+20%，永久生命值+12。"
    },
    item_shield_8h: {
      name: "和平护盾（8小时）",
      desc: "魔法面纱在您休息时保护您的要塞免受任何对手的围攻。",
      effect: "8小时内完全免受玩家攻击。"
    },
    item_shield_24h: {
      name: "和平护盾（24小时）",
      desc: "古老君王的绝对祝福。整整一天内无人能洗劫您的国库。",
      effect: "24小时内完全免受玩家攻击。"
    },
    item_gems_pouch: {
      name: "60颗奥术宝石袋",
      desc: "从倒下的角斗士废墟中提取的纯净以太水晶。",
      effect: "+60皇家宝石，用于加速或解锁特权。"
    },
    item_war_chest: {
      name: "军备补给箱",
      desc: "装满口粮、黄金和精锐新兵的出征补给。",
      effect: "大量黄金、物资以及随时可以出击的增援大队。"
    }
  }
}

// Deep clone current locales
const usObj = JSON.parse(JSON.stringify(us))
const esObj = JSON.parse(JSON.stringify(es))
const brObj = JSON.parse(JSON.stringify(br))
const krObj = JSON.parse(JSON.stringify(kr))
const cnObj = JSON.parse(JSON.stringify(cn))

arenaPatch.us.honorShopDetails = honorShopDetails.us
arenaPatch.es.honorShopDetails = honorShopDetails.es
arenaPatch.br.honorShopDetails = honorShopDetails.br
arenaPatch.kr.honorShopDetails = honorShopDetails.kr
arenaPatch.cn.honorShopDetails = honorShopDetails.cn

// Merge arena patch
deepMerge(usObj, { arena: arenaPatch.us })
deepMerge(esObj, { arena: arenaPatch.es })
deepMerge(brObj, { arena: arenaPatch.br })
deepMerge(krObj, { arena: arenaPatch.kr })
deepMerge(cnObj, { arena: arenaPatch.cn })

// Save updated US, ES, BR, KR, CN
writeFileSync('src/i18n/locales/us.js', `export const us = ${JSON.stringify(usObj, null, 2)};\n`, 'utf-8')
writeFileSync('src/i18n/locales/es.js', `export const es = ${JSON.stringify(esObj, null, 2)};\n`, 'utf-8')
writeFileSync('src/i18n/locales/br.js', `export const br = ${JSON.stringify(brObj, null, 2)};\n`, 'utf-8')
writeFileSync('src/i18n/locales/kr.js', `export const kr = ${JSON.stringify(krObj, null, 2)};\n`, 'utf-8')
writeFileSync('src/i18n/locales/cn.js', `export const cn = ${JSON.stringify(cnObj, null, 2)};\n`, 'utf-8')

console.log('All 5 locales patched successfully!')
