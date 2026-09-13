import { writeFileSync } from 'fs'
import { us } from '../src/i18n/locales/us.js'
import { es } from '../src/i18n/locales/es.js'
import { kr } from '../src/i18n/locales/kr.js'
import { cn } from '../src/i18n/locales/cn.js'
import { br } from '../src/i18n/locales/br.js'

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

const patches = {
  us: {
    common: {
      decree: "Decree",
      research: "Research",
      construction: "Construction"
    },
    notifications: {
      xpDecree: "Decree: {title}",
      xpResearch: "Research: {name}",
      xpRecruit: "Recruit trained",
      xpSpeedup: "Imperial Speedup",
      xpSpeedupWork: "Accelerated Work",
      xpSiege: "Victorious Siege",
      xpExpedition: "Expedition completed",
      xpDungeon: "Dungeon conquered",
      xpGraduation: "Kingdom Graduation",
      xpVictoryNode: "Victory: {name}"
    }
  },
  es: {
    common: {
      decree: "Decreto",
      research: "Investigación",
      construction: "Construcción"
    },
    notifications: {
      xpDecree: "Decreto: {title}",
      xpResearch: "Investigación: {name}",
      xpRecruit: "Recluta entrenado",
      xpSpeedup: "Aceleración Imperial",
      xpSpeedupWork: "Obra Acelerada",
      xpSiege: "Asedio Victorioso",
      xpExpedition: "Expedición completada",
      xpDungeon: "Mazmorra conquistada",
      xpGraduation: "Graduación del Reino",
      xpVictoryNode: "Victoria: {name}"
    }
  },
  kr: {
    common: {
      decree: "칙령",
      research: "연구",
      construction: "건설"
    },
    notifications: {
      xpDecree: "칙령: {title}",
      xpResearch: "연구: {name}",
      xpRecruit: "신병 훈련 완료",
      xpSpeedup: "황실 가속",
      xpSpeedupWork: "가속 완료 공사",
      xpSiege: "승리한 포위전",
      xpExpedition: "원정 완료",
      xpDungeon: "던전 정복",
      xpGraduation: "왕국 튜토리얼 졸업",
      xpVictoryNode: "승리: {name}"
    }
  },
  cn: {
    common: {
      decree: "法令",
      research: "科技研发",
      construction: "建造"
    },
    notifications: {
      xpDecree: "法令：{title}",
      xpResearch: "科技研发：{name}",
      xpRecruit: "新兵训练完成",
      xpSpeedup: "帝国加速",
      xpSpeedupWork: "加速竣工",
      xpSiege: "胜利突击",
      xpExpedition: "远征告捷",
      xpDungeon: "地下城征服",
      xpGraduation: "王国初成结业",
      xpVictoryNode: "战胜：{name}"
    }
  },
  br: {
    common: {
      decree: "Decreto",
      research: "Pesquisa",
      construction: "Construção"
    },
    notifications: {
      xpDecree: "Decreto: {title}",
      xpResearch: "Pesquisa: {name}",
      xpRecruit: "Recruta treinado",
      xpSpeedup: "Aceleração Imperial",
      xpSpeedupWork: "Obra Acelerada",
      xpSiege: "Cerco Vitorioso",
      xpExpedition: "Expedição concluída",
      xpDungeon: "Masmorra conquistada",
      xpGraduation: "Graduação do Reino",
      xpVictoryNode: "Vitória: {name}"
    }
  }
}

deepMerge(us, patches.us)
deepMerge(es, patches.es)
deepMerge(kr, patches.kr)
deepMerge(cn, patches.cn)
deepMerge(br, patches.br)

writeFileSync('./src/i18n/locales/us.js', `export const us = ${JSON.stringify(us, null, 2)}\n`, 'utf-8')
writeFileSync('./src/i18n/locales/es.js', `export const es = ${JSON.stringify(es, null, 2)}\n`, 'utf-8')
writeFileSync('./src/i18n/locales/kr.js', `export const kr = ${JSON.stringify(kr, null, 2)}\n`, 'utf-8')
writeFileSync('./src/i18n/locales/cn.js', `export const cn = ${JSON.stringify(cn, null, 2)}\n`, 'utf-8')
writeFileSync('./src/i18n/locales/br.js', `export const br = ${JSON.stringify(br, null, 2)}\n`, 'utf-8')

console.log('Successfully added common and notifications keys to all locales!')
