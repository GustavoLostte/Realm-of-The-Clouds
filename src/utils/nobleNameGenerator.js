// nobleNameGenerator.js
// Multilingual Procedural Noble Name Generator for Realm of the Clouds
// Generates immersive, culturally adapted sovereign names according to player language (es, us, br, kr, cn)

// nobleNameGenerator.js
// Multilingual Procedural Hero Name Generator for Realm of the Clouds
// Generates immersive, culturally adapted warrior & champion names according to player language and gender

const HERO_NAME_DICTIONARIES = {
  es: {
    titlesMale: ['Sir', 'Caballero', 'Lord', 'Guardián', 'Paladín', 'Comandante', 'Campeón'],
    titlesFemale: ['Lady', 'Caballera', 'Guardiana', 'Paladina', 'Comandante', 'Campeona'],
    firstNamesMale: [
      'Arturo', 'Valerius', 'Roland', 'Aurelio', 'Leonel', 'Dante',
      'Rodrigo', 'Aldor', 'Balthazar', 'Siegfried', 'Kael', 'Lucian', 'Thorin'
    ],
    firstNamesFemale: [
      'Astrid', 'Diana', 'Valeria', 'Elena', 'Constanza', 'Seraphina',
      'Freya', 'Lyra', 'Morgana', 'Aurelia', 'Silvia', 'Isolde'
    ],
  },
  us: {
    titlesMale: ['Sir', 'Knight', 'Lord', 'Warden', 'Paladin', 'Commander', 'Champion'],
    titlesFemale: ['Lady', 'Warden', 'Paladin', 'Commander', 'Champion', 'Sentinel'],
    firstNamesMale: [
      'Arthur', 'Valerius', 'Roland', 'Aurelius', 'Lionel', 'Dante',
      'Rowan', 'Victor', 'Magnus', 'Leopold', 'Kael', 'Lucian', 'Thorin'
    ],
    firstNamesFemale: [
      'Astrid', 'Diana', 'Valeria', 'Elena', 'Constance', 'Seraphina',
      'Freya', 'Lyra', 'Gwendolyn', 'Aurelia', 'Silvia', 'Isolde'
    ],
  },
  br: {
    titlesMale: ['Sir', 'Cavaleiro', 'Lorde', 'Guardião', 'Paladino', 'Comandante', 'Campeão'],
    titlesFemale: ['Lady', 'Guardiana', 'Paladina', 'Comandante', 'Campeã', 'Sentinela'],
    firstNamesMale: [
      'Arthur', 'Valério', 'Rolando', 'Aurélio', 'Leonel', 'Dante',
      'Rodrigo', 'Aldor', 'Baltazar', 'Kael', 'Lucian', 'Bernardo'
    ],
    firstNamesFemale: [
      'Astrid', 'Diana', 'Valéria', 'Helena', 'Constança', 'Serafina',
      'Freya', 'Lyra', 'Morgana', 'Aurélia', 'Silvia', 'Isolda'
    ],
  },
  kr: {
    titlesMale: ['기사', '사령관', '수호자', '팔라딘', '용사', '영웅'],
    titlesFemale: ['사령관', '수호자', '팔라딘', '용사', '영웅', '성기사'],
    firstNamesMale: ['아서', '발레리우스', '롤란드', '아우렐리우스', '라이오넬', '단테', '카엘', '루시안'],
    firstNamesFemale: ['아스트리드', '디아나', '발레리아', '엘레나', '세라핌', '프레이야', '리라'],
  },
  cn: {
    titlesMale: ['骑士', '指挥官', '守护者', '圣骑士', '勇者', '英雄'],
    titlesFemale: ['指挥官', '守护者', '圣骑士', '勇者', '英雄', '女武神'],
    firstNamesMale: ['亚瑟', '瓦列留斯', '罗兰', '奥勒留', '但丁', '凯尔', '卢西安'],
    firstNamesFemale: ['阿斯特丽德', '戴安娜', '瓦莱丽亚', '艾琳娜', '芙蕾雅', '莱拉'],
  },
}

function getRandomItem(arr) {
  if (!arr || arr.length === 0) return ''
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Generates a culturally adapted fantasy champion name (max 16 characters)
 * @param {string} lang - 'es', 'us', 'br', 'kr', 'cn'
 * @param {string} avoidName - optional current name to prevent repeat
 * @param {string} gender - 'male' | 'female'
 * @returns {string} champion name (guaranteed <= 16 characters)
 */
export function generateRandomNobleName(lang = 'es', avoidName = '', gender = 'male') {
  let normLang = String(lang || 'es').toLowerCase()
  if (normLang === 'en') normLang = 'us'
  if (normLang === 'pt') normLang = 'br'
  if (normLang === 'ko') normLang = 'kr'
  if (normLang === 'zh') normLang = 'cn'

  const dict = HERO_NAME_DICTIONARIES[normLang] || HERO_NAME_DICTIONARIES.es
  const isFemale = String(gender).toLowerCase() === 'female'
  const titles = isFemale ? dict.titlesFemale : dict.titlesMale
  const firstNames = isFemale ? dict.firstNamesFemale : dict.firstNamesMale

  for (let attempt = 0; attempt < 30; attempt++) {
    // 50% chance: Just first name; 50% chance: Title + First name
    const withTitle = Math.random() > 0.45
    let candidate = ''

    if (withTitle) {
      candidate = `${getRandomItem(titles)} ${getRandomItem(firstNames)}`
    } else {
      candidate = getRandomItem(firstNames)
    }

    candidate = candidate.trim()
    if (candidate && candidate.length >= 3 && candidate.length <= 16 && candidate !== avoidName) {
      return candidate
    }
  }

  return isFemale ? 'Astrid' : 'Sir Arturo'
}

