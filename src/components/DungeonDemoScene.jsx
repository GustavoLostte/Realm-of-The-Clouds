import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { flushSync } from 'react-dom'
import { 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Swords, 
  Sparkles, 
  Shield, 
  Info,
  HelpCircle
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import { DUNGEON_TRANSLATIONS, getDungeonText } from '../i18n/dungeonDemoTranslations'
import { ChampionActor, ChampionProfileCard } from './ChampionActor'
import { SeamlessSprite, preloadAndDecodeSprite } from './SeamlessSprite'
import { DungeonEnemiesLayer } from './DungeonEnemiesLayer'
import { MmorpgHudOverlay } from './MmorpgHudOverlay'
import { DungeonBackpackModal } from './DungeonBackpackModal'
import { generateUniqueId } from '../utils/uniqueId'
import './DungeonDemoScene.css'

export const DEMO_MAPS = [
  // ==========================================
  // MAPA 1: Senda de Esporas (3 Pasillos)
  // ==========================================
  {
    id: 'MAP1_H1',
    mapIndex: 1,
    hallIndex: 1,
    name: 'Senda de Esporas',
    hall: 'Pasillo 1/3',
    icon: '🌲',
    basePoster: '/DEMO/MAPS/MAP1/1/map_base.webp',
    audioOgg: '/DEMO/MAPS/MAP1/1/sound_effect.ogg',
    groundOffset: '31.48%',
    description: 'Entrada a la espesura del bosque de esporas.',
  },
  {
    id: 'MAP1_H2',
    mapIndex: 1,
    hallIndex: 2,
    name: 'Senda de Esporas',
    hall: 'Pasillo 2/3',
    icon: '🌲',
    basePoster: '/DEMO/MAPS/MAP1/2/map_base.webp',
    audioOgg: '/DEMO/MAPS/MAP1/2/sound_effect.ogg',
    groundOffset: '31.48%',
    description: 'Puente suspendido entre las copas luminosas.',
  },
  {
    id: 'MAP1_H3',
    mapIndex: 1,
    hallIndex: 3,
    name: 'Senda de Esporas',
    hall: 'Pasillo 3/3 (Jefe)',
    icon: '🌲',
    basePoster: '/DEMO/MAPS/MAP1/3/map_base.webp',
    audioOgg: '/DEMO/MAPS/MAP1/3/sound_effect.ogg',
    groundOffset: '31.48%',
    description: 'Cámara del Guardián Espora Ancestral.',
  },

  // ==========================================
  // MAPA 2: Hongo Gigante (3 Pasillos)
  // ==========================================
  {
    id: 'MAP2_H1',
    mapIndex: 2,
    hallIndex: 1,
    name: 'Hongo Gigante',
    hall: 'Pasillo 1/3',
    icon: '🍄',
    basePoster: '/DEMO/MAPS/MAP2/1/map_base.webp',
    audioOgg: '/DEMO/MAPS/MAP2/2/sound_effect.ogg',
    groundOffset: '31.48%',
    description: 'Sendero de hongos bioluminiscentes flotantes.',
  },
  {
    id: 'MAP2_H2',
    mapIndex: 2,
    hallIndex: 2,
    name: 'Hongo Gigante',
    hall: 'Pasillo 2/3',
    icon: '🍄',
    basePoster: '/DEMO/MAPS/MAP2/2/map_base.webp',
    audioOgg: '/DEMO/MAPS/MAP2/2/sound_effect.ogg',
    groundOffset: '31.48%',
    description: 'Sendero de hongos bioluminiscentes flotantes.',
  },
  {
    id: 'MAP2_H3',
    mapIndex: 2,
    hallIndex: 3,
    name: 'Hongo Gigante',
    hall: 'Pasillo 3/3 (Jefe)',
    icon: '🍄',
    basePoster: '/DEMO/MAPS/MAP2/3/map_base.webp',
    audioOgg: '/DEMO/MAPS/MAP2/3/sound_effect.ogg',
    groundOffset: '31.48%',
    description: 'Cúspide de las esporas ancestrales.',
  },

  // ==========================================
  // MAPA 3: Caverna Mística (3 Pasillos)
  // ==========================================
  {
    id: 'MAP3_H1',
    mapIndex: 3,
    hallIndex: 1,
    name: 'Caverna Mística',
    hall: 'Pasillo 1/3',
    icon: '🌿',
    basePoster: '/DEMO/MAPS/MAP3/1/map_base.webp',
    audioOgg: '/DEMO/MAPS/MAP3/1/sound_effect.ogg',
    groundOffset: '31.48%',
    description: 'Descenso a las grutas de cristal sombrío.',
  },
  {
    id: 'MAP3_H2',
    mapIndex: 3,
    hallIndex: 2,
    name: 'Caverna Mística',
    hall: 'Pasillo 2/3',
    icon: '🌿',
    basePoster: '/DEMO/MAPS/MAP3/2/map_base.webp',
    audioOgg: '/DEMO/MAPS/MAP3/2/sound_effect.ogg',
    groundOffset: '31.48%',
    description: 'Puente del abismo de resonancia estelar.',
  },
  {
    id: 'MAP3_H3',
    mapIndex: 3,
    hallIndex: 3,
    name: 'Caverna Mística',
    hall: 'Pasillo 3/3 (La Fundadora)',
    icon: '👑',
    basePoster: '/DEMO/MAPS/MAP3/3/map_base.webp',
    audioOgg: '/DEMO/MAPS/MAP3/3/sound_effect.ogg',
    groundOffset: '31.48%',
    description: 'Santuario de La Fundadora Celestial del Reino de las Nubes.',
  },
]

// ==========================================
// PROGRESSIVE DUNGEON QUESTS
// ==========================================
export const DUNGEON_QUESTS = [
  {
    id: 'quest_1',
    title: 'Purga del Bosque',
    desc: 'Derrota 4 Slimes en la Senda de Esporas',
    mapHint: 'Mapa 1 (Pasillos 1-3)',
    icon: '🧪',
    targetType: 'slime',
    targetCount: 4,
    expReward: 180,
    goldReward: 150,
  },
  {
    id: 'quest_2',
    title: 'Alas en la Penumbra',
    desc: 'Caza 4 Murciélagos en el Hongo Gigante',
    mapHint: 'Mapa 2 (Pasillos 1-3)',
    icon: '🦇',
    targetType: 'bat',
    targetCount: 4,
    expReward: 260,
    goldReward: 220,
  },
  {
    id: 'quest_3',
    title: 'Juicio de los Huesos',
    desc: 'Exorciza 4 Esqueletos en la Caverna Mística',
    mapHint: 'Mapa 3 (Pasillos 1-2)',
    icon: '💀',
    targetType: 'skeleton',
    targetCount: 4,
    expReward: 380,
    goldReward: 320,
  },
  {
    id: 'quest_4',
    title: 'Audiencia Celestial',
    desc: 'Habla y recibe la bendición de La Fundadora',
    mapHint: 'Mapa 3 Pasillo 3 (Santuario)',
    icon: '👑',
    targetType: 'fundadora',
    targetCount: 1,
    expReward: 500,
    goldReward: 500,
  },
]



export function DungeonDemoScene({ onBack }) {
  const { currentLang, t } = useTranslation()
  const lang = currentLang || 'us'
  const langRef = useRef(lang)
  useEffect(() => { langRef.current = lang }, [lang])

  // Localized Map Definitions based on user's active language
  const localizedMaps = useMemo(() => {
    const mapTexts = DUNGEON_TRANSLATIONS[lang]?.maps || DUNGEON_TRANSLATIONS.us.maps
    return DEMO_MAPS.map((m) => {
      let name = m.name
      let hall = m.hall
      let description = m.description
      if (m.id === 'MAP1_H1') {
        name = mapTexts.map1_name
        hall = mapTexts.map1_hall1
        description = mapTexts.map1_hall1_desc
      } else if (m.id === 'MAP1_H2') {
        name = mapTexts.map1_name
        hall = mapTexts.map1_hall2
        description = mapTexts.map1_hall2_desc
      } else if (m.id === 'MAP1_H3') {
        name = mapTexts.map1_name
        hall = mapTexts.map1_hall3
        description = mapTexts.map1_hall3_desc
      } else if (m.id === 'MAP2_H1') {
        name = mapTexts.map2_name
        hall = mapTexts.map2_hall1
        description = mapTexts.map2_hall1_desc
      } else if (m.id === 'MAP2_H2') {
        name = mapTexts.map2_name
        hall = mapTexts.map2_hall2
        description = mapTexts.map2_hall2_desc
      } else if (m.id === 'MAP2_H3') {
        name = mapTexts.map2_name
        hall = mapTexts.map2_hall3
        description = mapTexts.map2_hall3_desc
      } else if (m.id === 'MAP3_H1') {
        name = mapTexts.map3_name
        hall = mapTexts.map3_hall1
        description = mapTexts.map3_hall1_desc
      } else if (m.id === 'MAP3_H2') {
        name = mapTexts.map3_name
        hall = mapTexts.map3_hall2
        description = mapTexts.map3_hall2_desc
      } else if (m.id === 'MAP3_H3') {
        name = mapTexts.map3_name
        hall = mapTexts.map3_hall3
        description = mapTexts.map3_hall3_desc
      }
      return {
        ...m,
        name,
        hall,
        description,
      }
    })
  }, [lang])
  const localizedMapsRef = useRef(localizedMaps)
  useEffect(() => {
    localizedMapsRef.current = localizedMaps
  }, [localizedMaps])

  // Localized Progressive Quests
  const langQuests = useMemo(() => {
    const list = DUNGEON_TRANSLATIONS[lang]?.quests || DUNGEON_TRANSLATIONS.us.quests
    return [
      {
        id: 'quest_1',
        title: list[0]?.title || 'Forest Purge',
        desc: list[0]?.desc || 'Defeat 4 Slimes in the Spore Trail',
        mapHint: list[0]?.mapHint || 'Map 1 (Halls 1-3)',
        icon: '🧪',
        targetType: 'slime',
        targetCount: 4,
        expReward: 180,
        goldReward: 150,
      },
      {
        id: 'quest_2',
        title: list[1]?.title || 'Wings in the Twilight',
        desc: list[1]?.desc || 'Hunt 4 Bats in the Giant Mushroom',
        mapHint: list[1]?.mapHint || 'Map 2 (Halls 1-3)',
        icon: '🦇',
        targetType: 'bat',
        targetCount: 4,
        expReward: 260,
        goldReward: 220,
      },
      {
        id: 'quest_3',
        title: list[2]?.title || 'Trial of Bones',
        desc: list[2]?.desc || 'Exorcise 4 Skeletons in the Mystic Cavern',
        mapHint: list[2]?.mapHint || 'Map 3 (Halls 1-2)',
        icon: '💀',
        targetType: 'skeleton',
        targetCount: 4,
        expReward: 380,
        goldReward: 320,
      },
      {
        id: 'quest_4',
        title: list[3]?.title || 'Celestial Audience',
        desc: list[3]?.desc || 'Speak and receive the blessing of The Founder',
        mapHint: list[3]?.mapHint || 'Map 3 Hall 3 (Sanctuary)',
        icon: '👑',
        targetType: 'fundadora',
        targetCount: 1,
        expReward: 500,
        goldReward: 500,
      },
    ]
  }, [lang])
  const langQuestsRef = useRef(langQuests)
  useEffect(() => {
    langQuestsRef.current = langQuests
  }, [langQuests])

  const [selectedMapIndex, setSelectedMapIndex] = useState(0)
  const selectedMapIndexRef = useRef(0)
  const isTransitioningRef = useRef(false)
  const [transitionToast, setTransitionToast] = useState(null)
  const toastTimeoutRef = useRef(null)

  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const isAudioMutedRef = useRef(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControlsHint, setShowControlsHint] = useState(true)

  // Combat Visual FX & Impact Feedback (Zero-rerender Direct DOM Refs)
  const cameraViewportRef = useRef(null)
  const hitVignetteRef = useRef(null)
  const [playerFloatingTexts, setPlayerFloatingTexts] = useState([])
  const screenShakeEndRef = useRef(0)
  const screenShakeDurationRef = useRef(200)
  const screenShakeMagnitudeRef = useRef(3)
  const playerHitFlashTimerRef = useRef(null)
  const lastAttackNonceRef = useRef(null)
  const activeAttackTimersRef = useRef([])

  useEffect(() => {
    isAudioMutedRef.current = isAudioMuted
  }, [isAudioMuted])

  // Fundadora Celestial NPC State (Exclusiva de Mapa 3 Pasillo 3/3)
  const [showFundadoraDialog, setShowFundadoraDialog] = useState(false)
  const [fundadoraDialogStep, setFundadoraDialogStep] = useState('intro') // 'intro' | 'blessing' | 'lore'
  const [hasReceivedBlessing, setHasReceivedBlessing] = useState(false)
  const [blessingAuraActive, setBlessingAuraActive] = useState(false)
  const [isNearFundadora, setIsNearFundadora] = useState(false)

  // Slime enemies state & Mobile detection
  const [isMobileLandscape, setIsMobileLandscape] = useState(
    typeof window !== 'undefined' && window.innerHeight <= 540
  )

  useEffect(() => {
    selectedMapIndexRef.current = selectedMapIndex
  }, [selectedMapIndex])

  useEffect(() => {
    const handleResize = () => {
      setIsMobileLandscape(window.innerHeight <= 540)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Economy, Potion Inventory, Materials & Physical Ground Loot System
  const [dungeonGold, setDungeonGold] = useState(1250)
  const [hpPotions, setHpPotions] = useState(8)
  const [mpPotions, setMpPotions] = useState(5)
  const [isBackpackOpen, setIsBackpackOpen] = useState(false)
  const [backpackMaterials, setBackpackMaterials] = useState(() => [
    {
      id: 'slime_jelly',
      name: getDungeonText(lang, 'items', 'slimeJelly'),
      icon: '/assets/loot/slime_jelly.webp',
      amount: 4,
      desc: getDungeonText(lang, 'items', 'slimeJellyDesc'),
    },
  ])
  const [recentLoot, setRecentLoot] = useState([])
  const [groundLoot, setGroundLoot] = useState([])

  const logRecentLoot = useCallback((type, text, icon, amount) => {
    setRecentLoot((prev) => [
      { id: generateUniqueId('loot_log'), type, text, icon, amount, timestamp: Date.now() },
      ...prev.slice(0, 6),
    ])
  }, [])

  const groundLootRef = useRef([])
  useEffect(() => {
    groundLootRef.current = groundLoot
  }, [groundLoot])

  // Champion current live state from ChampionActor (Initialized with Level 10 stats for Demo Mode)
  const [champState, setChampState] = useState(() => ({
    name: 'Player',
    level: 10,
    badge: '👑',
    avatar: '/CHAMPIONS/KINA_MALE/avatar.webp',
    hp: 850,
    maxHp: 850,
    hpPercent: 100,
    fury: 100,
  }))
  const champActorRef = useRef(null)
  const champPosRef = useRef(18)
  const champFacingRef = useRef(1)
  const champStateRef = useRef(null)
  const lastAttackHitRef = useRef(0)
  const potionCooldownRef = useRef({ hp: 0, mp: 0 })

  // Use Health Potion (Quick slot or 'H' / 'Z' key)
  const handleUseHpPotion = useCallback(() => {
    if (Date.now() < potionCooldownRef.current.hp) return
    if (hpPotions <= 0) {
      champActorRef.current?.showBanner?.(getDungeonText(lang, 'combat', 'noPotionsHp'), 'normal')
      soundManager?.playClick?.()
      return
    }
    const champ = champActorRef?.current
    if (!champ) return
    if (champ.hp >= champ.maxHp) {
      champ.showBanner?.(getDungeonText(lang, 'combat', 'fullHpBanner'), 'normal')
      soundManager?.playClick?.()
      return
    }
    potionCooldownRef.current.hp = Date.now() + 2000
    setHpPotions((prev) => Math.max(0, prev - 1))
    const healAmount = Math.round(champ.maxHp * 0.35)
    champ.heal(healAmount)
    champ.showBanner(getDungeonText(lang, 'combat', 'potionHpUsed').replace('{amount}', healAmount), 'heal')
    soundManager?.playCollect?.('gems')
  }, [hpPotions])

  // Use Mana Potion (Quick slot or 'M' / 'C' key)
  const handleUseMpPotion = useCallback(() => {
    if (Date.now() < potionCooldownRef.current.mp) return
    if (mpPotions <= 0) {
      champActorRef.current?.showBanner?.(getDungeonText(lang, 'combat', 'noPotionsMp'), 'normal')
      soundManager?.playClick?.()
      return
    }
    const champ = champActorRef?.current
    if (!champ) return
    potionCooldownRef.current.mp = Date.now() + 2000
    setMpPotions((prev) => Math.max(0, prev - 1))
    champ.fury = Math.min(100, (champ.fury || 0) + 40)
    champ.showBanner(getDungeonText(lang, 'combat', 'potionMpUsed'), 'special')
    champ._emitChange?.()
    soundManager?.playCollect?.('gems')
  }, [mpPotions])

  // Player Progression System (Demo Mode Starts at Level 10)
  const [progression, setProgression] = useState({
    level: 10,
    exp: 0,
    expNeeded: 140,
  })
  const [currentQuestIndex, setCurrentQuestIndex] = useState(0)
  const [questProgress, setQuestProgress] = useState(0)
  const [levelUpEffect, setLevelUpEffect] = useState(null)

  // Dynamic Virtual Camera Zoom & Player-Tracking System (Default 1.0x across all devices for exact parity)
  const [cameraZoom, setCameraZoom] = useState(1.0)
  const cameraZoomRef = useRef(1.0)
  const cameraWorldRef = useRef(null)
  const cameraCenterRef = useRef(50)

  // Keep cameraZoomRef synced
  useEffect(() => {
    cameraZoomRef.current = cameraZoom
  }, [cameraZoom])

  // Cycle Zoom Preset: 1.0x -> 1.25x -> 1.45x -> 1.70x
  const toggleCameraZoom = useCallback(() => {
    soundManager.playClick?.()
    setCameraZoom((prev) => {
      let next
      if (prev < 1.1) next = 1.25
      else if (prev < 1.35) next = 1.45
      else if (prev < 1.6) next = 1.70
      else next = 1.0
      cameraZoomRef.current = next
      return next
    })
  }, [])

  const changeCorridorRef = useRef(null)
  const triggerLootCollectRef = useRef(null)

  // 60/120 FPS High-Performance Camera Follow & Physical Event Loop
  // Updates GPU transform directly via Ref with zero React re-render overhead
  useEffect(() => {
    let animId
    const loop = () => {
      if (cameraWorldRef.current) {
        const playerX = champActorRef.current?.posX ?? champPosRef.current ?? 18
        const z = cameraZoomRef.current
        const now = performance.now()

        let shakeX = 0
        let shakeY = 0
        if (now < screenShakeEndRef.current) {
          const remainingRatio = Math.max(0, (screenShakeEndRef.current - now) / screenShakeDurationRef.current)
          const currMag = screenShakeMagnitudeRef.current * remainingRatio
          shakeX = Math.round((Math.random() - 0.5) * 2 * currMag)
          shakeY = Math.round((Math.random() - 0.5) * 2 * currMag)
        }

        if (z <= 1.001) {
          if (shakeX !== 0 || shakeY !== 0) {
            cameraWorldRef.current.style.transform = `translate3d(${shakeX}px, ${shakeY}px, 0)`
          } else if (cameraCenterRef.current !== 50 || cameraWorldRef.current.style.transform !== '') {
            cameraCenterRef.current = 50
            cameraWorldRef.current.style.transform = ''
          }
        } else {
          const halfWindow = 50 / z
          const minCenter = halfWindow
          const maxCenter = 100 - halfWindow
          const targetCenter = Math.max(minCenter, Math.min(maxCenter, playerX))

          // Smooth lerp: 0.08 per frame for buttery organic camera movement
          cameraCenterRef.current += (targetCenter - cameraCenterRef.current) * 0.08

          const txPercent = 50 - z * cameraCenterRef.current
          if (shakeX !== 0 || shakeY !== 0) {
            cameraWorldRef.current.style.transform = `translate3d(calc(${txPercent}% + ${shakeX}px), ${shakeY}px, 0) scale(${z})`
          } else {
            cameraWorldRef.current.style.transform = `translate3d(${txPercent}%, 0, 0) scale(${z})`
          }
        }

        // Continuous Boundary Walking Transition Check (Runs at 60/90/120 FPS without React state churn)
        if (!isTransitioningRef.current && changeCorridorRef.current) {
          const currentIdx = selectedMapIndexRef.current
          const facing = champActorRef.current?.facing ?? champFacingRef.current ?? 1
          const moveDir = champActorRef.current?.moveDirection ?? 0
          const rightThreshold = isWaveClearedRef.current ? 90 : 92

          if (playerX >= rightThreshold && facing === 1 && moveDir > 0) {
            if (currentIdx < DEMO_MAPS.length - 1) {
              changeCorridorRef.current(currentIdx + 1, 'left')
            } else {
              changeCorridorRef.current(0, 'left')
            }
          } else if (playerX <= 8 && facing === -1 && moveDir < 0 && currentIdx > 0) {
            changeCorridorRef.current(currentIdx - 1, 'right')
          }
        }

        // Continuous Physical Ground Loot Auto-Pickup (Proximity check at native refresh rate)
        if (groundLootRef.current && groundLootRef.current.length > 0 && triggerLootCollectRef.current) {
          const pickupRadius = 4.2
          groundLootRef.current.forEach((loot) => {
            if (!loot.collected && Math.abs(loot.x - playerX) <= pickupRadius) {
              triggerLootCollectRef.current(loot.id)
            }
          })
        }
      }
      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [])

  // High-performance isolated corridor enemies layer ref (ZERO root re-renders during combat/movement)
  const enemiesLayerRef = useRef(null)

  // Wave Clear & Directional Guidance Indicator state
  const [isWaveCleared, setIsWaveCleared] = useState(false)
  const isWaveClearedRef = useRef(false)
  useEffect(() => {
    isWaveClearedRef.current = isWaveCleared
  }, [isWaveCleared])

  // Sound effects helper for combat, impact, and death (Pool-backed for instant zero-stutter trigger)
  const playEnemySound = useCallback((soundSrc, volume = 0.75) => {
    if (isAudioMutedRef.current || !soundSrc) return
    try {
      if (soundManager?.sfxPool?.play) {
        soundManager.sfxPool.play(soundSrc, volume)
      } else {
        const sfx = new Audio(soundSrc)
        sfx.volume = Math.max(0, Math.min(1, volume))
        sfx.play().catch(() => {})
      }
    } catch {}
  }, [])

  // Positional sound with realistic MMORPG proximity falloff relative to Kina
  const playEnemyPositionalSound = useCallback((soundSrc, enemyX, baseVolume = 0.55) => {
    if (isAudioMutedRef.current || !soundSrc) return
    const px = champActorRef.current?.posX ?? champPosRef.current ?? 18
    const dist = Math.abs(enemyX - px)
    if (dist > 45) return
    const distFactor = Math.max(0.2, 1 - (dist / 45))
    const vol = Number((baseVolume * distFactor).toFixed(2))
    playEnemySound(soundSrc, vol)
  }, [playEnemySound])

  // Combat screen shake (Integrated directly into camera rAF loop - ZERO CSS thrashing / ZERO video layer invalidation)
  const triggerScreenShake = useCallback((duration = 180, magnitude = 3) => {
    screenShakeEndRef.current = performance.now() + duration
    screenShakeDurationRef.current = Math.max(1, duration)
    screenShakeMagnitudeRef.current = magnitude
  }, [])

  // Player hit screen flash (Direct DOM class toggle - ZERO React re-renders)
  const triggerPlayerHitFlash = useCallback(() => {
    if (hitVignetteRef.current) {
      hitVignetteRef.current.classList.add('active')
      if (playerHitFlashTimerRef.current) clearTimeout(playerHitFlashTimerRef.current)
      playerHitFlashTimerRef.current = setTimeout(() => {
        hitVignetteRef.current?.classList.remove('active')
      }, 320)
    }
  }, [])

  // Preload all enemy WebP animations and knight attack animations into GPU memory
  useEffect(() => {
    const imagesToPreload = [
      '/DEMO/ENEMIES/SLIME/idle.webp',
      '/DEMO/ENEMIES/SLIME/walk.webp',
      '/DEMO/ENEMIES/SLIME/attack.webp',
      '/DEMO/ENEMIES/SLIME/impact.webp',
      '/DEMO/ENEMIES/SLIME/dead.webp',
      '/DEMO/ENEMIES/BAT/idle.webp',
      '/DEMO/ENEMIES/BAT/walk.webp',
      '/DEMO/ENEMIES/BAT/attack.webp',
      '/DEMO/ENEMIES/BAT/impact.webp',
      '/DEMO/ENEMIES/BAT/dead.webp',
      '/DEMO/ENEMIES/SKELETONS/idle.webp',
      '/DEMO/ENEMIES/SKELETONS/walk.webp',
      '/DEMO/ENEMIES/SKELETONS/attack.webp',
      '/DEMO/ENEMIES/SKELETONS/impact.webp',
      '/DEMO/ENEMIES/SKELETONS/dead.webp',
      // Preload all Knight combat and movement animations
      '/CHAMPIONS/KINA_MALE/idle.webp',
      '/CHAMPIONS/KINA_MALE/walk.webp',
      '/CHAMPIONS/KINA_MALE/run.webp',
      '/CHAMPIONS/KINA_MALE/dash_front.webp',
      '/CHAMPIONS/KINA_MALE/dash_back.webp',
      '/CHAMPIONS/KINA_MALE/jump.webp',
      '/CHAMPIONS/KINA_MALE/attack1_1.webp',
      '/CHAMPIONS/KINA_MALE/attack1_2.webp',
      '/CHAMPIONS/KINA_MALE/attack1_3.webp',
      '/CHAMPIONS/KINA_MALE/attack2_1.webp',
      '/CHAMPIONS/KINA_MALE/attack2.webp',
      '/CHAMPIONS/KINA_MALE/special.webp',
      '/CHAMPIONS/KINA_MALE/special2.webp',
      '/CHAMPIONS/KINA_MALE/defend.webp',
      // Preload all 9 corridor base textures for instant 0ms switching
      '/DEMO/MAPS/MAP1/1/map_base.webp',
      '/DEMO/MAPS/MAP1/2/map_base.webp',
      '/DEMO/MAPS/MAP1/3/map_base.webp',
      '/DEMO/MAPS/MAP2/1/map_base.webp',
      '/DEMO/MAPS/MAP2/2/map_base.webp',
      '/DEMO/MAPS/MAP2/3/map_base.webp',
      '/DEMO/MAPS/MAP3/1/map_base.webp',
      '/DEMO/MAPS/MAP3/2/map_base.webp',
      '/DEMO/MAPS/MAP3/3/map_base.webp',
    ]
    imagesToPreload.forEach((src) => {
      preloadAndDecodeSprite(src)
    })
  }, [])

  // Floating text popup above player (Locked to player coordinate at moment of impact)
  const addPlayerFloatingText = useCallback((text, type = 'damage') => {
    const fId = generateUniqueId('pfloat')
    const playerX = champActorRef.current?.posX ?? champPosRef.current ?? champStateRef.current?.posX ?? 18
    setPlayerFloatingTexts((prev) => [...prev, { id: fId, text, type, x: playerX }])
    setTimeout(() => {
      setPlayerFloatingTexts((prev) => prev.filter((item) => item.id !== fId))
    }, 900)
  }, [])

  // Spectacular Celestial Level Up trigger
  const triggerLevelUp = useCallback((newLevel) => {
    soundManager.playLevelUp?.()

    const playerX = champActorRef.current?.posX ?? champPosRef.current ?? 18
    setLevelUpEffect({
      id: Date.now(),
      level: newLevel,
      x: playerX,
    })

    // Update Champion model instance (HP increase, full heal, full fury)
    if (typeof champActorRef.current?.setLevel === 'function') {
      champActorRef.current.setLevel(newLevel, 80)
    } else if (champActorRef.current?.champion?.setLevel) {
      champActorRef.current.champion.setLevel(newLevel, 80)
    }

    // Trigger concise overhead badge on Kina (clean, non-cluttered)
    champActorRef.current?.showBanner?.(
      getDungeonText(lang, 'levelUp', 'badge', { level: newLevel }),
      'special'
    )

    addPlayerFloatingText(getDungeonText(lang, 'levelUp', 'badge', { level: newLevel }), 'levelup')

    // Reset visual effect after comfortable reading duration (2.2 seconds)
    setTimeout(() => {
      setLevelUpEffect(null)
    }, 2200)
  }, [addPlayerFloatingText, lang])

  const awardPlayerExp = useCallback((amount) => {
    if (!amount || amount <= 0) return

    addPlayerFloatingText(getDungeonText(lang, 'combat', 'expGain', { exp: amount }), 'exp')

    setProgression((prev) => {
      let exp = prev.exp + amount
      let lvl = prev.level
      let needed = prev.expNeeded
      let didLevelUp = false

      while (exp >= needed) {
        exp -= needed
        lvl += 1
        needed = Math.round(needed * 1.35 + 25)
        didLevelUp = true
      }

      if (didLevelUp) {
        const targetLvl = lvl
        setTimeout(() => triggerLevelUp(targetLvl), 120)
      }

      return {
        level: lvl,
        exp,
        expNeeded: needed,
      }
    })
  }, [addPlayerFloatingText, triggerLevelUp])

  // Active Quest State derived from localized langQuests
  const activeQuestConfig = langQuests[currentQuestIndex] || null
  const isQuestDone = activeQuestConfig ? questProgress >= activeQuestConfig.targetCount : false

  const activeQuest = activeQuestConfig ? {
    id: activeQuestConfig.id,
    title: activeQuestConfig.title,
    desc: activeQuestConfig.desc,
    mapHint: activeQuestConfig.mapHint,
    icon: activeQuestConfig.icon,
    progress: Math.min(questProgress, activeQuestConfig.targetCount),
    targetCount: activeQuestConfig.targetCount,
    completed: isQuestDone,
    expReward: activeQuestConfig.expReward,
    goldReward: activeQuestConfig.goldReward,
  } : null

  const activeQuestConfigRef = useRef(activeQuestConfig)
  const isQuestDoneRef = useRef(isQuestDone)
  const currentQuestIndexRef = useRef(currentQuestIndex)
  useEffect(() => {
    activeQuestConfigRef.current = activeQuestConfig
    isQuestDoneRef.current = isQuestDone
    currentQuestIndexRef.current = currentQuestIndex
  }, [activeQuestConfig, isQuestDone, currentQuestIndex])



  // High-performance callback when an enemy lands an attack on Kina
  const handleEnemyPlayerHit = useCallback((hit) => {
    if (hit.type === 'divine_shield') {
      addPlayerFloatingText(getDungeonText(langRef.current, 'combat', 'divineShield'), 'block')
      soundManager?.playClick?.()
      triggerScreenShake(80)
    } else if (hit.type === 'block') {
      if (champActorRef.current) {
        if (typeof champActorRef.current.takeDamage === 'function') {
          champActorRef.current.takeDamage(hit.dmg)
        } else if (champActorRef.current.champion?.takeDamage) {
          champActorRef.current.champion.takeDamage(hit.dmg)
        }
      }
      addPlayerFloatingText(getDungeonText(langRef.current, 'combat', 'blocked').replace('{dmg}', hit.dmg), 'block')
      soundManager?.playClick?.()
    } else if (hit.type === 'hit') {
      if (champActorRef.current) {
        if (typeof champActorRef.current.takeDamage === 'function') {
          champActorRef.current.takeDamage(hit.dmg)
        } else if (champActorRef.current.champion?.takeDamage) {
          champActorRef.current.champion.takeDamage(hit.dmg)
        }
      }
      playEnemySound(hit.sound, 0.90)
      triggerPlayerHitFlash()
      triggerScreenShake(240)
      addPlayerFloatingText(getDungeonText(langRef.current, 'combat', 'hit').replace('{dmg}', hit.dmg), 'damage')
    }
  }, [addPlayerFloatingText, playEnemySound, triggerPlayerHitFlash, triggerScreenShake])

  // High-performance callback when an enemy is defeated
  const handleEnemyKilled = useCallback(({ enemy, exp, gold, lootDrops }) => {
    awardPlayerExp(exp)
    const expText = getDungeonText(langRef.current, 'combat', 'expGain', { exp })
    const goldText = getDungeonText(langRef.current, 'combat', 'lootGold', { amount: gold })
    const fId1 = generateUniqueId('pexp')
    const fId2 = generateUniqueId('pgold')
    const playerX = champActorRef.current?.posX ?? champPosRef.current ?? champStateRef.current?.posX ?? 18
    setPlayerFloatingTexts((prev) => [
      ...prev,
      { id: fId1, text: expText, type: 'exp', x: playerX },
      { id: fId2, text: goldText, type: 'gold', x: playerX },
    ])
    setTimeout(() => {
      setPlayerFloatingTexts((prev) => prev.filter((item) => item.id !== fId1 && item.id !== fId2))
    }, 900)

    soundManager?.playCollect?.('coins')

    // Advance quest progress
    setQuestProgress((prev) => prev + 1)

    // Spawn physical ground loot
    if (lootDrops && lootDrops.length > 0) {
      const formattedDrops = lootDrops.map((drop, i) => {
        let name = getDungeonText(langRef.current, 'items', 'goldCoins')
        let icon = '/assets/items/gold_coin_v4.webp'
        let desc = ''
        if (drop.type === 'potion_hp') {
          name = getDungeonText(langRef.current, 'items', 'potionHp')
          icon = '/assets/items/potion_hp_v4.webp'
        } else if (drop.type === 'potion_mp') {
          name = getDungeonText(langRef.current, 'items', 'potionMp')
          icon = '/assets/items/potion_mp_v4.webp'
        } else if (drop.type === 'material') {
          name = getDungeonText(langRef.current, 'items', 'slimeJelly')
          icon = '/assets/loot/slime_jelly.webp'
          desc = getDungeonText(langRef.current, 'items', 'slimeJellyDesc')
          if (drop.materialType === 'skeleton') {
            name = getDungeonText(langRef.current, 'items', 'ancestralBone')
            icon = '/assets/loot/skeleton_bone.webp'
            desc = getDungeonText(langRef.current, 'items', 'ancestralBoneDesc')
          } else if (drop.materialType === 'bat') {
            name = getDungeonText(langRef.current, 'items', 'batWing')
            icon = '/assets/loot/bat_wing.webp'
            desc = getDungeonText(langRef.current, 'items', 'batWingDesc')
          }
        }
        return {
          id: `${drop.type}_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
          type: drop.type,
          name,
          amount: drop.amount,
          icon,
          desc,
          x: drop.x,
          scale: 1,
          collected: false,
          createdAt: Date.now(),
        }
      })

      setTimeout(() => {
        setGroundLoot((prev) => [...prev, ...formattedDrops])
      }, 160)
    }
  }, [awardPlayerExp, addPlayerFloatingText])

  // High-performance callback when corridor wave is completely cleared
  const handleWaveCleared = useCallback(() => {
    if (isWaveClearedRef.current) return
    setIsWaveCleared(true)
    isWaveClearedRef.current = true

    soundManager?.playLevelUp?.()
    champActorRef.current?.showBanner?.(
      getDungeonText(langRef.current, 'combat', 'waveClearedBanner'),
      'special'
    )

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setTransitionToast({
      title: getDungeonText(langRef.current, 'combat', 'waveClearedTitle'),
      sub: getDungeonText(langRef.current, 'combat', 'nextHallPrompt'),
    })
    toastTimeoutRef.current = setTimeout(() => {
      setTransitionToast(null)
    }, 3500)
  }, [])



  const audioRef = useRef(null)
  const ambientAudioRef = useRef(null)
  const impactSoundRef = useRef(null)
  const currentMap = localizedMaps[selectedMapIndex] || localizedMaps[0]

  // Lightweight poster preload for smooth zero-stutter corridor handoff
  useEffect(() => {
    const nextIdx = (selectedMapIndex + 1) % DEMO_MAPS.length
    const prevIdx = (selectedMapIndex - 1 + DEMO_MAPS.length) % DEMO_MAPS.length
    ;[nextIdx, prevIdx].forEach((idx) => {
      const m = DEMO_MAPS[idx]
      if (m?.basePoster) {
        const img = new Image()
        img.src = m.basePoster
      }
    })
  }, [selectedMapIndex])

  // Method to transition corridor / map with player repositioning and sound
  const changeCorridor = useCallback((nextIdx, spawnSide = 'left') => {
    if (nextIdx < 0 || nextIdx >= DEMO_MAPS.length) return
    const prevIdx = selectedMapIndexRef.current
    const prevMap = localizedMapsRef.current?.[prevIdx] || DEMO_MAPS[prevIdx]
    const nextMap = localizedMapsRef.current?.[nextIdx] || DEMO_MAPS[nextIdx]
    const isNewMap = nextMap.mapIndex !== prevMap.mapIndex

    isTransitioningRef.current = true
    setSelectedMapIndex(nextIdx)
    selectedMapIndexRef.current = nextIdx

    // Clear loot from prior corridor
    setGroundLoot([])
    setIsWaveCleared(false)

    // Position player cleanly at corridor entrance
    const spawnX = spawnSide === 'left' ? 9 : 89
    const spawnFacing = spawnSide === 'left' ? 1 : -1
    champPosRef.current = spawnX
    champFacingRef.current = spawnFacing
    champActorRef.current?.setPosition(spawnX, spawnFacing)

    // Respawn isolated corridor enemies layer for the new corridor
    enemiesLayerRef.current?.resetCorridor(nextIdx)

    // Switch corridor ambient sound loop
    if (ambientAudioRef.current) {
      try {
        ambientAudioRef.current.src = nextMap.audioOgg
        ambientAudioRef.current.currentTime = 0
        ambientAudioRef.current.play().catch(() => {})
      } catch {}
    }

    soundManager?.playClick?.()

    // Display walking transition banner
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setTransitionToast({
      isNewMap,
      title: isNewMap 
        ? `✨ MAP ${nextMap.mapIndex}: ${nextMap.name.toUpperCase()}!`
        : `⚔️ ${nextMap.name} — ${nextMap.hall}`,
      sub: nextMap.description,
    })

    toastTimeoutRef.current = setTimeout(() => {
      setTransitionToast(null)
    }, 2400)

    // Unlock transition after cooldown
    setTimeout(() => {
      isTransitioningRef.current = false
    }, 850)
  }, [lang])

  useEffect(() => {
    changeCorridorRef.current = changeCorridor
  }, [changeCorridor])

  // Advance to next corridor (triggered by walking right or clicking guidance arrow)
  const handleAdvanceToNextCorridor = useCallback(() => {
    if (isTransitioningRef.current) return
    const currentIdx = selectedMapIndexRef.current
    const nextIdx = currentIdx < DEMO_MAPS.length - 1 ? currentIdx + 1 : 0
    changeCorridor(nextIdx, 'left')
  }, [changeCorridor])

  // Play background seamless music and corridor ambient audio with Mobile Autoplay Unlock
  useEffect(() => {
    let bgm = null
    let ambient = null
    let unlockAudio = null
    try {
      soundManager.pauseBGM?.()
      const musicSrc = '/DEMO/MUSIC/The_Mushroom_Waltz.ogg'
      const impactSrc = '/DEMO/ENEMIES/SLIME/sounds/impact.ogg'

      // Adopt pre-warmed audio instance from user tap on StartScreen if available
      if (typeof window !== 'undefined' && window.__dungeonBgm) {
        bgm = window.__dungeonBgm
        bgm.volume = 0.65
        bgm.loop = true
        window.__dungeonBgm = null
      } else {
        bgm = new Audio(musicSrc)
        bgm.loop = true
        bgm.volume = 0.65
      }
      bgm.muted = isAudioMutedRef.current
      audioRef.current = bgm

      const initialMap = DEMO_MAPS[selectedMapIndexRef.current] || DEMO_MAPS[0]
      ambient = new Audio(initialMap.audioOgg)
      ambient.loop = true
      ambient.volume = 0.28
      ambient.muted = isAudioMutedRef.current
      ambientAudioRef.current = ambient

      const sfx = new Audio(impactSrc)
      sfx.volume = 0.7
      impactSoundRef.current = sfx

      // Try playing immediately
      if (bgm.paused) {
        bgm.play().catch(() => {})
      }
      if (ambient.paused) {
        ambient.play().catch(() => {})
      }

      // Blocked by mobile browser autoplay policy - unlock automatically on touch/tap/key anywhere
      unlockAudio = () => {
        if (audioRef.current && audioRef.current.paused) {
          audioRef.current.play().catch(() => {})
        }
        if (ambientAudioRef.current && ambientAudioRef.current.paused) {
          ambientAudioRef.current.play().catch(() => {})
        }
        if (audioRef.current && !audioRef.current.paused && ambientAudioRef.current && !ambientAudioRef.current.paused) {
          window.removeEventListener('touchstart', unlockAudio)
          window.removeEventListener('pointerdown', unlockAudio)
          window.removeEventListener('click', unlockAudio)
          window.removeEventListener('keydown', unlockAudio)
        }
      }
      window.addEventListener('touchstart', unlockAudio, { passive: true })
      window.addEventListener('pointerdown', unlockAudio, { passive: true })
      window.addEventListener('click', unlockAudio, { passive: true })
      window.addEventListener('keydown', unlockAudio, { passive: true })
    } catch {}

    return () => {
      if (unlockAudio) {
        window.removeEventListener('touchstart', unlockAudio)
        window.removeEventListener('pointerdown', unlockAudio)
        window.removeEventListener('click', unlockAudio)
        window.removeEventListener('keydown', unlockAudio)
      }
      if (audioRef.current) {
        try {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        } catch {}
      }
      if (ambientAudioRef.current) {
        try {
          ambientAudioRef.current.pause()
          ambientAudioRef.current.currentTime = 0
        } catch {}
      }
      if (activeAttackTimersRef.current) {
        activeAttackTimersRef.current.forEach((t) => clearTimeout(t))
        activeAttackTimersRef.current = []
      }
    }
  }, [])

  // Keyboard shortcut: E to talk to Fundadora, H for HP Potion, M for MP Potion, Escape to close dialog or return to Start Screen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'e' || e.key === 'E') {
        if (selectedMapIndexRef.current === 8) {
          soundManager?.playClick?.()
          setShowFundadoraDialog((prev) => !prev)
        }
      }
      if (e.key === 'h' || e.key === 'H' || e.code === 'KeyZ' || e.key === 'z' || e.key === 'Z') {
        handleUseHpPotion()
      }
      if (e.key === 'm' || e.key === 'M' || e.code === 'KeyC' || e.key === 'c' || e.key === 'C') {
        handleUseMpPotion()
      }
      if ((e.key === 'b' || e.key === 'B' || e.key === 'i' || e.key === 'I') && !['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) {
        soundManager?.playClick?.()
        setIsBackpackOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        if (isBackpackOpen) {
          e.preventDefault()
          e.stopImmediatePropagation?.()
          setIsBackpackOpen(false)
          soundManager?.playClick?.()
          return
        }
        if (showFundadoraDialog) {
          e.preventDefault()
          e.stopImmediatePropagation?.()
          setShowFundadoraDialog(false)
          return
        }
        soundManager?.playClick?.()
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack, showFundadoraDialog, isBackpackOpen, handleUseHpPotion, handleUseMpPotion])

  // Sound toggle
  const toggleSound = () => {
    soundManager.playClick?.()
    setIsAudioMuted((prev) => {
      const next = !prev
      if (audioRef.current) audioRef.current.muted = next
      if (ambientAudioRef.current) ambientAudioRef.current.muted = next
      return next
    })
  }

  // Fullscreen toggle
  const toggleFullscreen = () => {
    soundManager.playClick?.()
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Preload all enemy types textures into browser cache for 0ms combat switches
  useEffect(() => {
    const enemySprites = [
      '/DEMO/ENEMIES/SLIME/idle.webp',
      '/DEMO/ENEMIES/SLIME/walk.webp',
      '/DEMO/ENEMIES/SLIME/attack.webp',
      '/DEMO/ENEMIES/SLIME/impact.webp',
      '/DEMO/ENEMIES/SLIME/dead.webp',
      '/DEMO/ENEMIES/BAT/idle.webp',
      '/DEMO/ENEMIES/BAT/walk.webp',
      '/DEMO/ENEMIES/BAT/attack.webp',
      '/DEMO/ENEMIES/BAT/impact.webp',
      '/DEMO/ENEMIES/BAT/dead.webp',
      '/DEMO/ENEMIES/SKELETONS/idle.webp',
      '/DEMO/ENEMIES/SKELETONS/walk.webp',
      '/DEMO/ENEMIES/SKELETONS/attack.webp',
      '/DEMO/ENEMIES/SKELETONS/impact.webp',
      '/DEMO/ENEMIES/SKELETONS/dead.webp',
      '/assets/npcs/FUNDADORA/idle.webp',
      '/assets/npcs/FUNDADORA/poster.webp',
      '/assets/npcs/FUNDADORA/avatar.webp',
      '/assets/items/potion_hp_v4.webp',
      '/assets/items/gold_coin_v4.webp',
      '/assets/items/potion_mp_v4.webp',
    ]
    enemySprites.forEach((url) => {
      const img = new Image()
      img.src = url
    })

    // Preload all 15 thematic enemy audio sound effects (idle, walk, attack, impact, dead)
    const enemySounds = [
      '/DEMO/ENEMIES/SLIME/sounds/idle.ogg',
      '/DEMO/ENEMIES/SLIME/sounds/walk.ogg',
      '/DEMO/ENEMIES/SLIME/sounds/attack.ogg',
      '/DEMO/ENEMIES/SLIME/sounds/impact.ogg',
      '/DEMO/ENEMIES/SLIME/sounds/dead.ogg',
      '/DEMO/ENEMIES/BAT/sounds/idle.ogg',
      '/DEMO/ENEMIES/BAT/sounds/walk.ogg',
      '/DEMO/ENEMIES/BAT/sounds/attack.ogg',
      '/DEMO/ENEMIES/BAT/sounds/impact.ogg',
      '/DEMO/ENEMIES/BAT/sounds/dead.ogg',
      '/DEMO/ENEMIES/SKELETONS/sounds/idle.ogg',
      '/DEMO/ENEMIES/SKELETONS/sounds/walk.ogg',
      '/DEMO/ENEMIES/SKELETONS/sounds/attack.ogg',
      '/DEMO/ENEMIES/SKELETONS/sounds/impact.ogg',
      '/DEMO/ENEMIES/SKELETONS/sounds/dead.ogg',
    ]
    enemySounds.forEach((url) => {
      try {
        const audio = new Audio()
        audio.preload = 'auto'
        audio.src = url
      } catch {}
    })
  }, [])

  // Physical Ground Loot Collection Handler (Proximity or Click)
  const triggerLootCollect = useCallback((lootId) => {
    const item = groundLootRef.current?.find((l) => l.id === lootId)
    if (!item || item.collected) return

    // Mark as collected to activate fly-up vanish animation
    setGroundLoot((prev) =>
      prev.map((l) => (l.id === lootId ? { ...l, collected: true } : l))
    )

    // Play crisp audio feedback
    if (item.type === 'gold') {
      soundManager?.playCollect?.('gold')
    } else {
      soundManager?.playCollect?.('gems')
    }

    const floatingId = generateUniqueId('loot_float')

    if (item.type === 'gold') {
      setDungeonGold((prev) => prev + item.amount)
      setPlayerFloatingTexts((prev) => [
        ...prev,
        { id: floatingId, text: getDungeonText(lang, 'combat', 'lootGold').replace('{amount}', item.amount), type: 'loot-gold' },
      ])
      logRecentLoot('gold', `+${item.amount} ${getDungeonText(lang, 'items', 'goldCoins')}`, item.icon || '/assets/items/gold_coin_v4.webp', item.amount)
    } else if (item.type === 'potion_health') {
      setHpPotions((prev) => prev + item.amount)
      setPlayerFloatingTexts((prev) => [
        ...prev,
        { id: floatingId, text: getDungeonText(lang, 'combat', 'lootPotionHp').replace('{amount}', item.amount), type: 'loot-potion' },
      ])
      logRecentLoot('potion_health', getDungeonText(lang, 'combat', 'lootPotionHp').replace('{amount}', item.amount), item.icon || '/assets/items/potion_hp_v4.webp', item.amount)
    } else if (item.type === 'potion_mana') {
      setMpPotions((prev) => prev + item.amount)
      setPlayerFloatingTexts((prev) => [
        ...prev,
        { id: floatingId, text: getDungeonText(lang, 'combat', 'lootPotionMp').replace('{amount}', item.amount), type: 'loot-mana' },
      ])
      logRecentLoot('potion_mana', getDungeonText(lang, 'combat', 'lootPotionMp').replace('{amount}', item.amount), item.icon || '/assets/items/potion_mp_v4.webp', item.amount)
    } else if (item.type === 'material') {
      setBackpackMaterials((prev) => {
        const existing = prev.find((m) => m.id === item.matId)
        if (existing) {
          return prev.map((m) => (m.id === item.matId ? { ...m, amount: m.amount + item.amount } : m))
        }
        return [
          ...prev,
          {
            id: item.matId,
            name: item.name,
            icon: item.icon,
            amount: item.amount,
            desc: item.desc,
          },
        ]
      })
      setPlayerFloatingTexts((prev) => [
        ...prev,
        { id: floatingId, text: `✨ +${item.amount} ${item.name}`, type: 'loot-material' },
      ])
      logRecentLoot('material', `+${item.amount} ${item.name}`, item.icon, item.amount)
    }

    // Clean up player floating text after 1200ms
    setTimeout(() => {
      setPlayerFloatingTexts((prev) => prev.filter((t) => t.id !== floatingId))
    }, 1200)

    // Remove from groundLoot after animation finishes (380ms)
    setTimeout(() => {
      setGroundLoot((prev) => prev.filter((l) => l.id !== lootId))
    }, 380)
  }, [])

  useEffect(() => {
    triggerLootCollectRef.current = triggerLootCollect
  }, [triggerLootCollect])



  // Delegated Enemy Hit Handler: Handled natively inside isolated DungeonEnemiesLayer
  const triggerEnemyHit = useCallback((enemyId, attackType = 'normal', customDmg = null) => {
    enemiesLayerRef.current?.triggerEnemyHit(enemyId, attackType, customDmg)
  }, [])

  // Backward compatibility alias
  const triggerSlimeHit = triggerEnemyHit

  // Physical horizontal body collision: Living enemies block player ground movement!
  // Players must either defeat the enemy or jump over it to pass.
  const checkPlayerMovementCollision = useCallback((candidateX, currentX, champ) => {
    // 1. High airborne clearance: If player is jumping, they vault OVER enemies cleanly!
    const isAirborne = Boolean(
      champ?.isJumping && 
      ((champ?.posY ?? 0) >= 10 || (champ?.airElevation ?? 0) >= 12)
    )
    if (isAirborne) {
      return candidateX
    }

    const livingEnemies = enemiesLayerRef.current?.getLivingEnemies() || []
    if (livingEnemies.length === 0) {
      return candidateX
    }

    let resolvedX = candidateX

    // 2. Moving right: blocked by left boundary of living enemy
    if (candidateX > currentX) {
      for (const enemy of livingEnemies) {
        const hw = (enemy.type === 'slime' ? 2.8 : enemy.type === 'bat' ? 2.2 : 3.0) * (enemy.scale || 1.0)
        const enemyLeftEdge = enemy.x - hw
        // If player was to the left of the enemy and tries to advance past the enemy's left edge
        if (currentX <= enemyLeftEdge + 0.15 && candidateX > enemyLeftEdge) {
          resolvedX = Math.min(resolvedX, enemyLeftEdge)
        }
      }
    } 
    // 3. Moving left: blocked by right boundary of living enemy
    else if (candidateX < currentX) {
      for (const enemy of livingEnemies) {
        const hw = (enemy.type === 'slime' ? 2.8 : enemy.type === 'bat' ? 2.2 : 3.0) * (enemy.scale || 1.0)
        const enemyRightEdge = enemy.x + hw
        // If player was to the right of the enemy and tries to retreat past the enemy's right edge
        if (currentX >= enemyRightEdge - 0.15 && candidateX < enemyRightEdge) {
          resolvedX = Math.max(resolvedX, enemyRightEdge)
        }
      }
    }

    // Zero Teleportation: Never nudge or teleport the player across enemies.
    // If the player overlaps (e.g. an enemy walked into the player or split spawn),
    // they can move freely in either direction to disengage or jump over.
    return resolvedX
  }, [])

  const lastChampStateRenderTimeRef = useRef(0)

  // Detect attacks from ChampionActor hitting slimes & walking corridor transitions
  const handleChampionStateChange = useCallback((state) => {
    if (!state) return

    // Essential state updates (HP, MP, fury, level, cooldowns, avatar) without root churn during attacks
    const prev = champStateRef.current
    const areCooldownsEqual = (c1, c2) => {
      if (c1 === c2) return true
      if (!c1 || !c2) return false
      return (
        c1.seismic === c2.seismic &&
        c1.shield === c2.shield &&
        c1.superSkill === c2.superSkill &&
        c1.dashFront === c2.dashFront &&
        c1.dashBack === c2.dashBack
      )
    }

    const isImportantChange = 
      !prev ||
      state.hp !== prev.hp || 
      state.fury !== prev.fury ||
      state.maxHp !== prev.maxHp ||
      state.level !== prev.level ||
      state.avatar !== prev.avatar ||
      !areCooldownsEqual(state.cooldowns, prev?.cooldowns)
    if (isImportantChange) {
      setChampState(state)
    }

    champStateRef.current = state
    if (typeof state.posX === 'number') {
      champPosRef.current = state.posX
    } else if (typeof state.x === 'number') {
      champPosRef.current = state.x
    }
    if (typeof state.facing === 'number') {
      champFacingRef.current = state.facing
    }

    // Fundadora proximity detection on Map 3 Corridor 3/3 (Functional state update prevents useless renders)
    const px = state.posX ?? state.x ?? champPosRef.current ?? 18
    if (selectedMapIndexRef.current === 8) {
      const near = px >= 68
      setIsNearFundadora((prev) => (prev !== near ? near : prev))
    } else {
      setIsNearFundadora((prev) => (prev ? false : prev))
    }

    // 1. Edge-of-corridor walking transition
    if (!isTransitioningRef.current) {
      const currentIdx = selectedMapIndexRef.current
      const px = state.posX ?? state.x ?? 18
      const facing = state.facing ?? 1
      const isMoving = state.isMoving || state.anim === 'walk' || state.anim === 'run'
      const moveDir = state.moveDirection ?? (isMoving ? facing : 0)

      // Caminando hacia la derecha y alcanza el borde derecho (px >= 90 si despejado, o >= 92)
      const rightThreshold = isWaveClearedRef.current ? 90 : 92
      if (px >= rightThreshold && facing === 1 && moveDir > 0) {
        if (currentIdx < DEMO_MAPS.length - 1) {
          changeCorridor(currentIdx + 1, 'left')
          return
        } else {
          // Ha recorrido los 9 pasillos (los 3 mapas completos): cicla al mapa 1 pasillo 1
          changeCorridor(0, 'left')
          return
        }
      }

      // Caminando hacia la izquierda y alcanza el borde izquierdo (px <= 8)
      if (px <= 8 && facing === -1 && moveDir < 0 && currentIdx > 0) {
        changeCorridor(currentIdx - 1, 'right')
        return
      }
    }

    // 2. Enemy combat hit detection con colisión física de textura y sincronización al swing
    // (El escudo 'special' es puramente defensivo y no genera ataques a enemigos)
    const isAttacking = state.anim && (
      state.anim.startsWith('attack') ||
      state.anim === 'special2' ||
      state.anim === 'dash_attack' ||
      state.anim === 'jump_attack'
    )

    if (isAttacking) {
      const nonce = state.animNonce || `${state.anim}_${Date.now()}`
      if (nonce !== lastAttackNonceRef.current) {
        lastAttackNonceRef.current = nonce

        const currentAnim = state.anim

        // Alcance físico del filo de la espada desde el centro de Kina (excluyendo fondo transparente del frame 512x288)
        const ATTACK_PHYSICAL_REACH = {
          attack1_1: 8.33,  // Corte rápido: punta del filo alcanza +8.33%
          attack1_2: 7.59,  // Corte cruzado: punta del filo alcanza +7.59%
          attack1_3: 9.88,  // Estocada sagrada con aura: alcanza +9.88%
          attack2_1: 8.20,  // Patada / golpe: impacto físico a +8.20%
          attack2_2: 9.20,  // Golpe sísmico: onda expansiva a +9.20%
          dash_attack: 8.80,// Dash tajo veloz: +8.80%
          jump_attack: 8.50,// Corte aéreo descendente: +8.50%
          special2: 11.50,  // Explosión celestial 360° omnidireccional: radio 11.50%
        }

        // Retardo exacto al ápice del swing de la espada (frame de impacto en ms, no frame 0)
        const ATTACK_IMPACT_DELAYS = {
          attack1_1: 110,   // El filo barre el frente a los 110ms
          attack1_2: 140,   // El filo cruzado barre a los 140ms
          attack1_3: 200,   // La estocada clava a los 200ms
          attack2_1: 150,   // Impacto a los 150ms
          attack2_2: 180,   // Onda sísmica a los 180ms
          dash_attack: 120, // Tajo dash a los 120ms
          jump_attack: 140, // Corte aéreo a los 140ms
          special2: 180,    // Explosión celestial a los 180ms
        }

        const delay = ATTACK_IMPACT_DELAYS[currentAnim] || 120
        const timerId = setTimeout(() => {
          // Remover timer de la lista de activos
          activeAttackTimersRef.current = activeAttackTimersRef.current.filter((t) => t !== timerId)

          const isAoe = currentAnim === 'special2'
          const swordReach = ATTACK_PHYSICAL_REACH[currentAnim] || 8.0
          const currentPx = champActorRef.current?.posX ?? champPosRef.current ?? state.posX ?? 18
          const currentFacing = champActorRef.current?.facing ?? champFacingRef.current ?? state.facing ?? 1

          // Call isolated high-performance enemies layer (zero root re-renders)
          enemiesLayerRef.current?.hitEnemiesInRange(currentPx, currentFacing, swordReach, isAoe, currentAnim)
        }, delay)

        activeAttackTimersRef.current.push(timerId)
      }
    }

    // 3. Physical Ground Loot Auto-Pickup (Proximity check)
    if (groundLootRef.current && groundLootRef.current.length > 0) {
      const pickupRadius = 4.2
      groundLootRef.current.forEach((loot) => {
        if (!loot.collected && Math.abs(loot.x - px) <= pickupRadius) {
          triggerLootCollect(loot.id)
        }
      })
    }
  }, [triggerEnemyHit, changeCorridor, triggerLootCollect])

  return (
    <div 
      className="dungeon-demo-root"
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {/* 0. Ambient Backdrop Glow (For Ultra-Wide Mobile Wings) */}
      <div className="dungeon-ambient-backdrop">
        <img 
          src={currentMap.basePoster} 
          alt="" 
          className="dungeon-ambient-backdrop-img"
        />
      </div>

      {/* Red Hit Flash Screen Vignette */}
      <div ref={hitVignetteRef} className="dungeon-hit-vignette" />

      {/* ====================================================================
          1. MASTER COVER VIEWPORT & STAGE (Edge-to-Edge Fullscreen Cover)
          Centered & smoothly tracks the player horizontally along the corridor!
          ==================================================================== */}
      <div ref={cameraViewportRef} className="dungeon-camera-viewport">
        <div className="dungeon-camera-stage">
          <div 
            ref={cameraWorldRef} 
            className="dungeon-camera-world"
            style={{
              transformOrigin: `50% ${100 - parseFloat(currentMap.groundOffset || 31.48)}%`,
            }}
          >
            {/* Pure GPU Hardware-Accelerated Texture Surface (Zero Video Decoders, 0% CPU, PS5-Speed Instant) */}
            <img 
              key={currentMap.id}
              src={currentMap.basePoster} 
              alt={currentMap.name} 
              className="dungeon-demo-bg-sprite"
              loading="eager"
              decoding="async"
              draggable={false}
            />

            {/* Floor Depth Mist */}
            <div className="dungeon-demo-ground-mist" />

            {/* 
              CHAMPION ACTOR:
              Knight Male (Kina) with new WALK & RUN animations, full combat combos,
              interactive movement, sounds, and overhead health bar!
              (Top-Left status HUD is rendered outside on the screen-fixed layer!)
            */}
            <ChampionActor 
              champion="knight_male"
              actorRef={champActorRef}
              level={progression.level}
              badge="👑"
              initialX={18}
              bottomOffset={currentMap.groundOffset || "31.48%"}
              minX={6}
              maxX={94}
              enableKeyboard={!isBackpackOpen && !showFundadoraDialog}
              showHud={false}
              showOverhead={true}
              showControls={false}
              showHint={false}
              floatingTexts={playerFloatingTexts}
              canMoveTo={checkPlayerMovementCollision}
              onStateChange={handleChampionStateChange}
            />

            {/* Spectacular Celestial Level Up Pillar of Light */}
            {levelUpEffect && (
              <div 
                className="levelup-celestial-pillar"
                style={{
                  left: `${levelUpEffect.x}%`,
                  bottom: currentMap.groundOffset || '31.48%',
                }}
              >
                <div className="levelup-light-beam" />
                <div className="levelup-light-core" />
                <div className="levelup-energy-ring ring-1" />
                <div className="levelup-energy-ring ring-2" />
                <div className="levelup-energy-ring ring-3" />
                <div className="levelup-magic-circle" />
                <div className="levelup-burst-flare" />
                <div className="levelup-particles">
                  <span className="p1">✨</span>
                  <span className="p2">⭐</span>
                  <span className="p3">✦</span>
                  <span className="p4">✨</span>
                  <span className="p5">⭐</span>
                  <span className="p6">✦</span>
                </div>
              </div>
            )}

            {/* 
              ========================================================================
              THEMATIC DUNGEON ENEMIES LAYER (Isolated 60 FPS Engine)
              ========================================================================
            */}
            <DungeonEnemiesLayer
              ref={enemiesLayerRef}
              corridorIndex={selectedMapIndex}
              lang={lang}
              groundOffset={currentMap.groundOffset || "31.48%"}
              isTransitioning={isTransitioningRef}
              champPosRef={champPosRef}
              champFacingRef={champFacingRef}
              champActorRef={champActorRef}
              onPlayerHit={handleEnemyPlayerHit}
              onEnemyKilled={handleEnemyKilled}
              onWaveCleared={handleWaveCleared}
              playEnemySound={playEnemySound}
              playEnemyPositionalSound={playEnemyPositionalSound}
              triggerScreenShake={triggerScreenShake}
            />

            {/* 
              ========================================================================
              LA FUNDADORA CELESTIAL (NPC Exclusiva del 3er Mapa Pasillo 3/3)
              Esperando al aventurero en el extremo del mapa (x: 84%)
              ========================================================================
            */}
            {selectedMapIndex === 8 && (
              <div
                className="npc-fundadora-root"
                style={{
                  left: '84%',
                  bottom: currentMap.groundOffset || '31.48%',
                }}
                onClick={() => {
                  soundManager?.playClick?.()
                  setShowFundadoraDialog(true)
                }}
                title={`${getDungeonText(lang, 'fundadora', 'name')} - ${getDungeonText(lang, 'fundadora', 'clickToTalk')}`}
              >
                {/* Celestial Radiant Ground Shadow */}
                <div className="npc-fundadora-shadow" />

                {/* Ethereal Divine Aura */}
                <div className="npc-fundadora-aura" />

                {/* Overhead Nameplate & Interactive Action Bubble */}
                <div className="npc-fundadora-overhead">
                  <div className="npc-fundadora-title">
                    <span className="npc-fundadora-crown">👑</span> {getDungeonText(lang, 'fundadora', 'name')}
                  </div>
                  <div className="npc-fundadora-sub">
                    {getDungeonText(lang, 'fundadora', 'role')}
                  </div>
                  <div className={`npc-fundadora-action-bubble ${isNearFundadora ? 'is-near' : ''}`}>
                    <span className="bubble-icon">💬</span> {lang === 'kr' ? '대화 (E)' : (lang === 'cn' ? '对话 (E)' : (lang === 'us' ? 'Talk (E)' : (lang === 'br' ? 'Falar (E)' : 'Hablar (E)')))}
                  </div>
                </div>

                {/* Animated WebP Sprite (Facing Towards the Approaching Champion) */}
                <div 
                  className="npc-fundadora-sprite-wrap"
                  style={{
                    transform: (champState?.posX ?? champState?.x ?? 18) > 84 ? 'scaleX(1)' : 'scaleX(-1)',
                    transformOrigin: '50% 97.22%',
                  }}
                >
                  <img
                    src="/assets/npcs/FUNDADORA/idle.webp"
                    alt="La Fundadora Celestial"
                    className="npc-fundadora-sprite"
                    loading="eager"
                    decoding="async"
                    draggable={false}
                  />
                </div>
              </div>
            )}

            {/* Radiant Celestial Blessing Aura over Champion */}
            {blessingAuraActive && (
              <div 
                className="champion-blessing-aura"
                style={{
                  left: `${champState?.posX ?? champState?.x ?? 18}%`,
                  bottom: currentMap.groundOffset || '31.48%',
                }}
              >
                <div className="blessing-aura-beam" />
                <div className="blessing-aura-flare" />
              </div>
            )}

            {/* Physical Ground Loot Drops (Gold Coins & Potions scattered on floor) */}
            {groundLoot.map((loot, lIdx) => (
              <div
                key={loot.id ? `${loot.id}_${lIdx}` : `gloot_${lIdx}`}
                className={`dungeon-ground-loot-item loot-${loot.type} ${loot.collected ? 'is-collected' : ''}`}
                style={{
                  left: `${loot.x}%`,
                  bottom: currentMap.groundOffset || '31.48%',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  triggerLootCollect(loot.id)
                }}
                title={`${loot.name} ${loot.amount > 1 ? `x${loot.amount}` : ''} - Toca o camina cerca para recoger`}
              >
                {/* Contact Shadow on Floor Baseline */}
                <div className="loot-item-shadow" />

                {/* Radiant Pulsing Aura */}
                <div className="loot-item-glow-aura" />

                {/* Floating Bobbing Loot Sprite */}
                <div className="loot-item-sprite-wrap">
                  <img
                    src={loot.icon}
                    alt={loot.name}
                    className="loot-item-icon"
                    draggable={false}
                  />
                  {loot.amount > 1 && (
                    <span className="loot-item-badge">+{loot.amount}</span>
                  )}
                </div>

                {/* Name Tag on Hover */}
                <div className="loot-item-tag">
                  {loot.name} {loot.amount > 1 ? `x${loot.amount}` : ''}
                </div>
              </div>
            ))}

            {/* In-World Exit Gateway & Guidance Arrow: Appears when wave is cleared */}
            {isWaveCleared && (
              <div 
                className="dungeon-exit-gateway-marker"
                style={{
                  left: '92%',
                  bottom: currentMap.groundOffset || '31.48%',
                }}
                onClick={handleAdvanceToNextCorridor}
                title={getDungeonText(lang, 'combat', 'advanceRight')}
              >
                {/* Ground Portal Ring & Glow */}
                <div className="dungeon-exit-portal-ring" />
                <div className="dungeon-exit-portal-glow" />

                {/* Vertical Beacon Beam */}
                <div className="dungeon-exit-beacon-beam" />

                {/* Floating Directional Arrow */}
                <div className="dungeon-exit-arrow-anchor">
                  <div className="dungeon-exit-arrow-badge">
                    <span className="dungeon-exit-arrow-icon">⚔️</span>
                    <span className="dungeon-exit-arrow-text">
                      {getDungeonText(lang, 'combat', 'advanceRight')}
                    </span>
                    <div className="dungeon-exit-arrow-chevrons">
                      <span className="chv chv-1">›</span>
                      <span className="chv chv-2">›</span>
                      <span className="chv chv-3">›</span>
                    </div>
                  </div>
                  <div className="dungeon-exit-arrow-main">
                    <svg viewBox="0 0 48 48" className="dungeon-exit-arrow-svg" fill="none">
                      <path 
                        d="M8 24H38M38 24L26 12M38 24L26 36" 
                        stroke="url(#exitArrowGradient)" 
                        strokeWidth="6" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                      <defs>
                        <linearGradient id="exitArrowGradient" x1="8" y1="24" x2="38" y2="24" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#F59E0B" />
                          <stop offset="0.5" stopColor="#FBBF24" />
                          <stop offset="1" stopColor="#38BDF8" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Atmospheric Vignette (Mounted on screen viewport frame) */}
      <div className="dungeon-demo-vignette" />

      {/* Corridor & Map Walking Transition Toast Banner */}
      {transitionToast && (
        <div 
          key={transitionToast.title}
          className={`dungeon-corridor-toast ${transitionToast.isNewMap ? 'new-map' : ''}`}
        >
          <div className="dungeon-corridor-toast-title">
            {transitionToast.title}
          </div>
          <div className="dungeon-corridor-toast-sub">
            {transitionToast.sub}
          </div>
        </div>
      )}

      {/* ====================================================================
          2. SCREEN-FIXED HUD LAYER
          Never zoomed, never shifted, always crisp, stable, and touch-ready!
          ==================================================================== */}
      {/* Top-Left MMORPG Status Profile Card with Live Experience Bar */}
      <ChampionProfileCard 
        state={champState} 
        name="Player" 
        level={progression.level} 
        exp={progression.exp}
        expNeeded={progression.expNeeded}
        badge="👑" 
      />

      {/* MMORPG Complete HUD Overlay (Controls, Quest, Buttons & Virtual Zoom Pills) */}
      <MmorpgHudOverlay 
        actorRef={champActorRef}
        championState={champState}
        playerLevel={progression.level}
        playerExp={progression.exp}
        playerExpNeeded={progression.expNeeded}
        championFacing={champState?.facing ?? 1}
        slimesCount={activeQuest ? activeQuest.targetCount : 3}
        slimesDefeated={activeQuest ? activeQuest.progress : 0}
        activeQuest={activeQuest}
        currentMapIndex={selectedMapIndex}
        maps={localizedMaps}
        isAudioMuted={isAudioMuted}
        isFullscreen={isFullscreen}
        cameraZoom={cameraZoom}
        playerGold={dungeonGold}
        hpPotions={hpPotions}
        mpPotions={mpPotions}
        onUseHpPotion={handleUseHpPotion}
        onUseMpPotion={handleUseMpPotion}
        onToggleCameraZoom={toggleCameraZoom}
        onSelectMap={(idx) => changeCorridor(idx, 'left')}
        onToggleSound={toggleSound}
        onToggleFullscreen={toggleFullscreen}
        onOpenInventory={() => {
          soundManager?.playClick?.()
          setIsBackpackOpen(true)
        }}
        onBack={onBack}
      />

      {/* Spectacular Level Up Screen Bloom & Radial Flash */}
      {levelUpEffect && (
        <div className="levelup-screen-flash" key={levelUpEffect.id} />
      )}

      {/* Spectacular Level Up Cinematic Screen Banner */}
      {levelUpEffect && (
        <div className="levelup-cinematic-banner" key={`banner_${levelUpEffect.id}`}>
          <div className="levelup-banner-glow" />
          <div className="levelup-banner-inner">
            <div className="levelup-banner-icon-badge">
              <span className="star-icon">⭐</span>
              <span className="levelup-badge-lvl-pill">Lv.{levelUpEffect.level}</span>
            </div>
            <div className="levelup-banner-text-group">
              <div className="levelup-banner-title">
                {getDungeonText(lang, 'levelUp', 'title')}
              </div>
              <div className="levelup-banner-sub">
                {getDungeonText(lang, 'levelUp', 'reached', { level: levelUpEffect.level })}
              </div>
            </div>
            <div className="levelup-banner-rewards">
              <span className="levelup-pill-reward">
                <span className="pill-icon">❤️</span> {getDungeonText(lang, 'levelUp', 'maxHpBonus')}
              </span>
              <span className="levelup-pill-reward hp-mp-full">
                <span className="pill-icon">✨</span> {getDungeonText(lang, 'levelUp', 'fullRestore')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          3. LA FUNDADORA CELESTIAL - MMORPG DIALOGUE MODAL
          ==================================================================== */}
      {showFundadoraDialog && (
        <div 
          className="fundadora-dialog-overlay" 
          onClick={() => {
            soundManager?.playClick?.()
            setShowFundadoraDialog(false)
          }}
        >
          <div 
            className="fundadora-dialog-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Avatar & Title */}
            <div className="fundadora-dialog-header">
              <div className="fundadora-dialog-avatar-wrap">
                <img 
                  src="/assets/npcs/FUNDADORA/avatar.webp" 
                  alt={getDungeonText(lang, 'fundadora', 'name')} 
                  className="fundadora-dialog-avatar"
                />
                <span className="fundadora-dialog-avatar-crown">👑</span>
              </div>
              <div className="fundadora-dialog-meta">
                <div className="fundadora-dialog-name">
                  {getDungeonText(lang, 'fundadora', 'name')}
                </div>
                <div className="fundadora-dialog-role">
                  {getDungeonText(lang, 'fundadora', 'role')}
                </div>
              </div>
              <button 
                type="button"
                className="fundadora-dialog-close-btn"
                onClick={() => {
                  soundManager?.playClick?.()
                  setShowFundadoraDialog(false)
                }}
                aria-label={getDungeonText(lang, 'fundadora', 'btnClose')}
              >
                ✕
              </button>
            </div>

            {/* Narrative Dialogue Body */}
            <div className="fundadora-dialog-body">
              {fundadoraDialogStep === 'intro' && (
                <p className="fundadora-dialog-text">
                  {getDungeonText(lang, 'fundadora', 'introText')}
                </p>
              )}

              {fundadoraDialogStep === 'blessing' && (
                <div className="fundadora-dialog-blessed-box">
                  <div className="fundadora-blessed-icon">✨</div>
                  <p className="fundadora-dialog-text highlight">
                    {getDungeonText(lang, 'fundadora', 'blessingText')}
                  </p>
                </div>
              )}

              {fundadoraDialogStep === 'lore' && (
                <p className="fundadora-dialog-text">
                  {getDungeonText(lang, 'fundadora', 'loreText')}
                </p>
              )}
            </div>

            {/* Interactive MMORPG Action Buttons */}
            <div className="fundadora-dialog-actions">
              {fundadoraDialogStep === 'intro' && (
                <>
                  <button 
                    type="button"
                    className="fundadora-btn fundadora-btn-blessing"
                    onClick={() => {
                      soundManager?.playLevelUp?.() || soundManager?.playSuccess?.() || soundManager?.playClick?.()
                      setChampState((prev) => ({
                        ...prev,
                        hp: prev.maxHp,
                        hpPercent: 100,
                        fury: 100,
                      }))
                      setHasReceivedBlessing(true)
                      setBlessingAuraActive(true)
                      setTimeout(() => setBlessingAuraActive(false), 3500)
                      setFundadoraDialogStep('blessing')
                      setTransitionToast({
                        title: getDungeonText(lang, 'fundadora', 'toastTitle'),
                        sub: getDungeonText(lang, 'fundadora', 'toastSub'),
                        isNewMap: true,
                      })
                      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
                      toastTimeoutRef.current = setTimeout(() => setTransitionToast(null), 3500)

                      // Quest 4 completion: Audiencia Celestial
                      const qConfig = activeQuestConfigRef.current
                      if (qConfig && qConfig.targetType === 'fundadora' && !isQuestDoneRef.current) {
                        setQuestProgress(1)
                        setTimeout(() => {
                          champActorRef.current?.showBanner?.(
                            getDungeonText(lang, 'questSystem', 'questCompletedBanner', {
                              title: qConfig.title,
                              exp: qConfig.expReward,
                              gold: qConfig.goldReward,
                            }),
                            'special'
                          )
                          awardPlayerExp(qConfig.expReward)
                          setDungeonGold((g) => g + qConfig.goldReward)
                          logRecentLoot('gold', getDungeonText(lang, 'questSystem', 'questGoldLoot', { gold: qConfig.goldReward }), '🪙', qConfig.goldReward)
                        }, 500)
                      }
                    }}
                  >
                    <span className="btn-icon">✨</span> {getDungeonText(lang, 'fundadora', 'btnBlessing')}
                  </button>

                  <button 
                    type="button"
                    className="fundadora-btn fundadora-btn-lore"
                    onClick={() => {
                      soundManager?.playClick?.()
                      setFundadoraDialogStep('lore')
                    }}
                  >
                    <span className="btn-icon">📜</span> {getDungeonText(lang, 'fundadora', 'btnLore')}
                  </button>

                  <button 
                    type="button"
                    className="fundadora-btn fundadora-btn-restart"
                    onClick={() => {
                      soundManager?.playClick?.()
                      setShowFundadoraDialog(false)
                      changeCorridor(0, 'left')
                    }}
                  >
                    <span className="btn-icon">🔄</span> {getDungeonText(lang, 'fundadora', 'btnRestart')}
                  </button>
                </>
              )}

              {fundadoraDialogStep !== 'intro' && (
                <button 
                  type="button"
                  className="fundadora-btn fundadora-btn-back"
                  onClick={() => {
                    soundManager?.playClick?.()
                    setFundadoraDialogStep('intro')
                  }}
                >
                  <span className="btn-icon">↩</span> {getDungeonText(lang, 'fundadora', 'btnBack')}
                </button>
              )}

              <button 
                type="button"
                className="fundadora-btn fundadora-btn-close"
                onClick={() => {
                  soundManager?.playClick?.()
                  setShowFundadoraDialog(false)
                }}
              >
                {getDungeonText(lang, 'fundadora', 'btnClose')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MMORPG Live Adventurer's Backpack Modal */}
      <DungeonBackpackModal 
        isOpen={isBackpackOpen}
        onClose={() => setIsBackpackOpen(false)}
        gold={dungeonGold}
        hpPotions={hpPotions}
        mpPotions={mpPotions}
        materials={backpackMaterials}
        recentLoot={recentLoot}
        onUseHpPotion={handleUseHpPotion}
        onUseMpPotion={handleUseMpPotion}
        playerHp={champState?.hp ?? 1250}
        playerMaxHp={champState?.maxHp ?? 1250}
        playerFury={champState?.fury ?? 100}
      />
    </div>
  )
}
