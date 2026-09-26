import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { us } from '../src/i18n/locales/us.js'
import { es } from '../src/i18n/locales/es.js'
import { br } from '../src/i18n/locales/br.js'
import { kr } from '../src/i18n/locales/kr.js'
import { cn } from '../src/i18n/locales/cn.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const TECH_TRANSLATIONS = {
  br: {
    categories: {
      economy: 'Economia & Produção',
      military: 'Poder Militar & Táticas',
      arcane: 'Misticismo & Arcano',
    },
    techs: {
      'tech-axes': {
        name: 'Machados de Aço Temperado',
        subtitle: 'Silvicultura Avançada',
        effect: '+20% de produção de madeira em todas as serrarias',
      },
      'tech-mines': {
        name: 'Veios Subterrâneos Profundos',
        subtitle: 'Geologia e Mineração',
        effect: '+25% de produção de ouro nas minas',
      },
      'tech-crops': {
        name: 'Rotação de Culturas',
        subtitle: 'Agricultura Eficiente',
        effect: '+20% de produção de alimentos em fazendas e moinhos',
      },
      'tech-quarry': {
        name: 'Cinzeis de Diamante',
        subtitle: 'Lapidação Pesada',
        effect: '+25% de produção de pedra em pedreiras',
      },
      'tech-logistics': {
        name: 'Logística Imperial',
        subtitle: 'Rede de Carroças Reais',
        effect: '+15% de produção global (todos os recursos)',
      },
      'tech-steel': {
        name: 'Forja de Aço Temperado',
        subtitle: 'Armaduras Pesadas',
        effect: '+15% de ATQ para infantaria e arqueiros',
      },
      'tech-bows': {
        name: 'Arcos Compostos de Teixo',
        subtitle: 'Atiradores Experientes',
        effect: '+20% de precisão à distância',
      },
      'tech-siege': {
        name: 'Estratégia de Cerco',
        subtitle: 'Engenheiros de Cerco Reais',
        effect: '+25% de dano de cerco na campanha',
      },
      'tech-fortification': {
        name: 'Muralhas Góticas',
        subtitle: 'Fortificação Avançada',
        effect: '+20% de defesa em todas as estruturas',
      },
      'tech-commander': {
        name: 'Código de Cavalaria',
        subtitle: 'Comandante Sagrado',
        effect: 'Desbloqueia Fúria Real (ATQ especial do comandante)',
      },
      'tech-arcane-channel': {
        name: 'Canal de Linhas Ley',
        subtitle: 'Sintonia Mística',
        effect: '+1 Gema por ciclo de produção no Portal',
      },
      'tech-portal-mastery': {
        name: 'Domínio Dimensional',
        subtitle: 'Feitiçaria Cósmica',
        effect: '+10% em todos os atributos na Campanha (ATQ e DEF)',
      },
      'tech-runecraft': {
        name: 'Forja de Runas',
        subtitle: 'Inscrições Ancestrais',
        effect: '+10% de EXP obtida de todas as fontes',
      },
      'tech-swords': {
        name: 'Ferraria de Aço Temperado',
        subtitle: 'Armadura Pesada',
        effect: '+30 de Vida Máxima para o herói e +10% de mitigação de dano militar nas masmorras.',
      },
      'tech-tactics': {
        name: 'Estratégia de Cerco Avançada',
        subtitle: 'Táticas de Batalha',
        effect: '+12 de dano base adicional em todas as categorias de impacto (Normal, Perfeito, Crítico).',
      },
      'tech-fury': {
        name: 'Zelo Imperial Inabalável',
        subtitle: 'Liderança Real',
        effect: "A habilidade 'Fúria Real' causa +35% de dano adicional e atordoa com maior impacto.",
      },
      'tech-crystals': {
        name: 'Canalização Arcana',
        subtitle: 'Foco do Éter',
        effect: 'Magos de Assalto adicionam +8 de dano mágico arcano direto a cada golpe.',
      },
      'tech-alchemy': {
        name: 'Transmutação do Éter',
        subtitle: 'Alquimia Proibida',
        effect: 'Concede +1 Gema adicional por vitória em masmorra e aprimora a produção do Portal.',
      },
    },
    liveCompetitors: 'Soberanos Online',
  },
  kr: {
    categories: {
      economy: '경제 및 생산',
      military: '군사력 및 전술',
      arcane: '신비 및 비전',
    },
    techs: {
      'tech-axes': {
        name: '강철 도끼',
        subtitle: '고급 임업 기술',
        effect: '모든 제재소의 목재 생산량 +20%',
      },
      'tech-mines': {
        name: '심층 광맥 탐사',
        subtitle: '지질학 및 채광',
        effect: '금광의 금 생산량 +25%',
      },
      'tech-crops': {
        name: '윤작 농법',
        subtitle: '효율적인 농경',
        effect: '농장과 방앗간의 식량 생산량 +20%',
      },
      'tech-quarry': {
        name: '다이아몬드 정',
        subtitle: '석재 가공 기술',
        effect: '채석장의 석재 생산량 +25%',
      },
      'tech-logistics': {
        name: '제국 물류망',
        subtitle: '왕실 운송망',
        effect: '모든 자원의 전역 생산량 +15%',
      },
      'tech-steel': {
        name: '단련된 강철 대장간',
        subtitle: '중장갑 방어구',
        effect: '보병 및 궁수 공격력 +15%',
      },
      'tech-bows': {
        name: '주목 합성궁',
        subtitle: '숙련된 명사수',
        effect: '원거리 명중률 및 피해 +20%',
      },
      'tech-siege': {
        name: '공성 전술',
        subtitle: '왕실 공성 공학',
        effect: '캠페인 공성 피해량 +25%',
      },
      'tech-fortification': {
        name: '고딕 양식 성벽',
        subtitle: '고급 요새화',
        effect: '모든 건물의 방어력 +20%',
      },
      'tech-commander': {
        name: '기사도 규범',
        subtitle: '성스러운 사령관',
        effect: "'왕실의 분노'(사령관 특수 공격) 해금",
      },
      'tech-arcane-channel': {
        name: '지맥 도관 연결',
        subtitle: '신비로운 공명',
        effect: '차원의 문 생산 주기당 보석 +1 추가',
      },
      'tech-portal-mastery': {
        name: '차원 장악',
        subtitle: '우주 마법',
        effect: '캠페인 전체 능력치 +10% (공격력 및 방어력)',
      },
      'tech-runecraft': {
        name: '룬 마법 각인',
        subtitle: '고대 문양',
        effect: '모든 활동에서 획득하는 경험치 +10%',
      },
      'tech-swords': {
        name: '강철 검 단조',
        subtitle: '중갑 방어구',
        effect: '영웅 최대 체력 +30 및 던전 내 군사 피해 경감 +10%.',
      },
      'tech-tactics': {
        name: '전술 지휘술',
        subtitle: '전투 전술',
        effect: '모든 타격 판정(일반, 완벽, 치명타)에 기본 피해 +12 추가.',
      },
      'tech-fury': {
        name: '흔들리지 않는 제국의 열정',
        subtitle: '왕실의 통솔력',
        effect: "'왕실의 분노' 기술의 피해량 +35% 및 기절 충격 강화.",
      },
      'tech-crystals': {
        name: '비전 마력 집중',
        subtitle: '에테르 집중',
        effect: '돌격 마법사가 공격 시 +8의 직접 비전 마법 피해 추가.',
      },
      'tech-alchemy': {
        name: '에테르 연금술',
        subtitle: '금지된 연금술',
        effect: '던전 승리 시 보석 +1 추가 지급 및 차원의 문 생산 촉진.',
      },
    },
    liveCompetitors: '온라인 군주',
  },
  cn: {
    categories: {
      economy: '经济与生产',
      military: '军事战力与战术',
      arcane: '秘术与奥术',
    },
    techs: {
      'tech-axes': {
        name: '精钢战斧',
        subtitle: '高级林业',
        effect: '所有锯木厂木材产量 +20%',
      },
      'tech-mines': {
        name: '深层地下矿脉',
        subtitle: '地质与采矿',
        effect: '金矿金币产量 +25%',
      },
      'tech-crops': {
        name: '轮作耕作',
        subtitle: '高效农业',
        effect: '农场和磨坊粮食产量 +20%',
      },
      'tech-quarry': {
        name: '金刚石凿',
        subtitle: '重型雕琢',
        effect: '采石场石料产量 +25%',
      },
      'tech-logistics': {
        name: '帝国后勤',
        subtitle: '皇家运输网络',
        effect: '全资源全局产量 +15%',
      },
      'tech-steel': {
        name: '淬火精钢锻造',
        subtitle: '重型装甲',
        effect: '步兵与弓手攻击力 +15%',
      },
      'tech-bows': {
        name: '紫杉复合弓',
        subtitle: '神射专精',
        effect: '远程精准度 +20%',
      },
      'tech-siege': {
        name: '攻城战术',
        subtitle: '皇家工兵工程',
        effect: '战役中攻城伤害 +25%',
      },
      'tech-fortification': {
        name: '哥特石墙',
        subtitle: '高级要塞强化',
        effect: '所有建筑防御力 +20%',
      },
      'tech-commander': {
        name: '骑士准则',
        subtitle: '圣洁指挥官',
        effect: '解锁“皇家之怒”（指挥官专属必杀技）',
      },
      'tech-arcane-channel': {
        name: '地脉能量引导',
        subtitle: '秘术共鸣',
        effect: '传送门每次生产周期额外获得 +1 宝石',
      },
      'tech-portal-mastery': {
        name: '维度掌控',
        subtitle: '宇宙秘法',
        effect: '战役全属性 +10%（攻击与防御）',
      },
      'tech-runecraft': {
        name: '符文锻造',
        subtitle: '先祖刻印',
        effect: '全渠道获取经验值 +10%',
      },
      'tech-swords': {
        name: '淬火锻铁重装',
        subtitle: '重型护甲',
        effect: '英雄最大生命值 +30，地下城军事减伤 +10%。',
      },
      'tech-tactics': {
        name: '战术推演',
        subtitle: '战场谋略',
        effect: '所有攻击判定（普通、完美、暴击）基础伤害额外 +12。',
      },
      'tech-fury': {
        name: '帝国狂热',
        subtitle: '王者统治',
        effect: '“皇家之怒”技能额外造成 +35% 伤害并大幅强化眩晕冲击。',
      },
      'tech-crystals': {
        name: '秘术传导',
        subtitle: '以太专注',
        effect: '突击法师每次攻击额外附加 +8 点纯粹奥术魔法伤害。',
      },
      'tech-alchemy': {
        name: '以太转化炼金',
        subtitle: '禁忌炼金',
        effect: '地下城胜利额外获得 +1 宝石，并提升传送门产量。',
      },
    },
    liveCompetitors: '在线领主',
  },
}

