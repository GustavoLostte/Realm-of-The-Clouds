import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { EyeOff, Maximize2, Minimize2 } from 'lucide-react'
import { TopBar } from './components/TopBar'
import { GameWorld } from './components/GameWorld'
import { LeftActionControls } from './components/LeftActionControls'
import { RightActionControls } from './components/RightActionControls'
import { NotificationBell } from './components/NotificationBell'
import { QuestHerald } from './components/QuestHerald'
import { RankingLateralButton } from './components/RankingLateralButton'
import { StoreLateralButton } from './components/StoreLateralButton'
import { InventoryLateralButton } from './components/InventoryLateralButton'
import { FpsOverlay } from './components/FpsOverlay'
import { ModalHost } from './components/ModalHost'
import { EventBadge } from './components/EventBadge'
import { SwipeableToast } from './components/SwipeableToast'
import { RouletteNotification } from './components/RouletteNotification'
import { StarterPackBanner } from './components/StarterPackBanner'
import { FlyToHudLayer } from './components/FlyToHudLayer'
import { GuidedTutorial } from './components/GuidedTutorial'
import { StartScreen } from './components/StartScreen'
import { PvpScene } from './components/PvpScene'
import { SmartLoader } from './components/SmartLoader'
import { preloadImages, getCityCriticalAssets } from './utils/smartAssetLoader'
import OrientationNotice from './components/OrientationNotice'
import { CustomContextMenu } from './components/CustomContextMenu'
import { requestGameFullscreen, isFullscreenActive, isMobileOrTouch, toggleGameFullscreen } from './utils/fullscreen'
import { RELICS } from './data/inventoryData'
import { KINGDOM_EVENTS } from './data/randomEventsData'
import { 
  generateRivalsForPlayer, 
  INITIAL_DEFENSE_LOG, 
  getLeagueForTrophies,
  getCurrentSeasonData,
  calculateTrophyReset,
  getSeasonRewardsForLeague,
} from './data/arenaData'
import { 
  INITIAL_PLAZA_SLOTS, 
  INITIAL_RESOURCES, 
  BUILDING_TYPES,
  SPEEDUP_TYPES,
  getBuildingConstructionTime,
  getBuildingUpgradeTime,
  getMaxProductionBatches,
  getBuildingDef,
  getBuildingMaxAllowed,
  getBuildingCurrentCount,
  getKingdomStorageCapacity,
  sanitizeKingdomSlots,
} from './data/buildingsData'
import {
  STORY_QUESTS,
  DAILY_QUESTS_TEMPLATE,
  EPIC_FEATS_TEMPLATE,
  CHAPTERS_DATA,
  getLevelForXp,
  getXpProgress,
  KINGDOM_LEVELS,
  getLevelDefinition,
} from './data/questsData'
import { gameStorage, hasMeaningfulProgress } from './utils/gameStorage'
import { claimWheelSpinOnServer, claimArenaSeasonRewardOnServer } from './utils/supabaseClient'
import { soundManager } from './utils/audio'
import { useTranslation } from './i18n'
import './App.css'

function getTutorialAccountKey(email) {
  const clean = email ? email.trim().toLowerCase() : null
  return clean ? `toc_tutorial_completed_${clean}` : 'toc_tutorial_completed_guest'
}

