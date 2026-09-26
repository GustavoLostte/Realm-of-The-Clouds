// patch_dungeon_aux_translations.mjs
import fs from 'fs'
import path from 'path'

const localesDir = path.resolve('src/i18n/locales')

const additions = {
  us: {
    bastionChampion: "Bastion Champion",
    vsDuel: "DUEL",
    oneButton: "1 BUTTON",
    campaign: "Campaign",
    panLeft: "Pan map left",
    panRight: "Pan map right (View more dungeons)",
    usePotionTitle: "Use Health Potion (+60 HP)",
    useBombTitle: "Throw Dwarf Bomb (-50 Damage)",
    reviveTooltip: "Revive right now with full HP and fury ready!",
    defaultNodeDesc: "Confront this dangerous adversary to clear the path through the biome."
  },
  es: {
    bastionChampion: "Campeón del Bastión",
    vsDuel: "DUELO",
    oneButton: "1 BOTÓN",
    campaign: "Campaña",
    panLeft: "Desplazar mapa a la izquierda",
    panRight: "Desplazar mapa a la derecha (Ver más mazmorras)",
    usePotionTitle: "Usar Poción de Vida (+60 HP)",
    useBombTitle: "Arrojar Bomba Enana (-50 Daño)",
    reviveTooltip: "¡Revivir ahora mismo con vida completa y furia lista!",
    defaultNodeDesc: "Enfréntate a este peligroso adversario para despejar el camino del bioma."
  },
  br: {
    bastionChampion: "Campeão do Bastião",
    vsDuel: "DUELO",
    oneButton: "1 BOTÃO",
    campaign: "Campanha",
    panLeft: "Rolar mapa para a esquerda",
    panRight: "Rolar mapa para a direita (Ver mais masmorras)",
    usePotionTitle: "Usar Poção de Vida (+60 PV)",
    useBombTitle: "Lançar Bomba Anã (-50 Dano)",
    reviveTooltip: "Reviva agora mesmo com vida cheia e fúria pronta!",
    defaultNodeDesc: "Enfrente este adversário perigoso para abrir caminho pelo bioma."
  },
  kr: {
    bastionChampion: "요새의 챔피언",
    vsDuel: "결투",
    oneButton: "원버튼",
    campaign: "원정 캠페인",
    panLeft: "지도를 왼쪽으로 이동",
    panRight: "지도를 오른쪽으로 이동 (더 많은 던전 보기)",
    usePotionTitle: "생명력 물약 사용 (+60 HP)",
    useBombTitle: "드워프 폭탄 투척 (-50 피해)",
    reviveTooltip: "체력을 완전히 회복하고 분노를 채워 즉시 부활하세요!",
    defaultNodeDesc: "이 위험한 적과 맞서 싸워 바이옴의 길을 확보하세요."
  },
  cn: {
    bastionChampion: "堡垒冠军",
    vsDuel: "决斗",
    oneButton: "单键操作",
    campaign: "战役",
    panLeft: "向左平移地图",
    panRight: "向右平移地图 (探索更多地牢)",
    usePotionTitle: "使用生命药水 (+60 生命值)",
    useBombTitle: "投掷矮人炸弹 (-50 伤害)",
    reviveTooltip: "立刻以满生命值和充能狂暴状态复活！",
    defaultNodeDesc: "迎战这个凶险的敌人，为清理生态群系开辟道路。"
  }
}

for (const [lang, keys] of Object.entries(additions)) {
  const filePath = path.join(localesDir, `${lang}.js`)
  let content = fs.readFileSync(filePath, 'utf8')

  // Find "dungeon": { and inject keys inside it
  const match = content.match(/"dungeon":\s*\{/)
  if (!match) {
    console.error(`Could not find "dungeon": { in ${lang}.js`)
    continue
  }

  const linesToInsert = Object.entries(keys)
    .filter(([k]) => !content.includes(`"${k}":`))
    .map(([k, v]) => `    "${k}": ${JSON.stringify(v)},`)
    .join('\n')

  if (linesToInsert.length > 0) {
    const insertPos = match.index + match[0].length
    content = content.slice(0, insertPos) + '\n' + linesToInsert + content.slice(insertPos)
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`Updated ${lang}.js with auxiliary dungeon keys`)
  } else {
    console.log(`${lang}.js already has auxiliary keys`)
  }
}