/**
 * Cleanly reconstructs an object keeping strictly the canonical schema of referenceObj
 * and stripping any key not in referenceObj.
 */
function conformToSchema(canonical, target) {
  if (Array.isArray(canonical)) {
    return Array.isArray(target) ? target : canonical
  }
  if (canonical && typeof canonical === 'object') {
    const result = {}
    for (const key of Object.keys(canonical)) {
      const canonicalVal = canonical[key]
      const targetVal = target ? target[key] : undefined
      result[key] = conformToSchema(canonicalVal, targetVal !== undefined ? targetVal : canonicalVal)
    }
    return result
  }
  return target !== undefined ? target : canonical
}

const targets = [
  { code: 'br', raw: br },
  { code: 'kr', raw: kr },
  { code: 'cn', raw: cn },
]

for (const { code, raw } of targets) {
  const trans = TECH_TRANSLATIONS[code]
  
  // 1. Inject native translations
  if (trans) {
    if (!raw.techData) raw.techData = {}
    raw.techData.categories = trans.categories
    raw.techData.techs = trans.techs
    if (!raw.ranking) raw.ranking = {}
    raw.ranking.liveCompetitors = trans.liveCompetitors
  }

  // 2. Conform strictly to canonical US schema (stripping all 33 orphan keys)
  const conformed = conformToSchema(us, raw)

  // 3. Write out cleanly
  const filePath = path.join(rootDir, 'src', 'i18n', 'locales', `${code}.js`)
  const content = `export const ${code} = ${JSON.stringify(conformed, null, 2)}\n`
  fs.writeFileSync(filePath, content, 'utf-8')
  console.log(`✓ Synchronized and purified ${code.toUpperCase()} -> ${filePath}`)
}

console.log('\nAll locales synchronized and pruned!')