export default function App() {
  const { t } = useTranslation()
  // Load persistent state ONCE and cache (previously called 19 times)
  const [initialSave] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('reset=true')) {
      try {
        localStorage.clear()
        sessionStorage.clear()
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch {}
      return null
    }
    return gameStorage.load()
  })

  const [resources, setResources] = useState(() => {
    const raw = initialSave?.resources || INITIAL_RESOURCES
    return {
      ...INITIAL_RESOURCES,
      ...raw,
      gold: Math.max(raw.gold ?? 0, 500),
      wood: Math.max(raw.wood ?? 0, 450),
      stone: Math.max(raw.stone ?? 0, 450),
      food: Math.max(raw.food ?? 0, 250),
      gems: Math.max(raw.gems ?? 0, 50),
      celestialShards: Math.max(raw.celestialShards ?? 75, 75),
    }
  })

  const [slots, setSlots] = useState(() => {
    const rawSlots = sanitizeKingdomSlots(initialSave?.slots || INITIAL_PLAZA_SLOTS)
    const { updatedSlots } = gameStorage.resolveOfflineConstructions(rawSlots)
    return updatedSlots
  })

  const [troops, setTroops] = useState(() => {
    return initialSave?.troops || { infantry: 1, archers: 0, mages: 0, commander: 0 }
  })

  const [trainingQueue, setTrainingQueue] = useState(() => {
    return initialSave?.trainingQueue || []
  })

  const [totalHarvests, setTotalHarvests] = useState(() => {
    return initialSave?.totalHarvests || 0
  })

  const [tutorialSeen, setTutorialSeen] = useState(() => {
    return Boolean(initialSave?.tutorialSeen)
  })

  const [welcomeModalOpen, setWelcomeModalOpen] = useState(() => {
    const isDone = Boolean(initialSave?.tutorialSeen || (initialSave?.completedNodes && initialSave.completedNodes.length > 0))
    return !isDone
  })

  const [isTutorialActive, setIsTutorialActive] = useState(() => {
    if (initialSave?.tutorialSeen) return false
    const email = gameStorage.getEmail()
    const key = getTutorialAccountKey(email)
    return localStorage.getItem(key) !== 'true' && localStorage.getItem('toc_tutorial_completed') !== 'true'
  })

  const [kingdomXp, setKingdomXp] = useState(() => {
    if (initialSave?.kingdomXp !== undefined) return initialSave.kingdomXp
    if (initialSave?.kingdomLevel) {
      return getLevelDefinition(initialSave.kingdomLevel)?.xpRequired || 0
    }
    return 0
  })

  const [claimedQuestIds, setClaimedQuestIds] = useState(() => {
    return initialSave?.claimedQuestIds || []
  })

  // Daily quest claim tracking — resets at midnight each day
  const [claimedDailyIds, setClaimedDailyIds] = useState(() => {
    const saved = initialSave?.claimedDailyIds || []
    const savedReset = initialSave?.lastDailyReset || 0
    // Auto-reset if saved date is from a previous calendar day
    const today = new Date().toDateString()
    const savedDay = savedReset ? new Date(savedReset).toDateString() : ''
    return today === savedDay ? saved : []
  })
  const [lastDailyReset, setLastDailyReset] = useState(() => {
    const savedReset = initialSave?.lastDailyReset || 0
    const today = new Date().toDateString()
    const savedDay = savedReset ? new Date(savedReset).toDateString() : ''
    return today === savedDay ? savedReset : Date.now()
  })

  // Epic feats claim tracking (lifetime, never resets)
  const [claimedEpicIds, setClaimedEpicIds] = useState(() => {
    return initialSave?.claimedEpicIds || []
  })

  const [completedNodes, setCompletedNodes] = useState(() => {
    return initialSave?.completedNodes || []
  })

  const [unlockedBiomes, setUnlockedBiomes] = useState(() => {
    return initialSave?.unlockedBiomes || ['biome-1']
  })

  const [unlockedTechIds, setUnlockedTechIds] = useState(() => {
    return initialSave?.unlockedTechIds || []
  })

  const [ownedRelicIds, setOwnedRelicIds] = useState(() => {
    return initialSave?.ownedRelicIds || []
  })

  const [equippedRelics, setEquippedRelics] = useState(() => {
    return initialSave?.equippedRelics || { head: null, weapon: null, accessory: null }
  })

  const [consumables, setConsumables] = useState(() => {
    return initialSave?.consumables || { potion_heal: 1, potion_focus: 1, bomb_dwarf: 0 }
  })

  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [notificationHistory, setNotificationHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('toc_notification_history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [hasStartedGame, setHasStartedGame] = useState(false)
  const [isCityLoading, setIsCityLoading] = useState(false)
  const [cityLoadProgress, setCityLoadProgress] = useState(0)
  const [playerName, setPlayerName] = useState(() => {
    const stored = localStorage.getItem('toc_player_name')
    if (!stored || stored === 'Lord Soberano' || stored === 'LORD SOBERANO' || stored === 'Sovereign Lord' || stored === 'Lorde Soberano') {
      try { localStorage.setItem('toc_player_name', 'Lord King') } catch {}
      return 'Lord King'
    }
    return stored
  })
  const [playerAvatar, setPlayerAvatar] = useState(() => {
    return localStorage.getItem('toc_player_avatar') || '/assets/avatars/avatar_king.webp'
  })

  // Modal states
  const [usernameModalOpen, setUsernameModalOpen] = useState(false)
  const [buildModalOpen, setBuildModalOpen] = useState(false)
  const [tutorialKey, setTutorialKey] = useState(0)

  // Guided interactive tutorial active running condition
  const isTutorialRunning = isTutorialActive && !welcomeModalOpen && !usernameModalOpen && hasStartedGame && !isCityLoading
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [questsModalOpen, setQuestsModalOpen] = useState(false)
  const [armyModalOpen, setArmyModalOpen] = useState(false)
  const [expeditionModalOpen, setExpeditionModalOpen] = useState(false)
  const [dungeonCombatOpen, setDungeonCombatOpen] = useState(false)
  const [campaignWindowOpen, setCampaignWindowOpen] = useState(false)
  const [menuModalOpen, setMenuModalOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [levelUpModalOpen, setLevelUpModalOpen] = useState(false)
  const [levelUpInfo, setLevelUpInfo] = useState(null)
  const [offlineEarnings, setOfflineEarnings] = useState(null)
  const [offlineModalOpen, setOfflineModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [recommendedBuildId, setRecommendedBuildId] = useState(null)
  const [activeEvent, setActiveEvent] = useState(null)
  const [eventModalOpen, setEventModalOpen] = useState(false)

  // Tech Tree, Inventory & Visual Juice states
  const [techTreeModalOpen, setTechTreeModalOpen] = useState(false)
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false)
  const [combatModeModalOpen, setCombatModeModalOpen] = useState(false)
  const [kingdomHubModalOpen, setKingdomHubModalOpen] = useState(false)
  const [chatModalOpen, setChatModalOpen] = useState(false)
  const [flyingParticles, setFlyingParticles] = useState([])
  const [poppingResource, setPoppingResource] = useState(null)
  const [isCinematicMode, setIsCinematicMode] = useState(false)
  const [currentScene, setCurrentScene] = useState('kingdom') // 'kingdom' | 'pvp'

  // FPS Performance & Eco Mode (Default 60fps for silky-smooth experience everywhere)
  const [fpsMode, setFpsModeState] = useState(() => {
    try {
      const saved = localStorage.getItem('toc_fps_mode')
      if (saved === '60fps' || saved === 'eco') return saved
      return '60fps'
    } catch {
      return '60fps'
    }
  })

  const handleSetFpsMode = (mode) => {
    setFpsModeState(mode)
    try {
      localStorage.setItem('toc_fps_mode', mode)
      document.documentElement.setAttribute('data-fps-mode', mode)
    } catch {}
  }

  // Visual Particles toggle (Persisted in localStorage)
  const [particlesEnabled, setParticlesEnabledState] = useState(() => {
    try {
      return localStorage.getItem('toc_particles_enabled') !== 'false'
    } catch {
      return true
    }
  })

  const handleToggleParticles = (enabled) => {
    setParticlesEnabledState(enabled)
    try {
      localStorage.setItem('toc_particles_enabled', String(enabled))
      document.documentElement.setAttribute('data-particles', enabled ? 'on' : 'off')
    } catch {}
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-fps-mode', fpsMode)
    document.documentElement.setAttribute('data-particles', particlesEnabled ? 'on' : 'off')
  }, [fpsMode, particlesEnabled])

  // Anti-Softlock Emergency Guardian: if basic building materials fall below critical threshold, provide immediate relief floor
  useEffect(() => {
    setResources((prev) => {
      if (!prev) return prev
      if ((prev.stone ?? 0) < 150 || (prev.wood ?? 0) < 150 || (prev.gold ?? 0) < 200) {
        return {
          ...prev,
          gold: Math.max(prev.gold ?? 0, 500),
          wood: Math.max(prev.wood ?? 0, 450),
          stone: Math.max(prev.stone ?? 0, 450),
          food: Math.max(prev.food ?? 0, 250),
        }
      }
      return prev
    })
  }, [])

  const [isFullscreen, setIsFullscreen] = useState(isFullscreenActive)

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(isFullscreenActive())
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    document.addEventListener('webkitfullscreenchange', handleFsChange)
    document.addEventListener('mozfullscreenchange', handleFsChange)
    document.addEventListener('MSFullscreenChange', handleFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
      document.removeEventListener('webkitfullscreenchange', handleFsChange)
      document.removeEventListener('mozfullscreenchange', handleFsChange)
      document.removeEventListener('MSFullscreenChange', handleFsChange)
    }
  }, [])

  // Mobile Fullscreen Auto-Enforcer (STRICTLY for mobile phones/tablets):
  // Re-asserts fullscreen on mobile touch interactions only.
  // NEVER triggers on desktop, PC or laptop clicks.
  useEffect(() => {
    if (!isMobileOrTouch()) return

    const handleUserGestureFullscreen = () => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (!isFullscreenActive()) {
        requestGameFullscreen()
      }
    }

    window.addEventListener('touchend', handleUserGestureFullscreen, { passive: true })

    return () => {
      window.removeEventListener('touchend', handleUserGestureFullscreen)
    }
  }, [])

  const handleToggleFullscreen = () => {
    soundManager.playClick()
    toggleGameFullscreen()
  }

  // Shop & Monetization states
  const [shopModalOpen, setShopModalOpen] = useState(false)
  const [shopInitialTab, setShopInitialTab] = useState('offers')
  const [vipStatus, setVipStatus] = useState(() => {
    return initialSave?.vipStatus || {
      hasSecondBuilder: false,
      hasOneClickHarvest: false,
      hasDailyBlessing: false,
      hasEngineering: false,
      starterPackClaimed: false,
      allianceBundleClaimed: false,
    }
  })
  const [speedups, setSpeedups] = useState(() => {
    return initialSave?.speedups || {
      speedup_1m: 4,
      speedup_5m: 2,
      speedup_15m: 1,
      speedup_60m: 0,
    }
  })
  const [lastWheelFreeSpinTime, setLastWheelFreeSpinTime] = useState(() => {
    return initialSave?.lastWheelFreeSpinTime || 0
  })

  // Arena & Competitive PvP states
  const [arenaModalOpen, setArenaModalOpen] = useState(false)
  const [arenaInitialTab, setArenaInitialTab] = useState('pvp')
  const [arenaBattleOpen, setArenaBattleOpen] = useState(false)
  const [selectedArenaRival, setSelectedArenaRival] = useState(null)
  const [arenaData, setArenaData] = useState(() => {
    const currentSeason = getCurrentSeasonData()
    return initialSave?.arenaData || {
      trophies: 250,
      tickets: 3,
      lastTicketRegenTime: Date.now(),
      honorPoints: 120,
      peaceShieldUntil: 0,
      defenseLog: INITIAL_DEFENSE_LOG,
      rivals: null,
      lastSeasonProcessed: currentSeason.seasonNumber,
      lastClaimedSeason: 0,
    }
  })

  // Season End Ceremony Modal State
  const [seasonEndModalOpen, setSeasonEndModalOpen] = useState(false)
  const [pendingSeasonData, setPendingSeasonData] = useState(null)

  // Global Sovereign Ranking Leaderboard State
  const [rankingModalOpen, setRankingModalOpen] = useState(false)
  const [rankingCategory, setRankingCategory] = useState('power')

  const handleOpenRanking = (category = 'power') => {
    setRankingCategory(category)
    setRankingModalOpen(true)
  }

  // Imperial Instant Harvest All Decree Modal State
  const [harvestModalOpen, setHarvestModalOpen] = useState(false)
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false)
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        window.innerWidth <= 768 ||
        window.innerHeight <= 520 ||
        (window.innerWidth <= 960 && (window.matchMedia?.('(pointer: coarse)')?.matches || 'ontouchstart' in window))
      )
    }
    return false
  })

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(
        window.innerWidth <= 768 ||
        window.innerHeight <= 520 ||
        (window.innerWidth <= 960 && (window.matchMedia?.('(pointer: coarse)')?.matches || 'ontouchstart' in window))
      )
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  // Universal condition tracking if ANY modal or sub-window is currently active
  const isAnyModalOpen = useMemo(() => Boolean(
    buildModalOpen ||
    detailsModalOpen ||
    questsModalOpen ||
    armyModalOpen ||
    expeditionModalOpen ||
    dungeonCombatOpen ||
    campaignWindowOpen ||
    menuModalOpen ||
    profileModalOpen ||
    levelUpModalOpen ||
    offlineModalOpen ||
    eventModalOpen ||
    techTreeModalOpen ||
    inventoryModalOpen ||
    combatModeModalOpen ||
    kingdomHubModalOpen ||
    chatModalOpen ||
    shopModalOpen ||
    arenaModalOpen ||
    seasonEndModalOpen ||
    rankingModalOpen ||
    harvestModalOpen ||
    (notificationsModalOpen && isMobileScreen) ||
    arenaBattleOpen ||
    usernameModalOpen ||
    welcomeModalOpen
  ), [
    buildModalOpen, detailsModalOpen, questsModalOpen, armyModalOpen,
    expeditionModalOpen, dungeonCombatOpen, campaignWindowOpen, menuModalOpen,
    profileModalOpen, levelUpModalOpen, offlineModalOpen, eventModalOpen,
    techTreeModalOpen, inventoryModalOpen, combatModeModalOpen, kingdomHubModalOpen,
    chatModalOpen, shopModalOpen, arenaModalOpen, seasonEndModalOpen,
    rankingModalOpen, harvestModalOpen, notificationsModalOpen, isMobileScreen,
    arenaBattleOpen, usernameModalOpen, welcomeModalOpen
  ])


  // Keyboard shortcut: Press 'H' to toggle Cinematic View, 'Escape' to exit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault()
        soundManager.playClick()
        setIsCinematicMode((prev) => !prev)
      } else if (e.key === 'Escape' && isCinematicMode) {
        e.preventDefault()
        soundManager.playClick()
        setIsCinematicMode(false)
      } else if (e.key === 'Escape' && currentScene === 'pvp') {
        e.preventDefault()
        soundManager.playClick()
        setCurrentScene('kingdom')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCinematicMode, currentScene])

  // Ensure rivals exist for the arena
  useEffect(() => {
    if (!arenaData.rivals || arenaData.rivals.length === 0) {
      setArenaData((prev) => ({
        ...prev,
        rivals: generateRivalsForPlayer(prev.trophies, 1),
      }))
    }
  }, [arenaData.rivals])

  // Ticket regeneration (1 ticket every 2 hours if < 3)
  useEffect(() => {
    if (arenaData.tickets < 3) {
      const now = Date.now()
      const TWO_HOURS = 2 * 60 * 60 * 1000
      const elapsed = now - (arenaData.lastTicketRegenTime || now)
      if (elapsed >= TWO_HOURS) {
        const addedTickets = Math.min(3 - arenaData.tickets, Math.floor(elapsed / TWO_HOURS))
        if (addedTickets > 0) {
          setArenaData((prev) => ({
            ...prev,
            tickets: Math.min(3, prev.tickets + addedTickets),
            lastTicketRegenTime: now,
          }))
        }
      }
    }
  }, [arenaData.tickets, arenaData.lastTicketRegenTime])

  // Competitive season rollover check and pending season rewards distribution
  useEffect(() => {
    if (!hasStartedGame) return
    const currentSeason = getCurrentSeasonData()
    const lastProcessed = arenaData.lastSeasonProcessed || currentSeason.seasonNumber
    const lastClaimed = arenaData.lastClaimedSeason || 0

    // If season rolled over and player hasn't claimed previous season reward
    if (currentSeason.seasonNumber > lastProcessed && lastClaimed < currentSeason.seasonNumber - 1) {
      const endedSeasonNumber = currentSeason.seasonNumber - 1
      const finalLeague = getLeagueForTrophies(arenaData.trophies || 250)
      const rewardBundle = getSeasonRewardsForLeague(finalLeague.id)
      const trophiesAfter = calculateTrophyReset(arenaData.trophies || 250)

      setPendingSeasonData({
        seasonNumber: endedSeasonNumber,
        seasonTitle: `Temporada ${endedSeasonNumber}: Choque de Reyes`,
        league: finalLeague,
        chestName: rewardBundle.chestName,
        rewards: rewardBundle.rewards,
        trophiesBefore: arenaData.trophies || 250,
        trophiesAfter,
      })
      setSeasonEndModalOpen(true)
    } else if (currentSeason.seasonNumber > lastProcessed) {
      setArenaData((prev) => ({
        ...prev,
        lastSeasonProcessed: currentSeason.seasonNumber,
      }))
    }
  }, [hasStartedGame, arenaData.lastSeasonProcessed, arenaData.lastClaimedSeason, arenaData.trophies])

  // Kingdom Level calculation from XP
  const currentLevelDef = getLevelForXp(kingdomXp)
  const kingdomLevel = currentLevelDef.level
  const xpProgress = getXpProgress(kingdomXp, kingdomLevel)
  const storageCapacity = getKingdomStorageCapacity(slots, kingdomLevel, vipStatus)
  const lastWarehouseWarningRef = useRef(0)

  // Central helper: builds the full save-state object from current state.
  // Uses a ref to snapshot volatile state so the useCallback has ZERO dependencies
  // and never re-creates, eliminating cascade re-renders through the autosave useEffect.
  const saveStateRef = useRef({})
  saveStateRef.current = {
    resources, slots, troops, trainingQueue, kingdomLevel, kingdomXp,
    completedNodes, unlockedBiomes, claimedQuestIds,
    unlockedTechIds, ownedRelicIds, equippedRelics,
    consumables, speedups, vipStatus, lastWheelFreeSpinTime,
    arenaData, totalHarvests, tutorialSeen,
    claimedDailyIds, lastDailyReset,
    profile: {
      name: playerName || (typeof localStorage !== 'undefined' && localStorage.getItem('toc_player_name')) || 'Lord King',
      avatar: playerAvatar || (typeof localStorage !== 'undefined' && localStorage.getItem('toc_player_avatar')) || '/assets/avatars/avatar_king.webp'
    },
  }

  const buildSaveState = useCallback((overrides = {}) => ({
    ...saveStateRef.current,
    ...overrides,
  }), []) // ← ZERO dependencies: reads from ref, never re-creates

  // Anti-rebound deduplication tracker for notifications (1.5s window)
  const recentNotificationsRef = useRef(new Map())

  const showNotification = useCallback((message, type = 'info') => {
    if (!message) return
    const now = Date.now()
    const lastSeen = recentNotificationsRef.current.get(message)
    // Anti-rebound: Silently discard duplicate identical message within 1500ms
    if (lastSeen && (now - lastSeen) < 1500) {
      return
    }
    recentNotificationsRef.current.set(message, now)

    // Memory prune: Clean stale entries
    if (recentNotificationsRef.current.size > 25) {
      for (const [msg, time] of recentNotificationsRef.current.entries()) {
        if (now - time > 5000) {
          recentNotificationsRef.current.delete(msg)
        }
      }
    }

    const id = now + Math.random()
    setNotifications((prev) => [...prev.slice(-1), { id, message, type }])
    setNotificationHistory((prev) => {
      const updated = [{ id, message, type, timestamp: now }, ...prev.slice(0, 29)]
      try { localStorage.setItem('toc_notification_history', JSON.stringify(updated)) } catch {}
      return updated
    })
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 3500)
  }, [])

  const handleClearNotifications = useCallback(() => {
    setNotificationHistory([])
    try { localStorage.removeItem('toc_notification_history') } catch {}
  }, [])

  // Consolidated harvest notification buffer to eliminate toast loops and spam
  const harvestBufferRef = useRef({
    gold: 0,
    wood: 0,
    stone: 0,
    food: 0,
    gems: 0,
    xp: 0,
    count: 0,
    timer: null,
  })
  const lastUnreadyNoticeTimeRef = useRef(0)

  // Unified coherent harvest notifier with in-place batch aggregation
  const notifyHarvest = useCallback((gained = {}, xpGained = 0, customPrefix = null) => {
    const buf = harvestBufferRef.current
    if (gained.gold) buf.gold += gained.gold
    if (gained.wood) buf.wood += gained.wood
    if (gained.stone) buf.stone += gained.stone
    if (gained.food) buf.food += gained.food
    if (gained.gems) buf.gems += gained.gems
    if (xpGained) buf.xp += xpGained
    buf.count += 1

    const parts = []
    if (buf.gold > 0) parts.push(`+${buf.gold.toLocaleString()} Oro`)
    if (buf.wood > 0) parts.push(`+${buf.wood.toLocaleString()} Madera`)
    if (buf.stone > 0) parts.push(`+${buf.stone.toLocaleString()} Piedra`)
    if (buf.food > 0) parts.push(`+${buf.food.toLocaleString()} Comida`)
    if (buf.gems > 0) parts.push(`+${buf.gems.toLocaleString()} Cristales`)

    const xpText = buf.xp > 0 ? ` (+${buf.xp} XP)` : ''
    const summary = parts.length > 0 ? parts.join(', ') : '+1 Tributo'

    let msg = ''
    if (customPrefix) {
      msg = `${customPrefix}: ${summary}${xpText}! 🌾`
    } else if (buf.count > 1) {
      msg = `¡Cosecha recolectada (${buf.count}): ${summary}${xpText}! 🌾`
    } else {
      msg = `¡Producción recolectada: ${summary}${xpText}! 🌾`
    }

    setNotifications((prev) => {
      const idx = prev.findIndex((n) => n.id === 'toast-harvest')
      const toastItem = { id: 'toast-harvest', message: msg, type: 'success' }
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = toastItem
        return next
      }
      return [...prev.slice(-1), toastItem]
    })

    if (buf.timer) {
      clearTimeout(buf.timer)
    }
    buf.timer = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== 'toast-harvest'))
      harvestBufferRef.current = {
        gold: 0,
        wood: 0,
        stone: 0,
        food: 0,
        gems: 0,
        xp: 0,
        count: 0,
        timer: null,
      }
    }, 3200)
  }, [])

  const handleDismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (id === 'toast-harvest' && harvestBufferRef.current) {
      if (harvestBufferRef.current.timer) {
        clearTimeout(harvestBufferRef.current.timer)
      }
      harvestBufferRef.current = {
        gold: 0,
        wood: 0,
        stone: 0,
        food: 0,
        gems: 0,
        xp: 0,
        count: 0,
        timer: null,
      }
    }
  }, [])

  // XP addition with Level Up check (Strict Mode & double-invoke safe)
  const addKingdomXp = useCallback(
    (amount, sourceLabel = '') => {
      if (!amount || amount <= 0) return

      let levelUpData = null
      let xpNotice = null

      setKingdomXp((prevXp) => {
        const newXp = prevXp + amount
        const oldLevel = getLevelForXp(prevXp).level
        const newLevel = getLevelForXp(newXp).level

        if (newLevel > oldLevel) {
          const nextLevelDef = getLevelDefinition(newLevel)
          levelUpData = {
            newLevel,
            levelData: nextLevelDef,
          }
        } else if (sourceLabel) {
          xpNotice = `+${amount} XP (${sourceLabel})`
        }

        return newXp
      })

      // Execute side effects outside updater to prevent double firing in StrictMode
      if (levelUpData) {
        setLevelUpInfo(levelUpData)
        setLevelUpModalOpen(true)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([60, 40, 80])
        }
        showNotification(
          t('notifications.kingdomLevelUp', { level: levelUpData.newLevel, title: t(`kingdomLevels.${levelUpData.newLevel}.title`) || levelUpData.levelData.title }),
          'success'
        )
      } else if (xpNotice) {
        showNotification(xpNotice, 'info')
      }
    },
    [showNotification]
  )

  // Ping and initialize cloud connection silently on initial mount
  useEffect(() => {
    gameStorage.checkCloud?.()
  }, [])

  // Auto-save kingdom state with intelligent 15-second debounce
  // Eliminates synchronous disk I/O and JSON stringify spam every 1s on mobile devices
  const autoSaveTimerRef = useRef(null)
  useEffect(() => {
    if (!hasStartedGame) return
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null
      gameStorage.save(buildSaveState())
    }, 15000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
    }
  }, [buildSaveState, hasStartedGame])

  // Emergency synchronous save on browser close / pagehide / tab switch
  useEffect(() => {
    const handleEmergencySave = () => {
      gameStorage.save(buildSaveState(), true)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleEmergencySave()
      }
    }

    window.addEventListener('beforeunload', handleEmergencySave)
    window.addEventListener('pagehide', handleEmergencySave)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleEmergencySave)
      window.removeEventListener('pagehide', handleEmergencySave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [buildSaveState])

  // Live network status detection (online/offline) for PWA resilience
  useEffect(() => {
    const handleOnline = () => {
      showNotification(t('notifications.onlineRestored'), 'success')
      gameStorage.save(buildSaveState(), true)
    }

    const handleOffline = () => {
      showNotification(t('notifications.offlineMode'), 'warning')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [showNotification, t, buildSaveState])

  // Handle entering game from start screen with email quest/guest persistence
  const handleEnterGame = useCallback((email, cloudResult) => {
    const cleanEmail = email ? email.trim().toLowerCase() : null

    // 1. Establish isolated active player context in storage & Supabase
    gameStorage.setActive(cleanEmail, cloudResult?.id || null)

    // Name comes from saved data for this specific email, not shared globally
    let activeName = (cleanEmail && localStorage.getItem(`toc_player_name_${cleanEmail}`)) || ''
    
    // Load local save strictly for this account (never cross-contaminates!)
    const localSave = gameStorage.load(cleanEmail)
    const cloudSave = cloudResult?.save
    const guestSave = cleanEmail ? gameStorage.load(null) : null

    // Determine which save to apply intelligently:
    // - Existing email in cloud or local: NEVER wipe or start from 0!
    // - Guest affiliating an email: migrate their guest kingdom to their email account so progress is preserved!
    // - Truly brand new player: only then start fresh from 0 with tutorial.
    let saveToApply = null
    let isMigratingGuest = false

    if (cleanEmail) {
      if (cloudSave && localSave) {
        // Both cloud and local exist: pick the freshest by lastSavedTime
        const cloudTime = cloudSave.lastSavedTime || 0
        const localTime = localSave.lastSavedTime || 0
        saveToApply = localTime > cloudTime ? localSave : cloudSave
      } else if (cloudSave) {
        saveToApply = cloudSave
      } else if (localSave && hasMeaningfulProgress(localSave)) {
        // Local save exists for this email with real progress
        saveToApply = localSave
      } else if (guestSave && hasMeaningfulProgress(guestSave)) {
        // Intelligent detection: User played as guest and is now registering/affiliating an email!
        // We MUST NOT destroy their guest empire! We migrate their empire to this email!
        saveToApply = { ...guestSave }
        isMigratingGuest = true
      } else if (localSave) {
        saveToApply = localSave
      }
    } else {
      // Guest mode
      saveToApply = localSave
    }

    const hasProgress = hasMeaningfulProgress(saveToApply)
    const isExistingAccount = Boolean(saveToApply && (hasProgress || cloudSave || (localSave && (localSave.slots || []).length > 0)))

    if (saveToApply && isExistingAccount) {
      // 1. Sanitize slots immediately to prevent slot corruption (e.g. duplicate IDs)
      // NEVER delete legitimate buildings or wipe to 1 castle!
      if (saveToApply.slots) {
        saveToApply.slots = sanitizeKingdomSlots(saveToApply.slots)
      }

      // 2. Tutorial verification scoped per account:
      // An account with an affiliated email and prior progress must NEVER be forced to repeat the tutorial!
      const accountKey = getTutorialAccountKey(cleanEmail)
      const isAccountTutorialDone = Boolean(
        saveToApply.tutorialSeen || 
        localStorage.getItem(accountKey) === 'true' || 
        hasProgress
      )
      setTutorialSeen(isAccountTutorialDone)

      if (!isAccountTutorialDone) {
        setIsTutorialActive(true)
        setTutorialKey((prev) => prev + 1)
        setWelcomeModalOpen(true)
      } else {
        setIsTutorialActive(false)
        setWelcomeModalOpen(false)
        localStorage.setItem(accountKey, 'true')
        localStorage.setItem('toc_tutorial_completed', 'true')
      }

      if (saveToApply.resources) {
        setResources({
          ...INITIAL_RESOURCES,
          ...saveToApply.resources,
          gold: Math.max(saveToApply.resources.gold ?? 0, 500),
          wood: Math.max(saveToApply.resources.wood ?? 0, 450),
          stone: Math.max(saveToApply.resources.stone ?? 0, 450),
          food: Math.max(saveToApply.resources.food ?? 0, 250),
          gems: Math.max(saveToApply.resources.gems ?? 0, 50),
          celestialShards: Math.max(saveToApply.resources.celestialShards ?? 75, 75),
        })
      }
      if (saveToApply.slots) {
        const { updatedSlots, completedBuildings } = gameStorage.resolveOfflineConstructions(saveToApply.slots)
        setSlots(updatedSlots)
        if (completedBuildings.length > 0) {
          const names = completedBuildings.map(b => `${t(`buildings.slots.${b.buildingId || b.id}.name`) || b.name} ${t('common.levelShort') || 'Lv.'}${b.level}`).join(', ')
          showNotification(t('notifications.constructionComplete', { names }), 'success')
        }
      }
      // Calculate offline earnings only upon entering the game
      if (saveToApply.lastSavedTime) {
        const earnings = gameStorage.calculateOfflineEarnings(
          saveToApply.lastSavedTime,
          saveToApply.slots || INITIAL_PLAZA_SLOTS
        )
        if (earnings) {
          if (earnings.updatedSlots) {
            setSlots(earnings.updatedSlots)
          }
          if (earnings.completedBuildings && earnings.completedBuildings.length > 0) {
            const names = earnings.completedBuildings.map(b => `${t(`buildings.slots.${b.buildingId || b.id}.name`) || b.name} ${t('common.levelShort') || 'Lv.'}${b.level}`).join(', ')
            showNotification(t('notifications.constructionCompleteDuringAbsence', { count: earnings.completedBuildings.length, names }), 'success')
            earnings.completedBuildings.forEach(b => {
              addKingdomXp(85 * b.level, t(`buildings.slots.${b.buildingId || b.id}.name`) || b.name)
            })
          }
          setOfflineEarnings(earnings)
          setOfflineModalOpen(true)
        }
      }
      if (saveToApply.troops) setTroops(saveToApply.troops)
      if (saveToApply.kingdomXp !== undefined) {
        setKingdomXp(saveToApply.kingdomXp)
      } else if (saveToApply.kingdomLevel !== undefined) {
        const levelDef = getLevelDefinition(saveToApply.kingdomLevel)
        setKingdomXp(levelDef?.xpRequired || 0)
      }
      if (saveToApply.completedNodes) setCompletedNodes(saveToApply.completedNodes)
      if (saveToApply.unlockedBiomes) setUnlockedBiomes(saveToApply.unlockedBiomes)
      if (saveToApply.claimedQuestIds) setClaimedQuestIds(saveToApply.claimedQuestIds)
      if (saveToApply.claimedDailyIds) setClaimedDailyIds(saveToApply.claimedDailyIds)
      if (saveToApply.claimedEpicIds) setClaimedEpicIds(saveToApply.claimedEpicIds)
      if (saveToApply.lastDailyReset) setLastDailyReset(saveToApply.lastDailyReset)
      if (saveToApply.unlockedTechIds) setUnlockedTechIds(saveToApply.unlockedTechIds)
      if (saveToApply.ownedRelicIds) setOwnedRelicIds(saveToApply.ownedRelicIds)
      if (saveToApply.equippedRelics) setEquippedRelics(saveToApply.equippedRelics)
      if (saveToApply.consumables) setConsumables(saveToApply.consumables)
      if (saveToApply.speedups) setSpeedups(saveToApply.speedups)
      if (saveToApply.vipStatus) setVipStatus(saveToApply.vipStatus)
      if (saveToApply.totalHarvests !== undefined) setTotalHarvests(saveToApply.totalHarvests)
      if (saveToApply.arenaData) setArenaData(saveToApply.arenaData)
      if (saveToApply.lastWheelFreeSpinTime !== undefined) setLastWheelFreeSpinTime(saveToApply.lastWheelFreeSpinTime)

      // Restore player name
      if (cloudResult?.playerName) {
        activeName = cloudResult.playerName
        setPlayerName(cloudResult.playerName)
        if (cleanEmail) localStorage.setItem(`toc_player_name_${cleanEmail}`, cloudResult.playerName)
      } else if (saveToApply.profile?.name) {
        activeName = saveToApply.profile.name
        setPlayerName(saveToApply.profile.name)
        if (cleanEmail) localStorage.setItem(`toc_player_name_${cleanEmail}`, saveToApply.profile.name)
      } else if (!activeName) {
        activeName = 'Lord King'
        setPlayerName('Lord King')
        if (cleanEmail) localStorage.setItem(`toc_player_name_${cleanEmail}`, 'Lord King')
      }
      // Restore avatar
      if (saveToApply.profile?.avatar) {
        setPlayerAvatar(saveToApply.profile.avatar)
        if (cleanEmail) localStorage.setItem(`toc_player_avatar_${cleanEmail}`, saveToApply.profile.avatar)
      }

      // Record in known accounts for instant switching
      if (cleanEmail) {
        gameStorage.recordAccount({
          email: cleanEmail,
          name: activeName || 'Lord King',
          level: saveToApply.kingdomLevel || 1,
          avatar: saveToApply.profile?.avatar || '/assets/avatars/avatar_king.webp',
        })
      }

      // If migrating guest, sync immediately to cloud
      if (isMigratingGuest && cleanEmail) {
        gameStorage.save(saveToApply, true)
        showNotification(t('notifications.empireSaved') || '¡El legado de tu imperio ha sido guardado con éxito!', 'success')
      } else {
        // Cache fresh state in local storage for this account
        gameStorage.save(saveToApply, false)
        showNotification(t('notifications.welcomeBack', { name: activeName || t('common.sovereign') }), 'success')
      }
    } else {
      // Fresh start for truly new accounts (clean email with zero progress, or new guest)
      activeName = cleanEmail ? '' : 'Lord King'
      setPlayerName(activeName)
      if (cleanEmail) {
        localStorage.removeItem(`toc_player_name_${cleanEmail}`)
        localStorage.removeItem(`toc_player_avatar_${cleanEmail}`)
      } else {
        localStorage.setItem('toc_player_name', 'Lord King')
      }
      setResources(INITIAL_RESOURCES)
      setSlots(INITIAL_PLAZA_SLOTS)
      setTroops({ infantry: 1, archers: 0, mages: 0, commander: 0 })
      setKingdomXp(0)
      setClaimedQuestIds([])
      setClaimedDailyIds([])
      setClaimedEpicIds([])
      setLastDailyReset(Date.now())
      setCompletedNodes([])
      setUnlockedBiomes(['biome-1'])
      setUnlockedTechIds([])
      setOwnedRelicIds([])
      setEquippedRelics({ head: null, weapon: null, accessory: null })
      setConsumables({ potion_heal: 1, potion_focus: 1, bomb_dwarf: 0 })
      setTotalHarvests(0)
      setSpeedups({ speedup_1m: 4, speedup_5m: 2, speedup_15m: 1, speedup_60m: 0 })
      setVipStatus({
        hasSecondBuilder: false,
        hasOneClickHarvest: false,
        hasDailyBlessing: false,
        hasEngineering: false,
        starterPackClaimed: false,
        allianceBundleClaimed: false,
      })
      setPlayerAvatar('/assets/avatars/avatar_king.webp')
      const accountKey = getTutorialAccountKey(cleanEmail)
      localStorage.removeItem(accountKey)
      localStorage.removeItem('toc_tutorial_completed')
      setTutorialSeen(false)
      setWelcomeModalOpen(true)
      setIsTutorialActive(true)
      setTutorialKey((prev) => prev + 1)

      const freshState = {
        resources: INITIAL_RESOURCES,
        slots: INITIAL_PLAZA_SLOTS,
        troops: { infantry: 1, archers: 0, mages: 0, commander: 0 },
        kingdomLevel: 1,
        kingdomXp: 0,
        completedNodes: [],
        unlockedBiomes: ['biome-1'],
        claimedQuestIds: [],
        claimedDailyIds: [],
        claimedEpicIds: [],
        lastDailyReset: Date.now(),
        unlockedTechIds: [],
        ownedRelicIds: [],
        equippedRelics: { head: null, weapon: null, accessory: null },
        consumables: { potion_heal: 1, potion_focus: 1, bomb_dwarf: 0 },
        speedups: { speedup_1m: 4, speedup_5m: 2, speedup_15m: 1, speedup_60m: 0 },
        vipStatus: {},
        lastWheelFreeSpinTime: 0,
        arenaData: { trophies: 400, leagueId: 'league_bronze' },
        totalHarvests: 0,
        tutorialSeen: false,
        profile: { name: activeName, avatar: '/assets/avatars/avatar_king.webp', email: cleanEmail }
      }
      gameStorage.save(freshState, true)

      if (cleanEmail) {
        gameStorage.recordAccount({
          email: cleanEmail,
          name: 'Lord King',
          level: 1,
          avatar: '/assets/avatars/avatar_king.webp',
        })
        showNotification(t('notifications.newKingdomCreated', { email: cleanEmail }), 'success')
      } else {
        showNotification(t('notifications.guestWelcome'), 'info')
      }
    }

    // Only prompt name selection for brand new accounts with no name set
    const finalName = activeName || localStorage.getItem('toc_player_name')
    if (!finalName && !isExistingAccount) {
      setTimeout(() => {
        setUsernameModalOpen(true)
      }, 450)
    }

    // Trigger intelligent preloading for city assets (map, current buildings, active citizens, HUD)
    setIsCityLoading(true)
    setCityLoadProgress(10)

    const rawSlots = saveToApply?.slots || slots || INITIAL_PLAZA_SLOTS
    const criticalCityAssets = getCityCriticalAssets(rawSlots)
    preloadImages(criticalCityAssets, (pct) => {
      setCityLoadProgress(Math.max(10, pct))
    }, 850).then(() => {
      setCityLoadProgress(100)
    })

    setHasStartedGame(true)
    soundManager.setGameStarted?.(true)
    soundManager.initCtx()
    soundManager.playBGM()
    requestGameFullscreen()
  }, [
    resources,
    slots,
    troops,
    kingdomLevel,
    kingdomXp,
    completedNodes,
    unlockedBiomes,
    claimedQuestIds,
    unlockedTechIds,
    ownedRelicIds,
    equippedRelics,
    consumables,
    speedups,
    vipStatus,
    lastWheelFreeSpinTime,
    arenaData,
    totalHarvests,
    welcomeModalOpen,
    playerName,
    showNotification,
  ])

  // Handle sovereign name / avatar update
  const handleSavePlayerName = useCallback((newName, newAvatar) => {
    if (!newName) return
    setPlayerName(newName)
    if (newAvatar) setPlayerAvatar(newAvatar)
    localStorage.setItem('toc_player_name', newName)
    if (newAvatar) localStorage.setItem('toc_player_avatar', newAvatar)
    showNotification(t('notifications.sovereignNameSaved', { name: newName }), 'success')
    requestGameFullscreen()

    // Trigger cloud & local save
    gameStorage.save(buildSaveState({
      activeChapter: 1,
      profile: { name: newName, avatar: newAvatar || playerAvatar }
    }), true)
  }, [buildSaveState, playerAvatar, showNotification])

  // Sound toggle handler
  const handleToggleSound = () => {
    const newState = soundManager.toggleSound()
    setSoundEnabled(newState)
    showNotification(
      newState ? t('notifications.soundOn') : t('notifications.soundOff'),
      'info'
    )
  }

  // Real-time passive resource generation & construction timer tick
  // Uses refs for slots/trainingQueue to prevent interval recreation on every state change
  const slotsRef = useRef(slots)
  slotsRef.current = slots
  const trainingQueueRef = useRef(trainingQueue)
  trainingQueueRef.current = trainingQueue

  useEffect(() => {
    if (!hasStartedGame) return

    const hasActiveConstruction = slotsRef.current.some((s) => s.isConstructing)
    const hasActiveTraining = Boolean(trainingQueueRef.current && trainingQueueRef.current.length > 0)

    // Idle Optimization: If nothing is constructing and no troops are training, DO NOT spin a 1s interval.
    // This completely eliminates background CPU wakeups and state checks during normal idle gameplay.
    if (!hasActiveConstruction && !hasActiveTraining) return

    const interval = setInterval(() => {
      const now = Date.now()

      // Read current values from refs (not stale closure captures)
      const currentSlots = slotsRef.current
      const currentQueue = trainingQueueRef.current
      const hasConstruction = currentSlots.some((s) => s.isConstructing)
      const hasTraining = Boolean(currentQueue && currentQueue.length > 0)

      if (hasConstruction) {
        setSlots((prevSlots) => {
          let hasChanges = false
          const updated = prevSlots.map((slot) => {
            if (slot.isConstructing) {
              const durationSec = slot.constructionDurationSec || 60
              const startedAt = slot.constructionStartedAt || (now - ((slot.progress || 0) / 100) * durationSec * 1000)
              const elapsedSec = (now - startedAt) / 1000

              if (elapsedSec >= durationSec) {
                hasChanges = true
                soundManager.stopConstructionAudio(slot.id)
                soundManager.playBuildComplete()
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  navigator.vibrate([40, 30, 40])
                }
                const bDef = BUILDING_TYPES[slot.buildingId?.toUpperCase()]
                const finalLevel = slot.targetLevel || slot.level || 1
                showNotification(
                  t('notifications.constructionFinished', { name: t(`buildings.slots.${slot.buildingId}.name`) || bDef?.name || 'Building', level: finalLevel }),
                  'success'
                )
                addKingdomXp(85 * finalLevel, t(`buildings.slots.${slot.buildingId}.name`) || bDef?.name || t('common.construction'))
                return {
                  ...slot,
                  isConstructing: false,
                  progress: 100,
                  level: finalLevel,
                  targetLevel: undefined,
                  constructionStartedAt: undefined,
                  constructionDurationSec: undefined,
                  lastHarvestAt: now,
                }
              }

              // In-flight progress is smoothly rendered by GameWorld & Modals locally without waking up App.jsx
              return slot
            }
            return slot
          })
          return hasChanges ? updated : prevSlots
        })
      }

      // Real-time military training queue progression
      if (hasTraining) {
        setTrainingQueue((prevQueue) => {
          if (!prevQueue || prevQueue.length === 0) return prevQueue
          const activeJob = prevQueue[0]
          const duration = activeJob.durationPerUnit || 15
          const startedAt = activeJob.unitStartedAt || now
          const elapsed = (now - startedAt) / 1000

          if (elapsed >= duration) {
            const unitsNeeded = activeJob.count - (activeJob.completedCount || 0)
            const unitsToComplete = Math.min(
              unitsNeeded,
              Math.max(1, Math.floor(elapsed / duration))
            )

            if (unitsToComplete > 0) {
              setTroops((prevTroops) => ({
                ...prevTroops,
                [activeJob.unitId]: (prevTroops[activeJob.unitId] || 0) + unitsToComplete,
              }))

              addKingdomXp(30 * unitsToComplete, t('notifications.xpRecruit') || 'Reclutamiento Militar')
              soundManager.playBuildComplete?.()
              showNotification(t('notifications.troopRecruited') || '¡Soldado adiestrado y listo para el combate!', 'success')

              const newCompleted = (activeJob.completedCount || 0) + unitsToComplete
              if (newCompleted >= activeJob.count) {
                const remaining = prevQueue.slice(1)
                if (remaining.length > 0) {
                  remaining[0] = {
                    ...remaining[0],
                    unitStartedAt: now,
                  }
                }
                return remaining
              } else {
                const timeConsumed = unitsToComplete * duration * 1000
                const updatedFirst = {
                  ...activeJob,
                  completedCount: newCompleted,
                  unitStartedAt: startedAt + timeConsumed,
                }
                return [updatedFirst, ...prevQueue.slice(1)]
              }
            }
          }
          return prevQueue
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [hasStartedGame, showNotification, addKingdomXp, t])

  // Kingdom Random Events Trigger (first after 45s, then every 160s)
  useEffect(() => {
    if (!hasStartedGame) return
    const triggerRandomEvent = () => {
      if (activeEvent) return
      const randomEv = KINGDOM_EVENTS[Math.floor(Math.random() * KINGDOM_EVENTS.length)]
      if (randomEv) {
        setActiveEvent({
          ...randomEv,
          expiresAt: Date.now() + 90000,
        })
        soundManager.playHorn()
        showNotification(t('notifications.royalMessengerArrived', { name: t(`kingdomEvents.${randomEv.id}.emissaryName`) || randomEv.emissaryName }), 'info')
      }
    }

    const firstTimer = setTimeout(triggerRandomEvent, 45000)
    const interval = setInterval(triggerRandomEvent, 160000)

    // Dev hook to trigger events on demand (strictly isolated to local development builds)
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      window.__tocTriggerEvent = (eventId) => {
        const ev = eventId 
          ? KINGDOM_EVENTS.find(e => e.id === eventId) 
          : KINGDOM_EVENTS[Math.floor(Math.random() * KINGDOM_EVENTS.length)]
        if (ev) {
          setActiveEvent({
            ...ev,
            expiresAt: Date.now() + 90000,
          })
          soundManager.playHorn()
          showNotification(t('notifications.royalMessengerReturned', { name: t(`kingdomEvents.${ev.id}.emissaryName`) || ev.emissaryName }), 'info')
        }
      }

      window.__tocTriggerLevelUp = (lvl = 2) => {
        const nextLevelDef = getLevelDefinition(lvl)
        setLevelUpInfo({
          newLevel: lvl,
          levelData: nextLevelDef,
        })
        setLevelUpModalOpen(true)
      }

      window.__tocSimulateSeasonEnd = () => {
        const currentSeason = getCurrentSeasonData()
        const endedSeasonNumber = currentSeason.seasonNumber
        const finalLeague = getLeagueForTrophies(arenaData.trophies || 250)
        const rewardBundle = getSeasonRewardsForLeague(finalLeague.id)
        const trophiesAfter = calculateTrophyReset(arenaData.trophies || 250)

        setPendingSeasonData({
          seasonNumber: endedSeasonNumber,
          seasonTitle: currentSeason.title,
          league: finalLeague,
          chestName: rewardBundle.chestName,
          rewards: rewardBundle.rewards,
          trophiesBefore: arenaData.trophies || 250,
          trophiesAfter,
        })
        setSeasonEndModalOpen(true)
      }

      window.__tocRestartTutorial = () => {
        const activeEmail = gameStorage.getEmail()
        const accountKey = getTutorialAccountKey(activeEmail)
        localStorage.removeItem(accountKey)
        localStorage.removeItem('toc_tutorial_completed')
        setTutorialSeen(false)
        setTutorialKey((prev) => prev + 1)
        setIsTutorialActive(true)
        console.log('👑 [ReinoDeLasNubes] Tutorial guiado reiniciado con éxito.')
      }
    }

    return () => {
      clearTimeout(firstTimer)
      clearInterval(interval)
      if (typeof window !== 'undefined') {
        delete window.__tocTriggerEvent
        delete window.__tocTriggerLevelUp
        delete window.__tocSimulateSeasonEnd
        delete window.__tocRestartTutorial
      }
    }
  }, [hasStartedGame, activeEvent, showNotification])

  // Announce daily wheel free spin readiness toast once per session
  const wheelNotifiedRef = useRef(false)
  useEffect(() => {
    if (!hasStartedGame || wheelNotifiedRef.current) return
    const isFreeReady = ((Date.now() - (lastWheelFreeSpinTime || 0)) / (1000 * 3600)) >= 20
    if (isFreeReady) {
      wheelNotifiedRef.current = true
      const timer = setTimeout(() => {
        showNotification(t('notifications.dailyFreeSpinReady'), 'success')
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [hasStartedGame, lastWheelFreeSpinTime, showNotification])

  const isResolvingEventRef = useRef(false)

  // Handle choice resolution from KingdomEventModal
  const handleResolveEventChoice = (event, choice) => {
    if (isResolvingEventRef.current) return
    isResolvingEventRef.current = true
    setTimeout(() => {
      isResolvingEventRef.current = false
    }, 1000)

    // Deduct costs
    if (choice.cost && Object.keys(choice.cost).length > 0) {
      setResources((prev) => {
        const next = { ...prev }
        Object.entries(choice.cost).forEach(([res, amt]) => {
          next[res] = Math.max(0, (next[res] || 0) - amt)
        })
        return next
      })
    }

    // Add resource rewards
    if (choice.reward) {
      setResources((prev) => {
        const next = { ...prev }
        Object.entries(choice.reward).forEach(([res, amt]) => {
          if (res !== 'xp') {
            next[res] = (next[res] || 0) + amt
          }
        })
        return next
      })

      if (choice.reward.xp) {
        addKingdomXp(choice.reward.xp, t(`kingdomEvents.${event.id}.title`) || event.title)
      }
    }

    // Add troop reward
    if (choice.rewardTroop) {
      setTroops((prev) => ({
        ...prev,
        [choice.rewardTroop.unitId]: (prev[choice.rewardTroop.unitId] || 0) + choice.rewardTroop.count
      }))
    }

    showNotification(t(`kingdomEvents.${event.id}.choices.${choice.id}.outcomeText`) || choice.outcomeText || t('notifications.eventDecreeSuccess'), 'success')
    setEventModalOpen(false)
    setActiveEvent(null)
    setEventTimeLeft(0)
  }

  // Open build menu
  const handleOpenBuildMenu = (target = null) => {
    if (isTutorialRunning) return
    if (typeof target === 'string') {
      // If target is a buildingId string, find first empty slot and set recommended
      const freeSlot = slots.find((s) => !s.buildingId)
      setSelectedSlot(freeSlot || null)
      setRecommendedBuildId(target)
    } else {
      setSelectedSlot(target)
      setRecommendedBuildId(null)
    }
    setBuildModalOpen(true)
  }

  // Execute building construction
  const handleSelectBuilding = (buildingId, targetSlot) => {
    const bDef = getBuildingDef(buildingId) || BUILDING_TYPES[buildingId.toUpperCase()]
    if (!bDef) return

    // Check maximum building limits
    const currentBuilt = getBuildingCurrentCount(bDef.id, slots)
    const maxAllowed = getBuildingMaxAllowed(bDef.id)
    if (currentBuilt >= maxAllowed) {
      showNotification(
        maxAllowed === 1
          ? t('notifications.buildingUnique', { name: t(`buildings.slots.${bDef.id}.name`) || bDef.name })
          : t('notifications.buildingLimitReached', { max: maxAllowed, name: t(`buildings.slots.${bDef.id}.name`) || bDef.name }),
        'warning'
      )
      soundManager.playButtonClick()
      return
    }

    // Check active builder capacity
    const activeBuilders = slots.filter((s) => s.isConstructing).length
    const maxBuilders = vipStatus.hasSecondBuilder ? 2 : 1
    if (activeBuilders >= maxBuilders) {
      showNotification(
        vipStatus.hasSecondBuilder
          ? t('notifications.buildersBusyDual')
          : t('notifications.buildersBusy'),
        'warning'
      )
      soundManager.playButtonClick()
      return
    }

    // Deduct resources
    setResources((prev) => ({
      ...prev,
      gold: prev.gold - (bDef.cost.gold || 0),
      wood: prev.wood - (bDef.cost.wood || 0),
      stone: prev.stone - (bDef.cost.stone || 0),
      gems: prev.gems - (bDef.cost.gems || 0),
      populationUsed: prev.populationUsed + (bDef.populationUsed || 0),
      populationMax: prev.populationMax + (bDef.populationProvided || 0),
    }))

    // Find destination slot
    const slotToUse = targetSlot || slots.find((s) => !s.buildingId)
    if (!slotToUse) {
      showNotification(t('notifications.noFreePlots'), 'warning')
      return
    }

    soundManager.startConstructionAudio(buildingId, slotToUse.id)
    const duration = getBuildingConstructionTime(buildingId, vipStatus.hasEngineering)

    const updatedResources = {
      ...resources,
      gold: resources.gold - (bDef.cost.gold || 0),
      wood: resources.wood - (bDef.cost.wood || 0),
      stone: resources.stone - (bDef.cost.stone || 0),
      gems: resources.gems - (bDef.cost.gems || 0),
      populationUsed: resources.populationUsed + (bDef.populationUsed || 0),
      populationMax: resources.populationMax + (bDef.populationProvided || 0),
    }

    const updatedSlots = slots.map((s) =>
      s.id === slotToUse.id
        ? {
            ...s,
            buildingId,
            isConstructing: true,
            progress: 0,
            level: 1,
            targetLevel: 1,
            constructionStartedAt: Date.now(),
            constructionDurationSec: duration,
            lastHarvestAt: Date.now(),
          }
        : s
    )

    setSlots(updatedSlots)

    // Instant synchronous save to eliminate any possibility of loss on tab close
    gameStorage.save(buildSaveState({
      resources: updatedResources,
      slots: updatedSlots,
    }), true)

    showNotification(t('notifications.startingConstruction', { name: t(`buildings.slots.${buildingId}.name`) || bDef.name, duration: Math.round(duration) }), 'info')
  }

  // Open details for a clicked building
  const handleSelectSlot = (slot) => {
    if (isTutorialRunning) return
    setSelectedSlot(slot)
    setDetailsModalOpen(true)
  }

  // Upgrade building
  const handleUpgradeBuilding = (slot, cost) => {
    // Check active builder capacity
    const activeBuilders = slots.filter((s) => s.isConstructing).length
    const maxBuilders = vipStatus.hasSecondBuilder ? 2 : 1
    if (activeBuilders >= maxBuilders) {
      showNotification(
        vipStatus.hasSecondBuilder
          ? t('notifications.buildersBusyDual')
          : t('notifications.buildersBusy'),
        'warning'
      )
      soundManager.playButtonClick()
      return
    }

    const updatedResources = {
      ...resources,
      gold: resources.gold - cost.gold,
      wood: resources.wood - cost.wood,
      stone: resources.stone - cost.stone,
    }
    setResources(updatedResources)

    soundManager.startConstructionAudio(slot.buildingId, slot.id)
    const duration = getBuildingUpgradeTime(slot.buildingId, slot.level, vipStatus.hasEngineering)

    const updatedSlots = slots.map((s) =>
      s.id === slot.id
        ? {
            ...s,
            isConstructing: true,
            progress: 0,
            targetLevel: s.level + 1,
            constructionStartedAt: Date.now(),
            constructionDurationSec: duration,
          }
        : s
    )

    setSlots(updatedSlots)

    // Instant synchronous save on upgrade start
    gameStorage.save(buildSaveState({
      resources: updatedResources,
      slots: updatedSlots,
    }), true)

    const bDef = BUILDING_TYPES[slot.buildingId.toUpperCase()]
    showNotification(t('notifications.upgradingBuilding', { name: t(`buildings.slots.${slot.buildingId}.name`) || bDef?.name, level: slot.level + 1, duration: Math.round(duration) }), 'info')
    setDetailsModalOpen(false)
  }

  // Demolish building
  const handleDemolishBuilding = (slot) => {
    if (!slot || slot.buildingId === 'ayuntamiento' || slot.buildingId === 'castillo') {
      showNotification(t('notifications.castleCannotDemolish'), 'warning')
      soundManager.playButtonClick()
      return
    }
    soundManager.stopConstructionAudio(slot.id)
    const bDef = getBuildingDef(slot.buildingId) || BUILDING_TYPES[slot.buildingId.toUpperCase()]
    setResources((prev) => ({
      ...prev,
      gold: prev.gold + Math.round((bDef?.cost.gold || 0) * 0.4),
      wood: prev.wood + Math.round((bDef?.cost.wood || 0) * 0.4),
      populationUsed: Math.max(0, prev.populationUsed - (bDef?.populationUsed || 0)),
      populationMax: Math.max(30, prev.populationMax - (bDef?.populationProvided || 0)),
    }))

    setSlots((prev) =>
      prev.map((s) =>
        s.id === slot.id
          ? { ...s, buildingId: null, level: 0, isConstructing: false, progress: 0 }
          : s
      )
    )

    showNotification(t('notifications.buildingDemolished'), 'info')
  }

  // Particle & visual juice triggers
  const triggerFlyToHud = useCallback((slot, clickCoords, gained) => {
    if (!particlesEnabled) return
    const resEntries = Object.entries(gained).filter(([, val]) => val > 0)
    if (resEntries.length === 0) return

    let startX = clickCoords?.clientX || clickCoords?.x
    let startY = clickCoords?.clientY || clickCoords?.y

    if (!startX || !startY) {
      if (slot && typeof slot.x === 'number' && typeof slot.y === 'number') {
        startX = (window.innerWidth * slot.x) / 100
        startY = (window.innerHeight * slot.y) / 100
      } else {
        startX = window.innerWidth / 2
        startY = window.innerHeight / 2
      }
    }

    const newParticles = []
    resEntries.forEach(([resType]) => {
      const targetEl = document.getElementById(`hud-res-${resType}`)
      let endX = window.innerWidth / 2
      let endY = 36
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect()
        endX = rect.left + rect.width / 2
        endY = rect.top + rect.height / 2
      }

      for (let i = 0; i < 5; i++) {
        const pId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`
        const midX = startX + (endX - startX) * (0.3 + Math.random() * 0.4) + (Math.random() - 0.5) * 80
        const midY = Math.min(startY, endY) - 50 - Math.random() * 60
        newParticles.push({
          id: pId,
          type: resType,
          startX,
          startY,
          midX,
          midY,
          endX,
          endY,
          delay: i * 65,
        })
      }
    })

    setFlyingParticles((prev) => [...prev, ...newParticles])

    // Safety timeout: Guarantee particles are purged even if mobile browser drops onAnimationEnd
    const idsToPurge = newParticles.map((p) => p.id)
    setTimeout(() => {
      setFlyingParticles((prev) => {
        if (!prev || prev.length === 0) return prev
        const remaining = prev.filter((p) => !idsToPurge.includes(p.id))
        return remaining.length === prev.length ? prev : remaining
      })
    }, 1200)
  }, [particlesEnabled])

  const handleParticleComplete = useCallback((particle) => {
    setFlyingParticles((prev) => prev.filter((p) => p.id !== particle.id))
    setPoppingResource(particle.type)
    soundManager.playPopChime()
    setTimeout(() => {
      setPoppingResource((current) => (current === particle.type ? null : current))
    }, 280)
  }, [])

  // Anti-double-click locks for building harvest
  const harvestingSlotsRef = useRef(new Set())

  // Resource harvest with real production cycle, tech, relic & VIP multipliers + Fly to HUD
  const handleCollectFromSlot = (slot, clickCoords = null, primaryResType = null) => {
    if (!slot || !slot.id) return
    if (harvestingSlotsRef.current.has(slot.id)) return
    harvestingSlotsRef.current.add(slot.id)
    setTimeout(() => {
      harvestingSlotsRef.current.delete(slot.id)
    }, 800)

    const bDef = BUILDING_TYPES[slot.buildingId?.toUpperCase()]
    if (!bDef) return
    const lvl = slot.level || 1
    const prod = bDef.production || {}

    const now = Date.now()
    const lastHarvest = slot.lastHarvestAt || (now - 60000)
    const elapsedSec = Math.max(0, (now - lastHarvest) / 1000)

    const cycleSec = (bDef.productionCycleSec || 120) * (vipStatus.hasEngineering ? 0.75 : 1)
    const maxBatches = getMaxProductionBatches(vipStatus.hasOneClickHarvest || vipStatus.hasEngineering)
    const batchRatio = Math.min(maxBatches, elapsedSec / cycleSec)

    // Require at least 25% of 1 cycle to collect
    if (batchRatio < 0.25) {
      if (now - lastUnreadyNoticeTimeRef.current > 3000) {
        lastUnreadyNoticeTimeRef.current = now
        const waitSec = Math.ceil(cycleSec * 0.25 - elapsedSec)
        showNotification(t('notifications.producingWait', { seconds: waitSec }), 'info')
      }
      return
    }

    // Multipliers from Tech Tree, Relics & VIP
    const vipHarvestBonus = vipStatus.hasOneClickHarvest ? 0.25 : 0
    const goldMult = (1 + (unlockedTechIds.includes('tech-mines') ? 0.25 : 0) + (unlockedTechIds.includes('tech-logistics') ? 0.15 : 0) + (equippedRelics?.head === 'relic_corona_caos' ? 0.15 : 0) + (equippedRelics?.accessory === 'relic_emblema_leon' ? 0.20 : 0) + vipHarvestBonus) * batchRatio
    const woodMult = (1 + (unlockedTechIds.includes('tech-axes') ? 0.20 : 0) + (unlockedTechIds.includes('tech-logistics') ? 0.15 : 0) + vipHarvestBonus) * batchRatio
    const stoneMult = (1 + (unlockedTechIds.includes('tech-quarry') ? 0.25 : 0) + (unlockedTechIds.includes('tech-logistics') ? 0.15 : 0) + vipHarvestBonus) * batchRatio
    const foodMult = (1 + (unlockedTechIds.includes('tech-crops') ? 0.20 : 0) + (unlockedTechIds.includes('tech-logistics') ? 0.15 : 0) + (equippedRelics?.accessory === 'relic_amuleto_selva' ? 0.15 : 0) + vipHarvestBonus) * batchRatio
    const xpMult = 1 + (equippedRelics?.head === 'relic_corona_caos' ? 0.10 : 0)

    const gained = {}
    let hasAny = false

    if (prod.gold) { gained.gold = Math.max(1, Math.round(prod.gold * lvl * goldMult)); hasAny = true; }
    if (prod.wood) { gained.wood = Math.max(1, Math.round(prod.wood * lvl * woodMult)); hasAny = true; }
    if (prod.stone) { gained.stone = Math.max(1, Math.round(prod.stone * lvl * stoneMult)); hasAny = true; }
    if (prod.food) { gained.food = Math.max(1, Math.round(prod.food * lvl * foodMult)); hasAny = true; }
    if (prod.gems) { gained.gems = Math.max(1, Math.round(prod.gems * lvl * Math.max(1, Math.floor(batchRatio)))); hasAny = true; }

    if (!hasAny) {
      gained.gold = Math.max(1, Math.round(20 * lvl * goldMult))
    }

    // Reset lastHarvestAt
    setSlots((prev) =>
      prev.map((s) => (s.id === slot.id ? { ...s, lastHarvestAt: Date.now() } : s))
    )

    let reachedCap = false
    setResources((prev) => {
      const next = { ...prev }
      Object.entries(gained).forEach(([res, val]) => {
        const cur = next[res] || 0
        if (res === 'gems') {
          next[res] = cur + val
        } else {
          const clamped = Math.min(storageCapacity, cur + val)
          if (clamped >= storageCapacity && cur + val >= storageCapacity) {
            reachedCap = true
          }
          next[res] = clamped
        }
      })
      return next
    })

    if (reachedCap && now - lastWarehouseWarningRef.current > 10000) {
      lastWarehouseWarningRef.current = now
      showNotification(
        t('buildings.storageCapacityDesc') || '¡El Almacén Real está al tope de su capacidad! Sube de nivel el Gran Almacén.',
        'warning'
      )
    }

    setTotalHarvests((h) => h + 1)
    const primaryType = primaryResType || Object.keys(gained)[0] || 'gold'
    soundManager.playCollect(primaryType)

    const harvestXp = Math.max(5, Math.round(8 * lvl * xpMult * Math.max(1, batchRatio)))
    // Pass empty string so addKingdomXp does NOT spawn a duplicate routine XP toast
    addKingdomXp(harvestXp, '')

    // Launch Fly to HUD particles
    triggerFlyToHud(slot, clickCoords, gained)

    // Notify consolidated harvest
    notifyHarvest(gained, harvestXp)
  }

  // Research Tech Handler
  const handleResearchTech = (tech) => {
    if (tech.cost) {
      setResources((prev) => {
        const next = { ...prev }
        Object.entries(tech.cost).forEach(([res, amt]) => {
          next[res] = Math.max(0, (next[res] || 0) - amt)
        })
        return next
      })
    }

    setUnlockedTechIds((prev) => (prev.includes(tech.id) ? prev : [...prev, tech.id]))
    addKingdomXp(tech.xpReward || 40, t('notifications.xpResearch', { name: t(`techData.techs.${tech.id}.name`) || tech.name }))
    soundManager.playVictory()
    showNotification(t('notifications.techCompleted', { name: t(`techData.techs.${tech.id}.name`) || tech.name }), 'success')
  }

  // Relic Handlers
  const handleObtainRelic = (relicId) => {
    const relic = RELICS.find((r) => r.id === relicId)
    if (!relic) return

    setOwnedRelicIds((prev) => {
      if (prev.includes(relicId)) return prev
      return [...prev, relicId]
    })

    // Auto-equip if slot is empty
    setEquippedRelics((prev) => {
      if (!prev[relic.slot]) {
        return { ...prev, [relic.slot]: relicId }
      }
      return prev
    })

    soundManager.playQuestSuccess()
    showNotification(t('notifications.relicObtained', { name: t(`inventoryItems.relics.${relic.id}.name`) || relic.name }), 'success')
  }

  const handleEquipRelic = (relic) => {
    setEquippedRelics((prev) => ({
      ...prev,
      [relic.slot]: relic.id,
    }))
    soundManager.playClick()
    showNotification(t('notifications.relicEquipped', { name: t(`inventoryItems.relics.${relic.id}.name`) || relic.name }), 'info')
  }

  const handleUnequipRelic = (slotId) => {
    setEquippedRelics((prev) => ({
      ...prev,
      [slotId]: null,
    }))
    soundManager.playClick()
    showNotification(t('notifications.relicUnequipped'), 'info')
  }

  // Consumable Handlers
  const handleCraftConsumable = (item) => {
    setResources((prev) => {
      const next = { ...prev }
      Object.entries(item.cost).forEach(([res, amt]) => {
        next[res] = Math.max(0, (next[res] || 0) - amt)
      })
      return next
    })

    setConsumables((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }))

    soundManager.playCollect()
    showNotification(t('notifications.itemCrafted', { name: t(`inventoryItems.consumables.${item.id}.name`) || item.name }), 'success')
  }

  const handleUseConsumable = (type) => {
    setConsumables((prev) => ({
      ...prev,
      [type]: Math.max(0, (prev[type] || 0) - 1),
    }))
  }

  // Queue soldiers for progressive training
  const handleQueueTroops = (unitId, count, costPerUnit, popPerUnit, trainTimeSec) => {
    const totalGold = (costPerUnit.gold || 0) * count
    const totalFood = (costPerUnit.food || 0) * count
    const totalGems = (costPerUnit.gems || 0) * count
    const totalPop = (popPerUnit || 1) * count

    if ((resources.gold || 0) < totalGold || (resources.food || 0) < totalFood || (resources.gems || 0) < totalGems) {
      showNotification(t('resources.insufficientResources') || 'Recursos insuficientes', 'warning')
      return
    }

    const currentPop = resources.populationUsed || 0
    const maxPop = resources.populationMax || 0
    if (currentPop + totalPop > maxPop) {
      showNotification(t('army.populationLimitReached') || '¡Límite de población alcanzado! Construye o mejora Casas.', 'warning')
      return
    }

    setResources((prev) => ({
      ...prev,
      gold: Math.max(0, prev.gold - totalGold),
      food: Math.max(0, prev.food - totalFood),
      gems: Math.max(0, (prev.gems || 0) - totalGems),
      populationUsed: (prev.populationUsed || 0) + totalPop,
    }))

    const newJob = {
      id: `train-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      unitId,
      count,
      completedCount: 0,
      durationPerUnit: trainTimeSec,
      unitStartedAt: trainingQueue.length === 0 ? Date.now() : null,
      costPerUnit,
      popPerUnit,
    }

    setTrainingQueue((prev) => {
      if (!prev || prev.length === 0) {
        return [{ ...newJob, unitStartedAt: Date.now() }]
      }
      return [...prev, newJob]
    })

    soundManager.playBuild?.()
    showNotification(t('army.troopsQueued', { count }) || `¡${count} soldados añadidos a la cola de adiestramiento!`, 'info')
  }

  // Cancel a training job from queue with resource & pop refund
  const handleCancelTrainingJob = (jobId) => {
    setTrainingQueue((prevQueue) => {
      const job = prevQueue.find((j) => j.id === jobId)
      if (!job) return prevQueue

      const remainingUnits = job.count - (job.completedCount || 0)
      if (remainingUnits > 0) {
        const refundGold = (job.costPerUnit?.gold || 0) * remainingUnits
        const refundFood = (job.costPerUnit?.food || 0) * remainingUnits
        const refundGems = (job.costPerUnit?.gems || 0) * remainingUnits
        const refundPop = (job.popPerUnit || 1) * remainingUnits

        setResources((prev) => ({
          ...prev,
          gold: prev.gold + refundGold,
          food: prev.food + refundFood,
          gems: (prev.gems || 0) + refundGems,
          populationUsed: Math.max(0, (prev.populationUsed || 0) - refundPop),
        }))
      }

      const nextQueue = prevQueue.filter((j) => j.id !== jobId)
      if (prevQueue[0]?.id === jobId && nextQueue.length > 0) {
        nextQueue[0] = {
          ...nextQueue[0],
          unitStartedAt: Date.now(),
        }
      }
      showNotification(t('army.trainingCancelled') || 'Entrenamiento cancelado. Recursos y población devueltos.', 'info')
      return nextQueue
    })
  }

  // Use hourglass speedup on the active training unit
  const handleSpeedupTraining = (speedupType = 'speedup_1m') => {
    if (!speedups[speedupType] || speedups[speedupType] <= 0) {
      showNotification(t('speedup.noSpeedupsAvailable') || 'No tienes relojes de arena disponibles.', 'warning')
      return
    }

    setSpeedups((prev) => ({
      ...prev,
      [speedupType]: Math.max(0, (prev[speedupType] || 0) - 1),
    }))

    const speedSec = speedupType === 'speedup_5m' ? 300 : (speedupType === 'speedup_15m' ? 900 : (speedupType === 'speedup_60m' ? 3600 : 60))

    setTrainingQueue((prev) => {
      if (!prev || prev.length === 0) return prev
      const active = prev[0]
      const currentStartedAt = active.unitStartedAt || Date.now()
      return [
        {
          ...active,
          unitStartedAt: currentStartedAt - (speedSec * 1000),
        },
        ...prev.slice(1),
      ]
    })

    soundManager.playSpeedup?.()
    showNotification(t('speedup.usedNotification') || '¡Tiempo de entrenamiento acelerado!', 'success')
  }

  // Instant finish 1 unit in active job using gems
  const handleInstantFinishTraining = (jobId, gemCost = 5) => {
    if ((resources.gems || 0) < gemCost) {
      showNotification(t('resources.insufficientGems') || 'Gemas insuficientes para adiestramiento instantáneo.', 'warning')
      return
    }

    setTrainingQueue((prevQueue) => {
      if (!prevQueue || prevQueue.length === 0) return prevQueue
      const activeJob = prevQueue[0]
      if (activeJob.id !== jobId) return prevQueue

      setResources((prev) => ({
        ...prev,
        gems: Math.max(0, prev.gems - gemCost),
      }))

      setTroops((prevTroops) => ({
        ...prevTroops,
        [activeJob.unitId]: (prevTroops[activeJob.unitId] || 0) + 1,
      }))

      addKingdomXp(30, t('notifications.xpRecruit') || 'Reclutamiento Militar')
      soundManager.playBuildComplete?.()
      showNotification(t('army.instantRecruited') || '¡Soldado adiestrado de inmediato con gemas!', 'success')

      const newCompleted = (activeJob.completedCount || 0) + 1
      if (newCompleted >= activeJob.count) {
        const remaining = prevQueue.slice(1)
        if (remaining.length > 0) {
          remaining[0] = {
            ...remaining[0],
            unitStartedAt: Date.now(),
          }
        }
        return remaining
      } else {
        return [
          {
            ...activeJob,
            completedCount: newCompleted,
            unitStartedAt: Date.now(),
          },
          ...prevQueue.slice(1),
        ]
      }
    })
  }

  // Handle citizen gift click
  const handleCitizenGift = (citizen, gift) => {
    if (gift.type === 'gems') {
      setResources((prev) => ({ ...prev, gems: prev.gems + gift.amount }))
    } else {
      setResources((prev) => ({ ...prev, gold: prev.gold + gift.amount }))
    }

    // 35% chance to discover a minor speedup
    if (Math.random() < 0.35) {
      setSpeedups((prev) => ({
        ...prev,
        speedup_1m: (prev.speedup_1m || 0) + 1,
      }))
      showNotification(t('notifications.citizenFoundHourglass', { name: citizen.name }), 'info')
    }

    triggerFlyToHud(citizen, null, { [gift.type]: gift.amount })
    showNotification(t('notifications.citizenGift', { name: citizen.name, gift: gift.text }), 'success')
  }

  // Monetization & Royal Bazaar Handlers
  const handleOpenShop = (tab = 'offers') => {
    setShopInitialTab(tab)
    setShopModalOpen(true)
  }

  const handleBuyGems = (pack) => {
    const totalGems = pack.gems + (pack.bonusGems || 0)
    setResources((prev) => ({
      ...prev,
      gems: prev.gems + totalGems,
    }))
    soundManager.playPurchaseFanfare()
    showNotification(t('notifications.gemsPurchased', { gems: totalGems }), 'success')
  }

  const handleBuyStarterPack = (pack) => {
    if (pack.id === 'starter_conqueror') {
      setResources((prev) => ({
        ...prev,
        gems: prev.gems + (pack.rewards?.gems || 0),
        gold: prev.gold + (pack.rewards?.gold || 0),
        wood: prev.wood + (pack.rewards?.wood || 0),
        stone: prev.stone + (pack.rewards?.stone || 0),
      }))
      if (pack.rewards?.troops?.commander) {
        setTroops((prev) => ({
          ...prev,
          commander: Math.max(prev.commander || 0, 1),
        }))
      }
      if (pack.rewards?.relics) {
        setOwnedRelicIds((prev) => {
          const next = [...prev]
          pack.rewards.relics.forEach((rId) => {
            if (!next.includes(rId)) next.push(rId)
          })
          return next
        })
        setEquippedRelics((prev) => ({
          ...prev,
          accessory: 'relic_emblema_leon',
        }))
      }
      if (pack.rewards?.consumables) {
        setConsumables((prev) => ({
          ...prev,
          health_potion: (prev.health_potion || 0) + (pack.rewards.consumables.health_potion || 0),
          fire_bomb: (prev.fire_bomb || 0) + (pack.rewards.consumables.fire_bomb || 0),
        }))
      }
      setVipStatus((prev) => ({ ...prev, starterPackClaimed: true }))
      soundManager.playPurchaseFanfare()
      showNotification(t('notifications.starterPackAcquired'), 'success')
    } else if (pack.id === 'bundle_war_alliance') {
      setResources((prev) => ({
        ...prev,
        gems: prev.gems + (pack.rewards?.gems || 0),
        gold: prev.gold + (pack.rewards?.gold || 0),
        wood: prev.wood + (pack.rewards?.wood || 0),
        stone: prev.stone + (pack.rewards?.stone || 0),
      }))
      if (pack.rewards?.troops) {
        setTroops((prev) => ({
          ...prev,
          infantry: (prev.infantry || 0) + (pack.rewards.troops.infantry || 0),
          archers: (prev.archers || 0) + (pack.rewards.troops.archers || 0),
          mages: (prev.mages || 0) + (pack.rewards.troops.mages || 0),
        }))
      }
      if (pack.rewards?.consumables) {
        setConsumables((prev) => ({
          ...prev,
          health_potion: (prev.health_potion || 0) + (pack.rewards.consumables.health_potion || 0),
          fire_bomb: (prev.fire_bomb || 0) + (pack.rewards.consumables.fire_bomb || 0),
        }))
      }
      setVipStatus((prev) => ({ ...prev, allianceBundleClaimed: true }))
      soundManager.playPurchaseFanfare()
      showNotification(t('notifications.allianceBundleActivated'), 'success')
    }
  }

  const handleActivateVipPerk = (perk) => {
    if (resources.gems < perk.priceGems) {
      showNotification(t('notifications.insufficientGemsForPerk'), 'warning')
      handleOpenShop('vault')
      return
    }

    setResources((prev) => ({
      ...prev,
      gems: prev.gems - perk.priceGems,
    }))

    if (perk.id === 'perk_second_builder') {
      setVipStatus((prev) => ({ ...prev, hasSecondBuilder: true }))
    } else if (perk.id === 'perk_harvest_horn') {
      setVipStatus((prev) => ({ ...prev, hasOneClickHarvest: true }))
    } else if (perk.id === 'perk_daily_blessing') {
      setVipStatus((prev) => ({ ...prev, hasDailyBlessing: true }))
      setResources((prev) => ({
        ...prev,
        gold: prev.gold + 5000,
        wood: prev.wood + 3000,
        stone: prev.stone + 3000,
        gems: prev.gems + 20,
      }))
    } else if (perk.id === 'perk_engineering') {
      setVipStatus((prev) => ({ ...prev, hasEngineering: true }))
    }

    soundManager.playPurchaseFanfare()
    showNotification(t('notifications.permanentPerkActivated', { name: t(`shopItems.perks.${perk.id}`) || perk.name }), 'success')
  }

  const handleSpinWheelReward = (prize, isFree) => {
    if (!prize) return

    const now = Date.now()
    setLastWheelFreeSpinTime(now)

    // Validate and record spin server-side in Supabase (enforces 20h cooldown and audits reward)
    claimWheelSpinOnServer(prize, isFree, isFree ? 0 : 15).catch((err) => {
      console.warn('Server wheel spin audit notice:', err)
    })

    const type = prize.type
    const amount = Number(prize.amount) || 1

    let nextRes = { ...resources }
    if (!isFree) {
      nextRes.gems = Math.max(0, (nextRes.gems || 0) - 15)
    }

    let nextTroops = { ...troops }
    let nextConsumables = { ...consumables }
    let nextSpeedups = { ...speedups }
    let nextRelics = [...ownedRelicIds]

    // 1. Standard Resources: gems, gold, wood, stone, food
    if (['gems', 'gold', 'wood', 'stone', 'food'].includes(type)) {
      nextRes[type] = (nextRes[type] || 0) + amount
      setResources(nextRes)
    } else if (!isFree) {
      setResources(nextRes)
    }

    // 2. Direct Troop types: infantry, archers, mages, commander
    if (['infantry', 'archers', 'mages', 'commander'].includes(type)) {
      nextTroops[type] = (nextTroops[type] || 0) + amount
      setTroops(nextTroops)
    }
    // 3. Generic troops type: 'troops'
    else if (type === 'troops' && prize.troopType) {
      nextTroops[prize.troopType] = (nextTroops[prize.troopType] || 0) + amount
      setTroops(nextTroops)
    }
    // 4. Direct Consumables: potion_heal, potion_focus, bomb_dwarf
    else if (['potion_heal', 'potion_focus', 'bomb_dwarf'].includes(type)) {
      nextConsumables[type] = (nextConsumables[type] || 0) + amount
      setConsumables(nextConsumables)
    }
    // 5. Generic consumable type: 'consumable'
    else if (type === 'consumable' && prize.item) {
      nextConsumables[prize.item] = (nextConsumables[prize.item] || 0) + amount
      setConsumables(nextConsumables)
    }
    // 6. Speedups: speedup_1m, speedup_5m, speedup_15m, speedup_1h
    else if (['speedup_1m', 'speedup_5m', 'speedup_15m', 'speedup_1h'].includes(type)) {
      nextSpeedups[type] = (nextSpeedups[type] || 0) + amount
      setSpeedups(nextSpeedups)
    }
    // 7. Relics
    else if (type === 'relic' && prize.relicId) {
      if (!nextRelics.includes(prize.relicId)) {
        nextRelics.push(prize.relicId)
        setOwnedRelicIds(nextRelics)
      }
    }

    // Synchronous immediate save to isolated account localStorage & Supabase Cloud
    gameStorage.save(buildSaveState({
      resources: nextRes,
      troops: nextTroops,
      consumables: nextConsumables,
      speedups: nextSpeedups,
      ownedRelicIds: nextRelics,
      lastWheelFreeSpinTime: now,
    }), true)

    soundManager.playPurchaseFanfare()
    const resolvedLabel = t(`shopItems.wheelPrizes.${prize.id}`) || prize.label
    showNotification(t('notifications.wheelPrizeReceived', { label: resolvedLabel }), 'success')
  }

  const handleSpeedupBuilding = (slot) => {
    const now = Date.now()
    const startedAt = slot.constructionStartedAt || now
    const durationSec = slot.constructionDurationSec || 60
    const elapsedSec = (now - startedAt) / 1000
    const remainingSec = Math.max(0, durationSec - elapsedSec)

    const freeThresholdSec = vipStatus.hasEngineering ? 300 : 180 // 5m VIP, 3m Free
    const isFree = remainingSec <= freeThresholdSec

    const costGems = isFree ? 0 : Math.max(2, Math.ceil(remainingSec / 50))

    if (!isFree && resources.gems < costGems) {
      showNotification(t('notifications.insufficientGemsForSpeedup', { cost: costGems }), 'warning')
      handleOpenShop('vault')
      return
    }

    if (!isFree) {
      setResources((prev) => ({
        ...prev,
        gems: prev.gems - costGems,
      }))
    }

    soundManager.stopConstructionAudio(slot.id)
    soundManager.playSpeedup()

    const newLevel = slot.targetLevel || slot.level || 1
    const bDef = BUILDING_TYPES[slot.buildingId?.toUpperCase()]

    const updatedSlots = slots.map((s) =>
      s.id === slot.id
        ? {
            ...s,
            isConstructing: false,
            progress: 100,
            level: newLevel,
            targetLevel: undefined,
            constructionStartedAt: undefined,
            constructionDurationSec: undefined,
            lastHarvestAt: Date.now(),
          }
        : s
    )

    setSlots(updatedSlots)

    // Synchronous immediate save
    gameStorage.save(buildSaveState({
      resources: isFree ? resources : { ...resources, gems: resources.gems - costGems },
      slots: updatedSlots,
    }), false)

    showNotification(
      isFree
        ? t('notifications.speedupFreeComplete', { name: t(`buildings.slots.${slot.buildingId}.name`) || bDef?.name || 'Building', level: newLevel })
        : t('notifications.speedupGemComplete', { name: t(`buildings.slots.${slot.buildingId}.name`) || bDef?.name || 'Building', cost: costGems }),
      'success'
    )
    addKingdomXp(75 * newLevel, t('notifications.xpSpeedup'))
    setDetailsModalOpen(false)
  }

  const handleUseSpeedup = (slotId, speedupId) => {
    const speedup = SPEEDUP_TYPES[speedupId]
    if (!speedup) return
    if ((speedups[speedupId] || 0) <= 0) {
      showNotification(t('notifications.noSpeedups'), 'warning')
      return
    }

    setSpeedups((prev) => ({
      ...prev,
      [speedupId]: Math.max(0, (prev[speedupId] || 0) - 1),
    }))

    soundManager.playSpeedup()

    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== slotId || !s.isConstructing) return s
        const now = Date.now()
        const newStartedAt = (s.constructionStartedAt || now) - (speedup.seconds * 1000)
        const durationSec = s.constructionDurationSec || 60
        const elapsedSec = (now - newStartedAt) / 1000

        if (elapsedSec >= durationSec) {
          soundManager.stopConstructionAudio(s.id)
          soundManager.playBuildComplete()
          const newLevel = s.targetLevel || s.level || 1
          const bDef = BUILDING_TYPES[s.buildingId?.toUpperCase()]
          showNotification(t('notifications.buildingCompletedWithSpeedup', { name: t(`buildings.slots.${s.buildingId}.name`) || bDef?.name || 'Building' }), 'success')
          addKingdomXp(75 * newLevel, t('notifications.xpSpeedupWork'))
          return {
            ...s,
            isConstructing: false,
            progress: 100,
            level: newLevel,
            targetLevel: undefined,
            constructionStartedAt: undefined,
            constructionDurationSec: undefined,
            lastHarvestAt: Date.now(),
          }
        }

        const nextProgress = Math.min(99, Math.floor((elapsedSec / durationSec) * 100))
        return {
          ...s,
          constructionStartedAt: newStartedAt,
          progress: nextProgress,
        }
      })
    )

    showNotification(t('notifications.speedupUsed', { label: speedup.label }), 'info')
  }

  const handleDungeonRevive = (costGems = 20) => {
    if (resources.gems < costGems) {
      showNotification(t('notifications.insufficientGemsForRevive'), 'warning')
      handleOpenShop('vault')
      return false
    }

    setResources((prev) => ({
      ...prev,
      gems: prev.gems - costGems,
    }))

    soundManager.playRevival()
    showNotification(t('notifications.secondChanceActivated'), 'success')
    return true
  }

  const isHarvestingAllRef = useRef(false)

  const handleOneClickHarvestAll = () => {
    if (isHarvestingAllRef.current) return
    isHarvestingAllRef.current = true
    setTimeout(() => {
      isHarvestingAllRef.current = false
    }, 1000)

    const readySlots = slots.filter((s) => s.buildingId && !s.isConstructing)
    if (readySlots.length === 0) {
      showNotification(t('notifications.noBuildingsProducing'), 'info')
      return
    }

    const now = Date.now()
    // Check if any building has at least 25% of its cycle accumulated
    const harvestableSlots = readySlots.filter((slot) => {
      const bDef = BUILDING_TYPES[slot.buildingId?.toUpperCase()]
      if (!bDef || !bDef.production) return false
      const cycleSec = (bDef.productionCycleSec || 120) * (vipStatus.hasEngineering ? 0.75 : 1)
      const lastHarvest = slot.lastHarvestAt || (now - 60000)
      const elapsedSec = Math.max(0, (now - lastHarvest) / 1000)
      return (elapsedSec / cycleSec) >= 0.25
    })

    if (harvestableSlots.length === 0) {
      showNotification(t('notifications.productionCycleWait'), 'info')
      return
    }

    const HARVEST_GEMS_COST = 5
    if (!vipStatus.hasOneClickHarvest) {
      if (resources.gems < HARVEST_GEMS_COST) {
        showNotification(t('notifications.unlockHeraldHorn'), 'warning')
        handleOpenShop('vip')
        return
      }
      setResources((prev) => ({ ...prev, gems: prev.gems - HARVEST_GEMS_COST }))
    }

    const vipHarvestBonus = vipStatus.hasOneClickHarvest ? 0.25 : 0
    const totalGained = { gold: 0, wood: 0, stone: 0, food: 0, gems: 0 }
    let totalXp = 0

    harvestableSlots.forEach((slot) => {
      const bDef = BUILDING_TYPES[slot.buildingId?.toUpperCase()]
      if (!bDef) return
      const lvl = slot.level || 1
      const prod = bDef.production || {}

      const cycleSec = (bDef.productionCycleSec || 120) * (vipStatus.hasEngineering ? 0.75 : 1)
      const maxBatches = getMaxProductionBatches(vipStatus.hasOneClickHarvest || vipStatus.hasEngineering)
      const lastHarvest = slot.lastHarvestAt || (now - 60000)
      const elapsedSec = Math.max(0, (now - lastHarvest) / 1000)
      const batchRatio = Math.min(maxBatches, elapsedSec / cycleSec)

      const goldMult = (1 + (unlockedTechIds.includes('tech-mines') ? 0.25 : 0) + (unlockedTechIds.includes('tech-logistics') ? 0.15 : 0) + (equippedRelics?.head === 'relic_corona_caos' ? 0.15 : 0) + (equippedRelics?.accessory === 'relic_emblema_leon' ? 0.20 : 0) + vipHarvestBonus) * batchRatio
      const woodMult = (1 + (unlockedTechIds.includes('tech-axes') ? 0.20 : 0) + (unlockedTechIds.includes('tech-logistics') ? 0.15 : 0) + vipHarvestBonus) * batchRatio
      const stoneMult = (1 + (unlockedTechIds.includes('tech-quarry') ? 0.25 : 0) + (unlockedTechIds.includes('tech-logistics') ? 0.15 : 0) + vipHarvestBonus) * batchRatio
      const foodMult = (1 + (unlockedTechIds.includes('tech-crops') ? 0.20 : 0) + (unlockedTechIds.includes('tech-logistics') ? 0.15 : 0) + (equippedRelics?.accessory === 'relic_amuleto_selva' ? 0.15 : 0) + vipHarvestBonus) * batchRatio

      if (prod.gold) totalGained.gold += Math.max(1, Math.round(prod.gold * lvl * goldMult))
      if (prod.wood) totalGained.wood += Math.max(1, Math.round(prod.wood * lvl * woodMult))
      if (prod.stone) totalGained.stone += Math.max(1, Math.round(prod.stone * lvl * stoneMult))
      if (prod.food) totalGained.food += Math.max(1, Math.round(prod.food * lvl * foodMult))
      if (prod.gems) totalGained.gems += Math.max(1, Math.round(prod.gems * lvl * Math.max(1, Math.floor(batchRatio))))

      totalXp += Math.max(5, Math.round(8 * lvl * Math.max(1, batchRatio)))
      triggerFlyToHud(slot, null, totalGained)
    })

    // Reset lastHarvestAt for harvested slots
    setSlots((prev) =>
      prev.map((s) =>
        harvestableSlots.some((hs) => hs.id === s.id)
          ? { ...s, lastHarvestAt: Date.now() }
          : s
      )
    )

    setResources((prev) => ({
      ...prev,
      gold: prev.gold + totalGained.gold,
      wood: prev.wood + totalGained.wood,
      stone: prev.stone + totalGained.stone,
      food: prev.food + totalGained.food,
      gems: prev.gems + totalGained.gems,
    }))

    soundManager.playCollect('gold')
    setTotalHarvests((h) => h + 1)
    // Pass empty string so addKingdomXp does NOT spawn a duplicate routine XP toast
    addKingdomXp(totalXp, '')

    const prefix = vipStatus.hasOneClickHarvest
      ? t('notifications.harvestHeraldHorn')
      : t('notifications.harvestMassive')

    if (harvestBufferRef.current.timer) {
      clearTimeout(harvestBufferRef.current.timer)
    }
    harvestBufferRef.current = {
      gold: 0,
      wood: 0,
      stone: 0,
      food: 0,
      gems: 0,
      xp: 0,
      count: 0,
      timer: null,
    }

    notifyHarvest(totalGained, totalXp, prefix)
  }

  // ============================================================
  // COMPETITIVE ARENA & PVP HANDLERS
  // ============================================================
  const handleOpenArena = (tab = 'pvp') => {
    setArenaInitialTab(tab)
    setCombatModeModalOpen(false)
    setArenaModalOpen(false)
    setCurrentScene('pvp')
  }

  const handleRefreshRivals = () => {
    setArenaData((prev) => ({
      ...prev,
      rivals: generateRivalsForPlayer(prev.trophies, kingdomLevel),
    }))
    showNotification(t('notifications.rivalsRefreshed'), 'info')
  }

  const handleStartArenaBattle = (rival) => {
    if (arenaData.tickets <= 0) {
      if (resources.gems < 10) {
        showNotification(t('notifications.noArenaTicketsOrGems'), 'warning')
        handleOpenShop('vault')
        return
      }
      setResources((prev) => ({ ...prev, gems: prev.gems - 10 }))
      showNotification(t('notifications.arenaTicketBought'), 'info')
    } else {
      setArenaData((prev) => ({ ...prev, tickets: Math.max(0, prev.tickets - 1) }))
    }

    setSelectedArenaRival(rival)
    setArenaModalOpen(false)
    setArenaBattleOpen(true)
    soundManager.playButtonClick()
  }

  const handleArenaBattleVictory = (rival, battleLoot) => {
    const loot = battleLoot || rival.rewards || {}
    const awardedTrophies = loot.trophies !== undefined ? loot.trophies : (rival.rewards?.trophies || 20)
    const oldLeague = getLeagueForTrophies(arenaData.trophies)
    const newTrophies = arenaData.trophies + awardedTrophies
    const newLeague = getLeagueForTrophies(newTrophies)

    if (newLeague.id !== oldLeague.id && newTrophies > arenaData.trophies) {
      soundManager.playRankUp?.()
      showNotification(t('notifications.leaguePromotion', { league: t(`arenaItems.leagues.${newLeague.id}`) || newLeague.name }), 'success')
    }

    const awardedHonor = (loot.honor !== undefined ? loot.honor : rival.rewards?.honor) || 25

    setArenaData((prev) => ({
      ...prev,
      trophies: newTrophies,
      honorPoints: prev.honorPoints + awardedHonor,
      rivals: generateRivalsForPlayer(newTrophies, kingdomLevel),
    }))

    const awardedGold = loot.gold !== undefined ? loot.gold : (rival.rewards?.gold || 0)
    const awardedStone = loot.stone !== undefined ? loot.stone : (rival.rewards?.stone || 0)
    const awardedWood = loot.wood || 0
    const awardedFood = loot.food || 0
    const awardedGems = loot.gems || 0
    const awardedShards = loot.celestialShards !== undefined ? loot.celestialShards : (rival.rewards?.celestialShards || 3)

    setResources((prev) => ({
      ...prev,
      gold: prev.gold + awardedGold,
      stone: prev.stone + awardedStone,
      wood: (prev.wood || 0) + awardedWood,
      food: (prev.food || 0) + awardedFood,
      gems: (prev.gems || 0) + awardedGems,
      celestialShards: (prev.celestialShards || 0) + awardedShards,
    }))

    // Award speedup token on victory (65% 5m, 35% 1m)
    const droppedSpeedup = Math.random() < 0.65 ? 'speedup_5m' : 'speedup_1m'
    setSpeedups((prev) => ({
      ...prev,
      [droppedSpeedup]: (prev[droppedSpeedup] || 0) + 1,
    }))

    addKingdomXp(80, t('notifications.xpSiege'))
    setArenaBattleOpen(false)
    showNotification(
      t('notifications.arenaVictory', { trophies: awardedTrophies, gold: awardedGold, stone: awardedStone ? ` | +${awardedStone} ${t('resources.stone')}` : '', honor: awardedHonor }),
      'success'
    )
    setTimeout(() => {
      gameStorage.flushCloud?.()
    }, 100)
  }

  const handleArenaBattleDefeat = (rival) => {
    const lostTrophies = Math.abs(rival?.rewards?.lossTrophies || 15)
    setArenaData((prev) => ({
      ...prev,
      trophies: Math.max(0, prev.trophies - lostTrophies),
      rivals: generateRivalsForPlayer(Math.max(0, prev.trophies - lostTrophies), kingdomLevel),
    }))
    setArenaBattleOpen(false)
    showNotification(t('notifications.arenaDefeat', { trophies: lostTrophies }), 'warning')
    setTimeout(() => {
      gameStorage.flushCloud?.()
    }, 100)
  }

  const handleArenaRevenge = (logEntry) => {
    const revengeRival = {
      id: `revenge_${logEntry.id}`,
      name: logEntry.attackerName,
      kingdom: logEntry.attackerKingdom || `Reino de ${logEntry.attackerName}`,
      level: Math.max(1, (kingdomLevel || 1) + Math.floor(Math.random() * 3) - 1),
      power: Math.round((logEntry.power || 350) * 1.1),
      avatar: logEntry.attackerAvatar || '/assets/avatars/avatar_king.webp',
      league: getLeagueForTrophies(arenaData.trophies),
      rewards: {
        gold: Math.round((logEntry.goldLost || 800) * 1.5),
        stone: 400,
        trophies: 28,
        honor: 45,
        lossTrophies: 10,
      },
    }

    handleStartArenaBattle(revengeRival)
  }

  const handleClaimHonorMilestone = (milestone) => {
    setArenaData((prev) => ({
      ...prev,
      claimedMilestones: [...(prev.claimedMilestones || []), milestone.id],
    }))

    setResources((prev) => ({
      ...prev,
      gems: prev.gems + (milestone.rewardGems || 0),
    }))

    if (milestone.rewardRelicId && !ownedRelicIds.includes(milestone.rewardRelicId)) {
      setOwnedRelicIds((prev) => [...prev, milestone.rewardRelicId])
    }

    soundManager.playPurchaseFanfare()
    showNotification(t('notifications.honorMilestoneClaimed', { name: milestone.name }), 'success')
    setTimeout(() => {
      gameStorage.flushCloud?.()
    }, 100)
  }

  const handleBuyArenaTicket = () => {
    if (resources.gems < 10) {
      showNotification(t('notifications.insufficientGemsForTickets'), 'warning')
      handleOpenShop('vault')
      return
    }

    setResources((prev) => ({ ...prev, gems: prev.gems - 10 }))
    setArenaData((prev) => ({ ...prev, tickets: Math.min(3, prev.tickets + 1) }))
    soundManager.playCollect()
    showNotification(t('notifications.arenaTicketPurchased'), 'success')
  }

  const handleBuyHonorItem = (item) => {
    if (arenaData.honorPoints < item.costHonor) {
      showNotification(t('notifications.insufficientHonorPoints'), 'warning')
      return
    }

    setArenaData((prev) => ({
      ...prev,
      honorPoints: prev.honorPoints - item.costHonor,
    }))

    if (item.type === 'relic') {
      if (!ownedRelicIds.includes(item.relicId)) {
        setOwnedRelicIds((prev) => [...prev, item.relicId])
        setEquippedRelics((prev) => ({ ...prev, accessory: item.relicId }))
      }
      showNotification(t('notifications.relicAcquiredEquipped', { name: item.name }), 'success')
    } else if (item.type === 'shield') {
      const addedDurationMs = item.durationHours * 3600 * 1000
      setArenaData((prev) => ({
        ...prev,
        peaceShieldUntil: Math.max(Date.now(), prev.peaceShieldUntil || 0) + addedDurationMs,
      }))
      showNotification(t('notifications.peaceShieldActivated', { hours: item.durationHours }), 'success')
    } else if (item.type === 'gems') {
      setResources((prev) => ({ ...prev, gems: prev.gems + item.amount }))
      showNotification(t('notifications.gemsReceived', { amount: item.amount }), 'success')
    } else if (item.type === 'chest') {
      setResources((prev) => ({
        ...prev,
        gold: prev.gold + (item.rewards.gold || 0),
        wood: prev.wood + (item.rewards.wood || 0),
        stone: prev.stone + (item.rewards.stone || 0),
        food: prev.food + (item.rewards.food || 0),
      }))
      if (item.rewards.troops) {
        setTroops((prev) => ({
          ...prev,
          infantry: (prev.infantry || 0) + (item.rewards.troops.infantry || 0),
          archers: (prev.archers || 0) + (item.rewards.troops.archers || 0),
          mages: (prev.mages || 0) + (item.rewards.troops.mages || 0),
        }))
      }
      showNotification(t('notifications.warChestOpened'), 'success')
    }

    soundManager.playPurchaseFanfare()
  }

  // Handle claiming competitive season rewards & applying trophy soft-reset
  const handleClaimSeasonRewards = () => {
    if (!pendingSeasonData) return
    const { seasonNumber, league, rewards, trophiesBefore, trophiesAfter } = pendingSeasonData

    // 1. Credit gold & gems
    setResources((prev) => ({
      ...prev,
      gold: prev.gold + (rewards.gold || 0),
      gems: prev.gems + (rewards.gems || 0),
    }))

    // 2. Credit bonus speedups if any
    if (rewards.bonusItems?.speedups) {
      setSpeedups((prev) => {
        const next = { ...prev }
        Object.entries(rewards.bonusItems.speedups).forEach(([k, v]) => {
          next[k] = (next[k] || 0) + v
        })
        return next
      })
    }

    // 3. Credit honor, reset trophies, and update claimed season tracking
    setArenaData((prev) => ({
      ...prev,
      trophies: trophiesAfter,
      honorPoints: (prev.honorPoints || 0) + (rewards.honor || 0),
      lastClaimedSeason: seasonNumber,
      lastSeasonProcessed: seasonNumber + 1,
    }))

    // 4. Server authoritative claim sync
    claimArenaSeasonRewardOnServer({
      seasonNumber,
      leagueId: league?.id || 'league_bronze',
      trophiesBefore,
      trophiesAfter,
      rewards,
    })

    showNotification(t('arena.seasonClaimSuccess') || '¡Recompensas de temporada reclamadas con éxito!', 'success')
    setSeasonEndModalOpen(false)
    setPendingSeasonData(null)
  }

  // Dynamic snapshot for quest evaluations
  const gameStateForQuests = {
    slots,
    troops,
    resources,
    kingdomLevel,
    kingdomXp,
    completedNodes,
    unlockedBiomes,
    totalHarvests,
  }

  // Evaluate all story quests in real time
  const evaluatedStoryQuests = STORY_QUESTS.map((q) => {
    const isClaimed = claimedQuestIds.includes(q.id)
    const evalResult = q.evaluate
      ? q.evaluate(gameStateForQuests)
      : { completed: false, current: 0, max: 1 }
    return {
      ...q,
      completed: isClaimed ? false : evalResult.completed,
      isClaimed,
      progress: evalResult.current,
      max: evalResult.max,
    }
  })

  // The active story quest is the first unclaimed quest in order
  const activeStoryQuest = evaluatedStoryQuests.find((q) => !q.isClaimed) || null
  const currentChapterNum = activeStoryQuest ? activeStoryQuest.chapter : 4
  const activeChapterData =
    CHAPTERS_DATA.find((c) => c.id === currentChapterNum) || CHAPTERS_DATA[0]
  const activeQuestProgress = activeStoryQuest
    ? {
        completed: activeStoryQuest.completed,
        current: activeStoryQuest.progress,
        max: activeStoryQuest.max,
      }
    : null

  // Dynamic Daily Quests evaluation
  // Check if daily quests need midnight reset
  const todayStr = new Date().toDateString()
  const lastResetStr = lastDailyReset ? new Date(lastDailyReset).toDateString() : ''
  if (todayStr !== lastResetStr) {
    // New day detected — will reset on next render cycle
    if (claimedDailyIds.length > 0) {
      setClaimedDailyIds([])
      setLastDailyReset(Date.now())
    }
  }

  const evaluatedDailyQuests = DAILY_QUESTS_TEMPLATE.map((dq) => {
    const isClaimed = claimedDailyIds.includes(dq.id)
    const evalResult = dq.evaluate
      ? dq.evaluate(gameStateForQuests)
      : { completed: false, current: 0, max: 1 }
    return {
      ...dq,
      completed: isClaimed ? false : evalResult.completed,
      isClaimed,
      progress: evalResult.current,
      max: evalResult.max,
    }
  })

  // Dynamic Epic Feats evaluation
  const evaluatedEpicFeats = EPIC_FEATS_TEMPLATE.map((ef) => {
    const isClaimed = claimedEpicIds.includes(ef.id)
    const evalResult = ef.evaluate
      ? ef.evaluate(gameStateForQuests)
      : { completed: false, current: 0, max: 1 }
    return {
      ...ef,
      completed: isClaimed ? false : evalResult.completed,
      isClaimed,
      progress: evalResult.current,
      max: evalResult.max,
    }
  })

  // Claim Quest (Story, Daily, or Epic)
  const handleClaimQuest = (questId) => {
    // Block claiming quests during interactive tutorial
    if (isTutorialActive && !welcomeModalOpen && !usernameModalOpen && hasStartedGame) {
      showNotification(t('tutorial.blockedInTutorial') || 'Completa o finaliza el tutorial con el Senescal primero.', 'warning')
      return
    }

    // Check story quest first
    const storyQ = STORY_QUESTS.find((item) => item.id === questId)
    if (storyQ) {
      if (claimedQuestIds.includes(questId)) return
      soundManager.playQuestSuccess()
      const nextClaimed = [...claimedQuestIds, questId]
      setClaimedQuestIds(nextClaimed)

      const nextRes = {
        ...resources,
        gold: resources.gold + (storyQ.reward.gold || 0),
        wood: resources.wood + (storyQ.reward.wood || 0),
        stone: resources.stone + (storyQ.reward.stone || 0),
        food: resources.food + (storyQ.reward.food || 0),
        gems: resources.gems + (storyQ.reward.gems || 0),
      }
      setResources(nextRes)

      if (storyQ.reward.xp) {
        addKingdomXp(storyQ.reward.xp, t('notifications.xpDecree', { title: t(`questData.story.${questId}.title`) || storyQ.title }))
      }

      // Guaranteed immediate real-time cloud save on quest claim
      gameStorage.save(buildSaveState({
        claimedQuestIds: nextClaimed,
        resources: nextRes,
      }), true)

      showNotification(t('notifications.storyQuestClaimed', { title: t(`questData.story.${questId}.title`) || storyQ.title }), 'success')
      return
    }

    // Check daily or epic
    const dailyQ = DAILY_QUESTS_TEMPLATE.find((d) => d.id === questId)
    if (dailyQ) {
      if (claimedDailyIds.includes(questId)) return
      soundManager.playQuestSuccess()
      const nextDaily = [...claimedDailyIds, questId]
      setClaimedDailyIds(nextDaily)
      const nextRes = {
        ...resources,
        gold: resources.gold + (dailyQ.reward.gold || 0),
        wood: resources.wood + (dailyQ.reward.wood || 0),
        food: resources.food + (dailyQ.reward.food || 0),
        gems: resources.gems + (dailyQ.reward.gems || 0),
      }
      setResources(nextRes)
      if (dailyQ.reward.xp) addKingdomXp(dailyQ.reward.xp, t(`questData.daily.${questId}.title`) || dailyQ.title)

      gameStorage.save(buildSaveState({
        claimedDailyIds: nextDaily,
        resources: nextRes,
      }), true)

      showNotification(t('notifications.dailyQuestClaimed', { title: t(`questData.daily.${questId}.title`) || dailyQ.title }), 'success')
      return
    }

    const epicQ = EPIC_FEATS_TEMPLATE.find((e) => e.id === questId)
    if (epicQ) {
      if (claimedEpicIds.includes(questId)) return
      soundManager.playQuestSuccess()
      const nextEpic = [...claimedEpicIds, questId]
      setClaimedEpicIds(nextEpic)
      const nextRes = {
        ...resources,
        gold: resources.gold + (epicQ.reward.gold || 0),
        gems: resources.gems + (epicQ.reward.gems || 0),
      }
      setResources(nextRes)
      if (epicQ.reward.xp) addKingdomXp(epicQ.reward.xp, t(`questData.epic.${questId}.title`) || epicQ.title)

      gameStorage.save(buildSaveState({
        claimedEpicIds: nextEpic,
        resources: nextRes,
      }), true)

      showNotification(t('notifications.epicFeatClaimed', { title: t(`questData.epic.${questId}.title`) || epicQ.title }), 'success')
    }
  }

  // Dispatch Expedition & collect spoils
  const handleLaunchExpedition = (exp) => {
    if (exp?.rewards) {
      setResources((prev) => ({
        ...prev,
        gold: prev.gold + (exp.rewards.gold || 0),
        wood: prev.wood + (exp.rewards.wood || 0),
        stone: prev.stone + (exp.rewards.stone || 0),
        gems: prev.gems + (exp.rewards.gems || 0),
      }))
    }
    addKingdomXp(120, t('notifications.xpExpedition'))
    showNotification(t('notifications.expeditionSuccess', { name: exp.name }), 'success')
    setExpeditionModalOpen(false)
  }

  // Open Dungeon Campaign Window
  const handleOpenDungeonCombat = (_exp = null) => {
    setExpeditionModalOpen(false)
    setCampaignWindowOpen(true)
  }

  // Handle Campaign Loot Claim on window exit
  const handleCampaignClaimLoot = (loot) => {
    if (loot) {
      setResources((prev) => ({
        ...prev,
        gold: prev.gold + (loot.gold || 0),
        wood: prev.wood + (loot.wood || 0),
        stone: prev.stone + (loot.stone || 0),
        gems: prev.gems + (loot.gems || 0),
      }))
      if (loot.gold > 0 || loot.wood > 0 || loot.stone > 0 || loot.gems > 0) {
        showNotification(
          t('notifications.campaignLoot', { gold: loot.gold, wood: loot.wood, stone: loot.stone, gems: loot.gems }),
          'success'
        )
      }
    }
  }

  // Handle Combat Retreat Penalty (Campañas, Mazmorras y Arena)
  const handleCombatRetreatCost = (cost) => {
    if (!cost) return
    const goldPenalty = cost.gold || 0
    const foodPenalty = cost.food || 0
    setResources((prev) => ({
      ...prev,
      gold: Math.max(0, (prev.gold || 0) - goldPenalty),
      food: Math.max(0, (prev.food || 0) - foodPenalty),
    }))
    showNotification(
      t('notifications.tacticalRetreat', { gold: goldPenalty, food: foodPenalty }),
      'warning'
    )
  }

  // Handle Campaign Node Defeated (XP & Victory)
  const handleNodeDefeated = (node) => {
    const xpReward = node.tier === 3 ? 500 : node.tier === 2 ? 300 : 180
    const nodeSpeedup = node.tier === 3 ? 'speedup_60m' : node.tier === 2 ? 'speedup_15m' : 'speedup_5m'
    setSpeedups((prev) => ({
      ...prev,
      [nodeSpeedup]: (prev[nodeSpeedup] || 0) + 1,
    }))
    addKingdomXp(xpReward, t('notifications.xpVictoryNode', { name: node.name }))
    showNotification(t('notifications.nodeDefeated', { name: node.name, xp: xpReward, speedupName: t(`speedups.${nodeSpeedup}.name`) || SPEEDUP_TYPES[nodeSpeedup].name, speedupLabel: t(`speedups.${nodeSpeedup}.label`) || SPEEDUP_TYPES[nodeSpeedup].label }), 'success')
  }

  // Handle Level Up Reward Claim
  const handleClaimLevelUpRewards = (reward) => {
    if (reward) {
      setResources((prev) => ({
        ...prev,
        gold: prev.gold + (reward.gold || 0),
        gems: prev.gems + (reward.gems || 0),
        wood: prev.wood + (reward.wood || 0),
        stone: prev.stone + (reward.stone || 0),
      }))
      showNotification(
        t('notifications.levelUpTributeClaimed', { gold: reward.gold, gems: reward.gems }),
        'success'
      )
      setTimeout(() => {
        gameStorage.flushCloud?.()
      }, 100)
    }
  }

  // Handle Offline Earnings Collection
  const handleCollectOfflineEarnings = (earnings) => {
    if (earnings) {
      setResources((prev) => ({
        ...prev,
        gold: prev.gold + (earnings.gold || 0),
        wood: prev.wood + (earnings.wood || 0),
        stone: prev.stone + (earnings.stone || 0),
        food: prev.food + (earnings.food || 0),
        gems: prev.gems + (earnings.gems || 0),
      }))
      const parts = []
      if (earnings.gold) parts.push(`+${earnings.gold} ${t('resources.gold')}`)
      if (earnings.wood) parts.push(`+${earnings.wood} ${t('resources.wood')}`)
      if (earnings.stone) parts.push(`+${earnings.stone} ${t('resources.stone')}`)
      if (earnings.food) parts.push(`+${earnings.food} ${t('resources.food')}`)
      if (earnings.gems) parts.push(`+${earnings.gems} ${t('resources.gems')}`)
      showNotification(
        t('notifications.offlineTributesCollected', { parts: parts.join(', ') }),
        'success'
      )
      setTimeout(() => {
        gameStorage.flushCloud?.()
      }, 100)
    }
    setOfflineModalOpen(false)
  }

  // Handle Dungeon Victory for old modal fallback
  const handleDungeonVictory = (rewards) => {
    if (rewards) {
      setResources((prev) => ({
        ...prev,
        gold: prev.gold + (rewards.gold || 0),
        wood: prev.wood + (rewards.wood || 0),
        stone: prev.stone + (rewards.stone || 0),
        gems: prev.gems + (rewards.gems || 0),
      }))
      addKingdomXp(200, t('notifications.xpDungeon'))
      showNotification(t('notifications.dungeonVictory'), 'success')
    }
    setDungeonCombatOpen(false)
  }

  // Tutorial Completion & Skip Handlers
  const handleCompleteTutorial = (reward = { gold: 500, wood: 300, gems: 20 }) => {
    const activeEmail = gameStorage.getEmail()
    const accountKey = getTutorialAccountKey(activeEmail)
    setIsTutorialActive(false)
    setTutorialSeen(true)
    localStorage.setItem(accountKey, 'true')
    localStorage.setItem('toc_tutorial_completed', 'true')
    const nextRes = {
      ...resources,
      gold: (resources.gold || 0) + (reward.gold || 500),
      wood: (resources.wood || 0) + (reward.wood || 300),
      gems: (resources.gems || 0) + (reward.gems || 20),
    }
    setResources(nextRes)
    addKingdomXp(150, t('notifications.xpGraduation'))
    showNotification(t('notifications.tutorialCompleted'), 'success')
    gameStorage.save(buildSaveState({
      resources: nextRes,
      tutorialSeen: true,
    }), true)
  }

  const handleSkipTutorial = () => {
    const activeEmail = gameStorage.getEmail()
    const accountKey = getTutorialAccountKey(activeEmail)
    setIsTutorialActive(false)
    setTutorialSeen(true)
    localStorage.setItem(accountKey, 'true')
    localStorage.setItem('toc_tutorial_completed', 'true')
    showNotification(t('notifications.tutorialSkipped'), 'info')
  }

  // Reset kingdom state completely (Clean new game with ONLY Castle on Slot 1)
  const handleResetGame = () => {
    gameStorage.clear()
    const activeEmail = gameStorage.getEmail()
    const defaultName = activeEmail ? '' : 'Lord King'
    
    setPlayerName(defaultName)
    setPlayerAvatar('/assets/avatars/avatar_king.webp')
    if (activeEmail) {
      localStorage.removeItem(`toc_player_name_${activeEmail}`)
      localStorage.removeItem(`toc_player_avatar_${activeEmail}`)
    } else {
      localStorage.setItem('toc_player_name', 'Lord King')
    }

    setResources(INITIAL_RESOURCES)
    setSlots(INITIAL_PLAZA_SLOTS)
    setTroops({ infantry: 1, archers: 0, mages: 0, commander: 0 })
    setTrainingQueue([])
    setKingdomXp(0)
    setClaimedQuestIds([])
    setClaimedDailyIds([])
    setClaimedEpicIds([])
    setLastDailyReset(Date.now())
    setCompletedNodes([])
    setUnlockedBiomes(['biome-1'])
    setUnlockedTechIds([])
    setOwnedRelicIds([])
    setEquippedRelics({ head: null, weapon: null, accessory: null })
    setConsumables({ potion_heal: 1, potion_focus: 1, bomb_dwarf: 0 })
    setTotalHarvests(0)
    setArenaData({
      trophies: 250,
      tickets: 3,
      lastTicketRegenTime: Date.now(),
      honorPoints: 120,
      peaceShieldUntil: 0,
      defenseLog: INITIAL_DEFENSE_LOG,
      rivals: null,
      lastSeasonProcessed: getCurrentSeasonData().seasonNumber,
      lastClaimedSeason: 0,
    })
    setSpeedups({
      speedup_1m: 4,
      speedup_5m: 2,
      speedup_15m: 1,
      speedup_60m: 0,
    })
    setVipStatus({
      hasSecondBuilder: false,
      hasOneClickHarvest: false,
      hasDailyBlessing: false,
      hasEngineering: false,
      starterPackClaimed: false,
      allianceBundleClaimed: false,
    })
    const accountKey = getTutorialAccountKey(activeEmail)
    localStorage.removeItem(accountKey)
    localStorage.removeItem('toc_tutorial_completed')
    setTutorialSeen(false)
    setTutorialKey((k) => k + 1)
    setIsTutorialActive(true)
    setWelcomeModalOpen(true)

    // Save pristine clean state immediately to both Local Storage AND Supabase Cloud
    const cleanState = {
      resources: INITIAL_RESOURCES,
      slots: INITIAL_PLAZA_SLOTS,
      troops: { infantry: 1, archers: 0, mages: 0, commander: 0 },
      trainingQueue: [],
      kingdomLevel: 1,
      kingdomXp: 0,
      completedNodes: [],
      unlockedBiomes: ['biome-1'],
      claimedQuestIds: [],
      claimedDailyIds: [],
      claimedEpicIds: [],
      lastDailyReset: Date.now(),
      unlockedTechIds: [],
      ownedRelicIds: [],
      equippedRelics: { head: null, weapon: null, accessory: null },
      consumables: { potion_heal: 1, potion_focus: 1, bomb_dwarf: 0 },
      speedups: {
        speedup_1m: 4,
        speedup_5m: 2,
        speedup_15m: 1,
        speedup_60m: 0,
      },
      vipStatus: {
        hasSecondBuilder: false,
        hasOneClickHarvest: false,
        hasDailyBlessing: false,
        hasEngineering: false,
        starterPackClaimed: false,
        allianceBundleClaimed: false,
      },
      lastWheelFreeSpinTime: 0,
      arenaData: {
        trophies: 250,
        tickets: 3,
        lastTicketRegenTime: Date.now(),
        honorPoints: 120,
        peaceShieldUntil: 0,
        defenseLog: INITIAL_DEFENSE_LOG,
        rivals: null,
        lastSeasonProcessed: getCurrentSeasonData().seasonNumber,
        lastClaimedSeason: 0,
      },
      totalHarvests: 0,
      tutorialSeen: false,
      profile: {
        name: defaultName || 'Lord King',
        avatar: '/assets/avatars/avatar_king.webp',
        email: activeEmail || null,
      },
      lastSavedTime: Date.now(),
    }
    gameStorage.save(cleanState, true)

    showNotification(t('notifications.kingdomReset'), 'success')
  }

  // Expose reset helper globally ONLY in development mode (completely stripped in production)
  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      window.resetKingdom = handleResetGame
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.resetKingdom
      }
    }
  }, [handleResetGame])

  // Logout: save current state, flush to cloud, and cleanly purge React state
  const handleLogout = async () => {
    // 1. Flush any pending saves immediately to cloud and local for the active account
    const currentState = buildSaveState()
    gameStorage.save(currentState, true)
    await gameStorage.flushCloud?.()

    // 2. Stop music
    soundManager.stopBGM?.()

    // 3. Purge session context
    gameStorage.purgeSession()

    // 4. Clean React memory state so no data leaks into the next account
    setResources(INITIAL_RESOURCES)
    setSlots(INITIAL_PLAZA_SLOTS)
    setTroops({ infantry: 1, archers: 0, mages: 0, commander: 0 })

    setKingdomXp(0)
    setClaimedQuestIds([])
    setClaimedDailyIds([])
    setClaimedEpicIds([])
    setLastDailyReset(Date.now())
    setCompletedNodes([])
    setUnlockedBiomes(['biome-1'])
    setUnlockedTechIds([])
    setOwnedRelicIds([])
    setEquippedRelics({ head: null, weapon: null, accessory: null })
    setConsumables({ potion_heal: 1, potion_focus: 1, bomb_dwarf: 0 })
    setSpeedups({ speedup_1m: 4, speedup_5m: 2, speedup_15m: 1, speedup_60m: 0 })
    setVipStatus({
      hasSecondBuilder: false,
      hasOneClickHarvest: false,
      hasDailyBlessing: false,
      hasEngineering: false,
      starterPackClaimed: false,
      allianceBundleClaimed: false,
    })
    setTotalHarvests(0)
    setPlayerName('')
    setPlayerAvatar('/assets/avatars/avatar_king.webp')
    setWelcomeModalOpen(false)
    setIsTutorialActive(false)
    setTutorialSeen(false)
    setOfflineEarnings(null)
    setOfflineModalOpen(false)

    // 5. Return to start screen
    setHasStartedGame(false)
    showNotification(t('notifications.sessionClosed'), 'info')
  }

  // Manual instant save (Local + Supabase Cloud)
  const handleManualSave = async () => {
    const currentState = {
      resources,
      slots,
      troops,
      kingdomLevel,
      kingdomXp,
      completedNodes,
      unlockedBiomes,
      claimedQuestIds,
      unlockedTechIds,
      ownedRelicIds,
      equippedRelics,
      consumables,
      speedups,
      vipStatus,
      lastWheelFreeSpinTime,
      arenaData,
      totalHarvests,
      claimedDailyIds,
      claimedEpicIds,
      lastDailyReset,
      tutorialSeen: !welcomeModalOpen,
    }
    await gameStorage.save(currentState, true)
    showNotification(t('notifications.empireSaved'), 'success')
  }

  // Count pending quests that can be claimed
  const pendingStoryCount = evaluatedStoryQuests.filter((q) => q.completed).length
  const pendingDailyCount = evaluatedDailyQuests.filter((q) => q.completed).length
  const totalPendingQuests = pendingStoryCount + pendingDailyCount

  // Check if daily free spin on the lucky wheel is ready (every 20 hours or fresh start)
  const isWheelFreeSpinReady = ((Date.now() - (lastWheelFreeSpinTime || 0)) / (1000 * 3600)) >= 20

  return (
    <div className={`toc-game-app ${isCinematicMode ? 'is-cinematic-mode' : ''} ${isAnyModalOpen ? 'has-active-modal' : ''}`}>
      {/* Floating Restore HUD Banner in Cinematic Mode */}
      {isCinematicMode && (
        <div className="cinematic-mode-banner">
          <button 
            className="btn-exit-cinematic"
            onClick={() => {
              soundManager.playClick()
              setIsCinematicMode(false)
            }}
            title={t('hud.freeModeExit')}
          >
            <EyeOff size={18} />
            <span>{t('hud.freeModeExit')}</span>
          </button>
        </div>
      )}

      {/* Superimposed Top Realtime FPS Performance Counter */}
      <FpsOverlay fpsMode={fpsMode} />

      {/* Top HUD */}
      {hasStartedGame && currentScene === 'kingdom' && (
        <TopBar 
          resources={resources} 
          soundEnabled={soundEnabled} 
          onToggleSound={handleToggleSound}
          onOpenProfile={() => setProfileModalOpen(true)}
          onOpenMenu={() => setMenuModalOpen(true)}
          onOpenShop={handleOpenShop}
          onOpenArena={() => handleOpenArena('pvp')}
          onOpenRanking={handleOpenRanking}
          trophies={arenaData.trophies}
          peaceShieldUntil={arenaData.peaceShieldUntil}
          onOneClickHarvest={handleOneClickHarvestAll}
          onOpenHarvestModal={() => setHarvestModalOpen(true)}
          hasOneClickHarvest={vipStatus.hasOneClickHarvest}
          kingdomLevel={kingdomLevel}
          kingdomXp={kingdomXp}
          xpProgress={xpProgress}
          storageCapacity={storageCapacity}
          poppingResource={poppingResource}
          onToggleCinematic={() => setIsCinematicMode((prev) => !prev)}
          isCinematicMode={isCinematicMode}
          playerName={playerName || t('common.sovereign')}
          playerAvatar={playerAvatar}
          onOpenChangeName={() => setUsernameModalOpen(true)}
          isTutorialActive={isTutorialRunning}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          questHeraldNode={
            hasStartedGame && !isCinematicMode ? (
              <QuestHerald 
                activeQuest={activeStoryQuest}
                chapterData={activeChapterData}
                questProgress={activeQuestProgress}
                onClaimQuest={handleClaimQuest}
                onOpenBuild={handleOpenBuildMenu}
                onOpenArmy={() => setArmyModalOpen(true)}
                onOpenCampaign={() => setCampaignWindowOpen(true)}
                onOpenQuestsModal={() => setQuestsModalOpen(true)}
                onOpenProfile={() => setProfileModalOpen(true)}
                forceExpanded={isTutorialActive}
                isTutorialActive={isTutorialRunning}
              />
            ) : null
          }
          notificationBellNode={
            <NotificationBell 
              notifications={notificationHistory}
              onClearNotifications={handleClearNotifications}
              isOpen={notificationsModalOpen}
              onOpenChange={setNotificationsModalOpen}
            />
          }
          toastDockNode={
            hasStartedGame ? (
              <div className="game-notifications-dock" aria-live="polite">
                {notifications.map((n) => (
                  <SwipeableToast
                    key={n.id}
                    toast={n}
                    onDismiss={handleDismissNotification}
                  />
                ))}
              </div>
            ) : null
          }
        />
      )}

      {/* Main Interactive Game World Canvas */}
      <main className="game-main-viewport">
        <GameWorld 
          slots={slots}
          vipStatus={vipStatus}
          activeStoryQuest={activeStoryQuest}
          onSelectSlot={handleSelectSlot}
          onOpenBuildMenu={handleOpenBuildMenu}
          onCollectFromSlot={handleCollectFromSlot}
          onCitizenGift={handleCitizenGift}
          onSpeedupBuilding={handleSpeedupBuilding}
          onToggleCinematic={() => setIsCinematicMode((prev) => !prev)}
          isCinematicMode={isCinematicMode}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          fpsMode={fpsMode}
          isSuspended={isAnyModalOpen || campaignWindowOpen || dungeonCombatOpen || arenaBattleOpen || currentScene === 'pvp'}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </main>

      {/* Lateral Events & Deals Dock (Royal Messenger, Daily Roulette, Starter Pack) */}
      {hasStartedGame && currentScene === 'kingdom' && !isCinematicMode && !isAnyModalOpen && (
        <aside className="hud-lateral-events-dock" aria-label="Avisos y Ofertas">
          <EventBadge 
            activeEvent={activeEvent}
            onExpire={() => {
              setActiveEvent(null)
              setEventModalOpen(false)
            }}
            onClick={() => setEventModalOpen(true)}
            onDismiss={() => setActiveEvent(null)}
          />
          <RouletteNotification 
            isFreeSpinReady={isWheelFreeSpinReady}
            onOpenWheel={() => handleOpenShop('wheel')}
          />
          <StarterPackBanner 
            claimed={vipStatus.starterPackClaimed}
            onOpenOffer={() => handleOpenShop('offers')}
          />
        </aside>
      )}

      {/* Bottom-Left Kingdom Button & Chat Button */}
      {hasStartedGame && currentScene === 'kingdom' && !isCinematicMode && !isAnyModalOpen && (
        <LeftActionControls 
          onOpenKingdom={() => setKingdomHubModalOpen(true)}
          onOpenChat={() => setChatModalOpen(true)}
          questPendingCount={totalPendingQuests}
          wheelFreeSpinReady={isWheelFreeSpinReady}
          isTutorialActive={isTutorialRunning}
        />
      )}

      {/* Bottom-Right Battle & Settings Action Controls (Swapped with Kingdom) */}
      {hasStartedGame && currentScene === 'kingdom' && !isCinematicMode && !isAnyModalOpen && (
        <RightActionControls 
          onOpenBattle={() => setCombatModeModalOpen(true)}
          onOpenSettings={() => setMenuModalOpen(true)}
          arenaTickets={arenaData.tickets}
          isTutorialActive={isTutorialRunning}
        />
      )}

      {/* Lateral Ranking Button (Kept in Place) */}
      {hasStartedGame && currentScene === 'kingdom' && !isCinematicMode && !isAnyModalOpen && (
        <RankingLateralButton 
          onOpenRanking={handleOpenRanking}
          trophies={arenaData.trophies}
          peaceShieldUntil={arenaData.peaceShieldUntil}
          isTutorialActive={isTutorialRunning}
        />
      )}

      {/* Lateral Store Button (Placed Next to Ranking) */}
      {hasStartedGame && currentScene === 'kingdom' && !isCinematicMode && !isAnyModalOpen && (
        <StoreLateralButton 
          onOpenShop={() => handleOpenShop('offers')}
          wheelFreeSpinReady={isWheelFreeSpinReady}
          isTutorialActive={isTutorialRunning}
        />
      )}

      {/* Lateral Inventory Button (Placed Next to Store) */}
      {hasStartedGame && currentScene === 'kingdom' && !isCinematicMode && !isAnyModalOpen && (
        <InventoryLateralButton 
          onOpenInventory={() => setInventoryModalOpen(true)}
          itemCount={(ownedRelicIds?.length || 0) + Object.values(consumables || {}).reduce((acc, v) => acc + (typeof v === 'number' ? v : 0), 0)}
          isTutorialActive={isTutorialRunning}
        />
      )}

      {/* Dedicated Fullscreen PvP Scene */}
      {currentScene === 'pvp' && (
        <PvpScene 
          onBack={() => setCurrentScene('kingdom')}
          resources={resources}
          arenaData={arenaData}
          playerName={playerName}
          playerAvatar={playerAvatar}
          kingdomLevel={kingdomLevel}
          troops={troops}
          onStartBattle={handleStartArenaBattle}
          onRefreshRivals={handleRefreshRivals}
          showNotification={showNotification}
        />
      )}

      {/* Floating Toast Notifications Dock while in PvP Scene */}
      {currentScene === 'pvp' && hasStartedGame && (
        <div className="game-notifications-dock" aria-live="polite">
          {notifications.map((n) => (
            <SwipeableToast
              key={n.id}
              toast={n}
              onDismiss={handleDismissNotification}
            />
          ))}
        </div>
      )}

      {/* Centralized Asynchronous Modal Host (React.lazy Code Splitting) */}
      <ModalHost
        combatModeModalOpen={combatModeModalOpen}
        setCombatModeModalOpen={setCombatModeModalOpen}
        kingdomHubModalOpen={kingdomHubModalOpen}
        setKingdomHubModalOpen={setKingdomHubModalOpen}
        chatModalOpen={chatModalOpen}
        setChatModalOpen={setChatModalOpen}
        campaignWindowOpen={campaignWindowOpen}
        setCampaignWindowOpen={setCampaignWindowOpen}
        buildModalOpen={buildModalOpen}
        setBuildModalOpen={setBuildModalOpen}
        detailsModalOpen={detailsModalOpen}
        setDetailsModalOpen={setDetailsModalOpen}
        questsModalOpen={questsModalOpen}
        setQuestsModalOpen={setQuestsModalOpen}
        armyModalOpen={armyModalOpen}
        setArmyModalOpen={setArmyModalOpen}
        welcomeModalOpen={welcomeModalOpen}
        setWelcomeModalOpen={setWelcomeModalOpen}
        expeditionModalOpen={expeditionModalOpen}
        setExpeditionModalOpen={setExpeditionModalOpen}
        dungeonCombatOpen={dungeonCombatOpen}
        setDungeonCombatOpen={setDungeonCombatOpen}
        menuModalOpen={menuModalOpen}
        setMenuModalOpen={setMenuModalOpen}
        profileModalOpen={profileModalOpen}
        setProfileModalOpen={setProfileModalOpen}
        levelUpModalOpen={levelUpModalOpen}
        setLevelUpModalOpen={setLevelUpModalOpen}
        offlineModalOpen={offlineModalOpen}
        setOfflineModalOpen={setOfflineModalOpen}
        eventModalOpen={eventModalOpen}
        setEventModalOpen={setEventModalOpen}
        techTreeModalOpen={techTreeModalOpen}
        setTechTreeModalOpen={setTechTreeModalOpen}
        inventoryModalOpen={inventoryModalOpen}
        setInventoryModalOpen={setInventoryModalOpen}
        shopModalOpen={shopModalOpen}
        setShopModalOpen={setShopModalOpen}
        arenaModalOpen={arenaModalOpen}
        setArenaModalOpen={setArenaModalOpen}
        seasonEndModalOpen={seasonEndModalOpen}
        setSeasonEndModalOpen={setSeasonEndModalOpen}
        arenaBattleOpen={arenaBattleOpen}
        setArenaBattleOpen={setArenaBattleOpen}
        rankingModalOpen={rankingModalOpen}
        setRankingModalOpen={setRankingModalOpen}
        harvestModalOpen={harvestModalOpen}
        setHarvestModalOpen={setHarvestModalOpen}
        usernameModalOpen={usernameModalOpen}
        setUsernameModalOpen={setUsernameModalOpen}
        resources={resources}
        slots={slots}
        troops={troops}
        trainingQueue={trainingQueue}
        speedups={speedups}
        vipStatus={vipStatus}
        arenaData={arenaData}
        completedNodes={completedNodes}
        setCompletedNodes={setCompletedNodes}
        unlockedBiomes={unlockedBiomes}
        setUnlockedBiomes={setUnlockedBiomes}
        unlockedTechIds={unlockedTechIds}
        ownedRelicIds={ownedRelicIds}
        equippedRelics={equippedRelics}
        consumables={consumables}
        kingdomLevel={kingdomLevel}
        kingdomXp={kingdomXp}
        xpProgress={xpProgress}
        storageCapacity={storageCapacity}
        currentLevelDef={currentLevelDef}
        levelUpInfo={levelUpInfo}
        playerName={playerName}
        playerAvatar={playerAvatar}
        soundEnabled={soundEnabled}
        fpsMode={fpsMode}
        particlesEnabled={particlesEnabled}
        selectedSlot={selectedSlot}
        recommendedBuildId={recommendedBuildId}
        setRecommendedBuildId={setRecommendedBuildId}
        evaluatedStoryQuests={evaluatedStoryQuests}
        evaluatedDailyQuests={evaluatedDailyQuests}
        evaluatedEpicFeats={evaluatedEpicFeats}
        activeChapterData={activeChapterData}
        currentChapterNum={currentChapterNum}
        activeStoryQuest={activeStoryQuest}
        activeEvent={activeEvent}
        offlineEarnings={offlineEarnings}
        pendingSeasonData={pendingSeasonData}
        selectedArenaRival={selectedArenaRival}
        arenaInitialTab={arenaInitialTab}
        shopInitialTab={shopInitialTab}
        rankingCategory={rankingCategory}
        totalPendingQuests={totalPendingQuests}
        isWheelFreeSpinReady={isWheelFreeSpinReady}
        lastWheelFreeSpinTime={lastWheelFreeSpinTime}
        hasStartedGame={hasStartedGame}
        tutorialSeen={tutorialSeen}
        setTutorialSeen={setTutorialSeen}
        setTutorialKey={setTutorialKey}
        setIsTutorialActive={setIsTutorialActive}
        getTutorialAccountKey={getTutorialAccountKey}
        handleOpenArena={handleOpenArena}
        handleOpenBuildMenu={handleOpenBuildMenu}
        handleOpenShop={handleOpenShop}
        handleOpenRanking={handleOpenRanking}
        handleCampaignClaimLoot={handleCampaignClaimLoot}
        handleCombatRetreatCost={handleCombatRetreatCost}
        handleNodeDefeated={handleNodeDefeated}
        handleUseConsumable={handleUseConsumable}
        handleObtainRelic={handleObtainRelic}
        handleDungeonRevive={handleDungeonRevive}
        handleSelectBuilding={handleSelectBuilding}
        handleUpgradeBuilding={handleUpgradeBuilding}
        handleDemolishBuilding={handleDemolishBuilding}
        handleCollectFromSlot={handleCollectFromSlot}
        handleSpeedupBuilding={handleSpeedupBuilding}
        handleUseSpeedup={handleUseSpeedup}
        handleClaimQuest={handleClaimQuest}
        handleQueueTroops={handleQueueTroops}
        handleCancelTrainingJob={handleCancelTrainingJob}
        handleSpeedupTraining={handleSpeedupTraining}
        handleInstantFinishTraining={handleInstantFinishTraining}
        handleLaunchExpedition={handleLaunchExpedition}
        handleOpenDungeonCombat={handleOpenDungeonCombat}
        handleDungeonVictory={handleDungeonVictory}
        handleToggleSound={handleToggleSound}
        handleResetGame={handleResetGame}
        handleManualSave={handleManualSave}
        handleLogout={handleLogout}
        showNotification={showNotification}
        handleSetFpsMode={handleSetFpsMode}
        handleToggleParticles={handleToggleParticles}
        handleSavePlayerName={handleSavePlayerName}
        handleClaimLevelUpRewards={handleClaimLevelUpRewards}
        handleCollectOfflineEarnings={handleCollectOfflineEarnings}
        handleResolveEventChoice={handleResolveEventChoice}
        handleResearchTech={handleResearchTech}
        handleEquipRelic={handleEquipRelic}
        handleUnequipRelic={handleUnequipRelic}
        handleCraftConsumable={handleCraftConsumable}
        handleBuyGems={handleBuyGems}
        handleBuyStarterPack={handleBuyStarterPack}
        handleActivateVipPerk={handleActivateVipPerk}
        handleSpinWheelReward={handleSpinWheelReward}
        handleRefreshRivals={handleRefreshRivals}
        handleStartArenaBattle={handleStartArenaBattle}
        handleArenaRevenge={handleArenaRevenge}
        handleBuyArenaTicket={handleBuyArenaTicket}
        handleBuyHonorItem={handleBuyHonorItem}
        handleClaimSeasonRewards={handleClaimSeasonRewards}
        handleArenaBattleVictory={handleArenaBattleVictory}
        handleArenaBattleDefeat={handleArenaBattleDefeat}
        handleOneClickHarvestAll={handleOneClickHarvestAll}
      />

      {/* Fly-to-HUD Flying Particles Layer */}
      <FlyToHudLayer 
        particles={flyingParticles} 
        onParticleComplete={handleParticleComplete} 
      />

      {/* Guided Interactive Tutorial (El Gran Senescal de las Nubes) */}
      <GuidedTutorial 
        key={tutorialKey}
        isActive={isTutorialRunning}
        onComplete={handleCompleteTutorial}
        onSkip={handleSkipTutorial}
      />

      {/* Smart Scene Loader (Initial City Entry & Handover) */}
      {isCityLoading && (
        <SmartLoader
          isOpen={isCityLoading}
          variant="city"
          progress={cityLoadProgress}
          onFinished={() => setIsCityLoading(false)}
        />
      )}

      {/* Startup Screen Scene with Email Quest / Guest Persistence */}
      {!hasStartedGame && (
        <StartScreen onEnterGame={handleEnterGame} />
      )}

      {/* Mobile & Vertical Portrait Orientation Warning Overlay (only during active city gameplay) */}
      {hasStartedGame && <OrientationNotice />}

      {/* Global Custom Context Menu for WizzarDev Studios on Right-Click */}
      <CustomContextMenu />
    </div>
  )
}
