// nobleNameGenerator.js
// Multilingual Procedural Noble Name Generator for Realm of the Clouds
// Generates immersive, culturally adapted sovereign names according to player language (es, us, br, kr, cn)

const NOBLE_NAME_DICTIONARIES = {
  es: {
    titles: [
      'Comandante', 'Gran Conquistador', 'Lord', 'Rey', 'Reina', 'Emperador', 'Emperatriz',
      'Duque', 'Duquesa', 'Gran Señor', 'Custodio', 'Mariscal',
      'Príncipe', 'Princesa', 'Archiduque', 'Heraldo'
    ],
    firstNames: [
      'Arturo', 'Valerius', 'Diana', 'Roland', 'Aurelio', 'Leonel', 'Guillermo',
      'Dante', 'Alonso', 'Ignacio', 'Rodrigo', 'Valeria', 'Aldor', 'Balthazar',
      'Siegfried', 'Elena', 'Fernando', 'Tiberio', 'Casio', 'Constanza'
    ],
    epithets: [
      'de las Nubes', 'de Aetheria', 'de Avalon', 'del Viento', 'el Valiente',
      'el Conquistador', 'el Sabio', 'de las Cumbres', 'de la Corona', 'de la Luz',
      'el Glorioso', 'el Invicto'
    ],
  },
  us: {
    titles: [
      'Commander', 'Conqueror', 'Lord', 'Lady', 'King', 'Queen', 'Emperor', 'Empress',
      'High King', 'High Queen', 'Warden', 'Marshal', 'Prince',
      'Princess', 'Archduke'
    ],
    firstNames: [
      'Arthur', 'Valerius', 'Diana', 'Roland', 'Aurelius', 'Lionel', 'William',
      'Dante', 'Sterling', 'Edward', 'Alexander', 'Valeria', 'Alden', 'Balthazar',
      'Rowan', 'Gwendolyn', 'Victor', 'Magnus', 'Leopold', 'Seraphina'
    ],
    epithets: [
      'of the Clouds', 'of Aetheria', 'of Avalon', 'of the Wind', 'the Brave',
      'the Conqueror', 'the Wise', 'of the Peaks', 'the Radiant', 'the Valiant',
      'the Undaunted', 'of the Skies'
    ],
  },
  br: {
    titles: [
      'Comandante', 'Conquistador', 'Lorde', 'Lady', 'Rei', 'Rainha', 'Imperador', 'Imperatriz',
      'Grão-Senhor', 'Guardião', 'Guardiã', 'Marechal',
      'Príncipe', 'Princesa'
    ],
    firstNames: [
      'Arthur', 'Valério', 'Diana', 'Rolando', 'Aurélio', 'Leonel', 'Guilherme',
      'Dante', 'Afonso', 'Rodrigo', 'Thiago', 'Valéria', 'Aldor', 'Baltazar',
      'Estevão', 'Helena', 'Vicente', 'Bernardo', 'Leopoldo', 'Constança'
    ],
    epithets: [
      'das Nuvens', 'de Aetheria', 'de Avalon', 'do Vento', 'o Bravo',
      'o Conquistador', 'o Sábio', 'das Alturas', 'o Destemido', 'da Luz',
      'o Glorioso', 'o Radiante'
    ],
  },
  kr: {
    titles: [
      '사령관', '대정복자', '대왕', '여왕', '황제', '대공', '성주', '패왕', '수호자', '영주'
    ],
    firstNames: [
      '아서', '발레리우스', '디아나', '롤란드', '아우렐리우스', '라이오넬', '단테',
      '에테르', '카엘', '바르샤', '알도르', '세라핌', '루시안', '에드워드', '헬레나'
    ],
    epithets: [
      '구름의', '에테리아의', '아발론의', '바람의', '용맹한', '지혜로운',
      '하늘의', '불패의', '빛의', '천공의', '고결한'
    ],
  },
  cn: {
    titles: [
      '指挥官', '大征服者', '国王', '女王', '大帝', '大公', '城主', '霸王', '守护者', '圣王'
    ],
    firstNames: [
      '亚瑟', '瓦列留斯', '戴安娜', '罗兰', '奥勒留', '莱昂内尔', '但丁',
      '艾瑟尔', '凯尔', '巴尔萨', '奥尔多', '塞拉菲姆', '卢西安', '爱德华'
    ],
    epithets: [
      '云境', '天穹', '阿瓦隆', '以太', '英勇', '睿智', '裂空', '神谕', '光辉', '不败'
    ],
  },
}

function getRandomItem(arr) {
  if (!arr || arr.length === 0) return ''
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Generates a culturally adapted fantasy noble name
 * @param {string} lang - 'es', 'us', 'br', 'kr', 'cn' (also accepts aliases like 'en', 'pt', 'ko', 'zh')
 * @param {string} avoidName - optional current name to prevent immediate repeat
 * @returns {string} noble name (guaranteed <= 24 characters)
 */
export function generateRandomNobleName(lang = 'es', avoidName = '') {
  let normLang = String(lang || 'es').toLowerCase()
  if (normLang === 'en') normLang = 'us'
  if (normLang === 'pt') normLang = 'br'
  if (normLang === 'ko') normLang = 'kr'
  if (normLang === 'zh') normLang = 'cn'

  const dict = NOBLE_NAME_DICTIONARIES[normLang] || NOBLE_NAME_DICTIONARIES.es

  for (let attempt = 0; attempt < 25; attempt++) {
    const pattern = Math.floor(Math.random() * 3)
    let candidate = ''

    if (normLang === 'kr') {
      if (pattern === 0) {
        candidate = `${getRandomItem(dict.titles)} ${getRandomItem(dict.firstNames)}`
      } else if (pattern === 1) {
        candidate = `${getRandomItem(dict.epithets)} ${getRandomItem(dict.titles)} ${getRandomItem(dict.firstNames)}`
      } else {
        candidate = `${getRandomItem(dict.epithets)} ${getRandomItem(dict.titles)}`
      }
    } else if (normLang === 'cn') {
      if (pattern === 0) {
        candidate = `${getRandomItem(dict.titles)} ${getRandomItem(dict.firstNames)}`
      } else if (pattern === 1) {
        candidate = `${getRandomItem(dict.epithets)}${getRandomItem(dict.titles)} ${getRandomItem(dict.firstNames)}`
      } else {
        candidate = `${getRandomItem(dict.epithets)}${getRandomItem(dict.titles)}`
      }
    } else {
      // Romance / Germanic languages (es, us, br)
      if (pattern === 0) {
        candidate = `${getRandomItem(dict.titles)} ${getRandomItem(dict.firstNames)}`
      } else if (pattern === 1) {
        candidate = `${getRandomItem(dict.titles)} ${getRandomItem(dict.firstNames)} ${getRandomItem(dict.epithets)}`
      } else {
        candidate = `${getRandomItem(dict.titles)} ${getRandomItem(dict.epithets)}`
      }
    }

    candidate = candidate.trim()
    // Guarantee name is <= 24 chars and distinct from previous
    if (candidate && candidate.length >= 2 && candidate.length <= 24 && candidate !== avoidName) {
      return candidate
    }
  }

  return normLang === 'us' ? 'King Arthur' : normLang === 'br' ? 'Rei Arthur' : normLang === 'kr' ? '군주 아서' : normLang === 'cn' ? '领主 亚瑟' : 'Rey Arturo'
}
