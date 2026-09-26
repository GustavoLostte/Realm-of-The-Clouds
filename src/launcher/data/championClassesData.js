import { Shield, Crosshair, Flame, Sparkles } from 'lucide-react'

/**
 * Realm of Kingdoms — 4 Classic Classes Specification
 * Pure data module for character creation and base progression
 */
export const CLASSES_DATA = [
  {
    id: 'knight',
    name: 'Caballero',
    className: 'Caballero',
    englishName: 'Knight',
    folder: 'KINA',
    role: 'Tanque / Melé Pesado',
    weapon: 'Espada y Escudo',
    description: 'Guerrero indomable de primera línea con máxima armadura y bloqueo.',
    color: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.45)',
    icon: Shield,
    stats: {
      attack: 75,
      defense: 100,
      speed: 60,
      magic: 30,
    },
    base: { hp: 320, mp: 80, atk: 18, def: 24, speed: 165 },
  },
  {
    id: 'paladin',
    name: 'Paladín',
    className: 'Paladín',
    englishName: 'Paladin',
    folder: 'PALADIN',
    role: 'Tirador a Distancia',
    weapon: 'Arco y Flechas',
    description: 'Arquero veloz de daño sostenido que derriba enemigos a máxima distancia.',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.45)',
    icon: Crosshair,
    stats: {
      attack: 85,
      defense: 65,
      speed: 100,
      magic: 55,
    },
    base: { hp: 230, mp: 160, atk: 24, def: 14, speed: 190 },
  },
  {
    id: 'mage',
    name: 'Mago',
    className: 'Mago',
    englishName: 'Mage',
    folder: 'MAGE',
    role: 'DPS Mágico en Área',
    weapon: 'Bastón Elemental',
    description: 'Maestro arcano capaz de desintegrar hordas de monstruos con fuego y relámpago.',
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.45)',
    icon: Flame,
    stats: {
      attack: 100,
      defense: 30,
      speed: 70,
      magic: 100,
    },
    base: { hp: 170, mp: 280, atk: 32, def: 8, speed: 170 },
  },
  {
    id: 'healer',
    name: 'Sanador',
    className: 'Sanador',
    englishName: 'Healer',
    folder: 'HEALER',
    role: 'Soporte y Restauración',
    weapon: 'Cetro Sagrado',
    description: 'Sacerdote protector que purifica estados, restaura vida y bendice con escudos.',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.45)',
    icon: Sparkles,
    stats: {
      attack: 50,
      defense: 55,
      speed: 80,
      magic: 95,
    },
    base: { hp: 210, mp: 260, atk: 16, def: 12, speed: 180 },
  },
]

export const DEFAULT_CLASS = CLASSES_DATA[0]
