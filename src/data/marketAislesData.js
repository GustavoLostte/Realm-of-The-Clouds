// Market Aisles Data Configuration for Realm of The Clouds
// Defines the 4 interior corridors/wings of the Grand Celestial Market
// Consistent with the 10 dungeon maps and the celestial city architecture

export const MARKET_AISLES = [
  {
    id: 'alchemy',
    index: 1,
    name: 'Pasillo de Alquimia y Pociones',
    subtitle: 'Elixires, Redomas y Esencias Mágicas',
    description: 'Galería iluminada por redomas humeantes, alambiques de latón y cristales de éter que destilan elixires arcanos de regeneración y poder.',
    bg: '/assets/market/market_aisle_01_alchemy.webp',
    bgJpg: '/assets/market/market_aisle_01_alchemy.jpg',
    themeColor: '#a855f7',
    icon: 'FlaskConical',
    categories: ['potions', 'scrolls', 'herbs'],
  },
  {
    id: 'armory',
    index: 2,
    name: 'Pasillo de Armería y Forja Sagrada',
    subtitle: 'Acero Celestial, Arcos de Luz y Escudos',
    description: 'Gran galería de honor con estantes de espadas doradas, arcos bendecidos, armaduras de placas relucientes y estandartes solares del imperio.',
    bg: '/assets/market/market_aisle_02_armory.webp',
    bgJpg: '/assets/market/market_aisle_02_armory.jpg',
    themeColor: '#38bdf8',
    icon: 'Shield',
    categories: ['weapons', 'armor', 'shields'],
  },
  {
    id: 'gems',
    index: 3,
    name: 'Pasillo de Gemas y Reliquias Místicas',
    subtitle: 'Zafiros, Cristales de Éter y Cofres Reales',
    description: 'Santuario de orfebres y tasadores celestiales. Vitrinas de terciopelo repletas de gemas prismáticas, cofres con oro y balanzas sagradas de comercio.',
    bg: '/assets/market/market_aisle_03_gems.webp?v=1790001800',
    bgJpg: '/assets/market/market_aisle_03_gems.jpg?v=1790001800',
    themeColor: '#f59e0b',
    icon: 'Gem',
    categories: ['gems', 'relics', 'treasures'],
  },
  {
    id: 'provisions',
    index: 4,
    name: 'Pasillo de Cosecha y Provisiones',
    subtitle: 'Trigo Dorado, Especias Exóticas y Néctar',
    description: 'Cálido pasillo colmado de sacos con grano celestial, cestas de frutas radiantes, cuencos de especias aromáticas y ánforas de ambrosía divina.',
    bg: '/assets/market/market_aisle_04_provisions.webp',
    bgJpg: '/assets/market/market_aisle_04_provisions.jpg',
    themeColor: '#10b981',
    icon: 'Wheat',
    categories: ['food', 'spices', 'resources'],
  },
]

export function getMarketAisleById(id) {
  return MARKET_AISLES.find((a) => a.id === id) || MARKET_AISLES[0]
}
