// Champions Data System for Character Selection & PvP Combat
// Exactly 2 official playable champions with ultra-optimized idle animations:
// Rey Kael (Soberano Celestial) & Lord Malakor (Señor del Caos)

export const CHAMPIONS_LIST = [
  {
    id: 'kael',
    name: 'Rey Kael',
    title: 'Soberano Celestial',
    role: 'Paladín Sagrado',
    element: 'Luz Celestial',
    avatar: '/assets/champions/kael_avatar.webp',
    fullImage: '/assets/champions/kael_idle.webp',
    poster: '/assets/champions/kael_poster.webp',
    idleAnim: '/assets/champions/kael_idle.webp',
    scale: 1.0,
    hp: 1500,
    atk: 92,
    def: 86,
    speed: 80,
    skillName: 'Juicio del Soberano',
    skillDesc: 'Desata el poder de la espada solar con ondas de choque de luz sagrada que pulverizan las defensas.',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #93c5fd 100%)',
    statsSummary: { fuerza: '★★★★☆', vida: '★★★★★', agilidad: '★★★★☆' },
    quote: 'Por el honor y la gloria del reino de las nubes.',
    unlocked: true,
  },
  {
    id: 'malakor',
    name: 'Lord Malakor',
    title: 'Señor del Caos',
    role: 'Conquistador Oscuro',
    element: 'Fuego Infernal',
    avatar: '/assets/champions/malakor_avatar.webp',
    fullImage: '/assets/champions/malakor_idle.webp',
    poster: '/assets/champions/malakor_poster.webp',
    idleAnim: '/assets/champions/malakor_idle.webp',
    scale: 1.0,
    hp: 1550,
    atk: 95,
    def: 84,
    speed: 78,
    skillName: 'Ira Devastadora',
    skillDesc: 'Canaliza llamas oscuras que calcinan la armadura enemiga provocando daño devastador por quemadura.',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #b91c1c 0%, #ef4444 50%, #fca5a5 100%)',
    statsSummary: { fuerza: '★★★★★', vida: '★★★★☆', agilidad: '★★★★☆' },
    quote: '¡Arrodíllate ante el poder supremo del fuego oscuro!',
    unlocked: true,
  },
]

export function getChampionById(id) {
  return CHAMPIONS_LIST.find((c) => c.id === id) || CHAMPIONS_LIST[0]
}

export function getOpponentChampion(championId) {
  return championId === 'kael' ? CHAMPIONS_LIST[1] : CHAMPIONS_LIST[0]
}

export function getRandomRivalChampion(excludeId = '') {
  return getOpponentChampion(excludeId)
}
