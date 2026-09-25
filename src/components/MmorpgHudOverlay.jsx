import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import { getDungeonText } from '../i18n/dungeonDemoTranslations'
import { isMobileDevice } from '../utils/fullscreen'
import './MmorpgHudOverlay.css'

export function checkIsMobileDevice() {
  if (typeof window === 'undefined') return false
  const isMobileUA = isMobileDevice()
  const isPureTouch = window.matchMedia?.('(pointer: coarse) and (hover: none)')?.matches ?? false
  return isMobileUA || isPureTouch
}

const InventoryModal = lazy(() => import('./InventoryModal').then((m) => ({ default: m.InventoryModal })))

/**
 * MMORPG HUD Overlay Component
 * Pixel-perfect replica of the user reference screenshot:
 * - Quest Tracker card below existing profile card
 * - Top-Right Party (green frog), Friends/Guild (!), Mail, Menu (Hamburger)
 * - Currency Widget: Gold 245,670 | Gems 320
 * - Bottom-Left: Chat bubble button + Virtual D-PAD (with cyan glowing ring & 4 arrows)
 * - Bottom-Right: Ergonomic Action Cluster with Sword Attack, Dash, Mana Bolt, Heal,
 *   Jump, Auto Battle, Secondary Strike, Auto target, Skill 5 (Fire), and HP/MP Potions.
 */
export const MmorpgHudOverlay = React.memo(function MmorpgHudOverlay({
  actorRef = null,
  championState = null,
  playerLevel = 10,
  playerExp = 0,
  playerExpNeeded = 100,
  championFacing = 1,
  slimesCount = 10,
  slimesDefeated = 10,
  currentMapIndex = 0,
  maps = [],
  isAudioMuted = false,
  isFullscreen = false,
  onSelectMap = null,
  onToggleSound = null,
  onToggleFullscreen = null,
  onBack = null,
  onOpenChat = null,
  onOpenInventory = null,
  isWarMode = false,
  onToggleWarMode = null,
  cameraZoom = 1.45,
  onToggleCameraZoom = null,
  playerGold = null,
  hpPotions: propHpPotions = null,
  mpPotions: propMpPotions = null,
  onUseHpPotion = null,
  onUseMpPotion = null,
  activeQuest = null,
  onOpenQuest = null,
  onClaimQuest = null,
  isMenuOpen: propIsMenuOpen = null,
  onToggleMenu = null,
}) {
  const { currentLang, changeLanguage, languages } = useTranslation()
  const lang = currentLang || 'us'
  const [internalMenuOpen, setInternalMenuOpen] = useState(false)
  const isMenuOpen = propIsMenuOpen !== null ? propIsMenuOpen : internalMenuOpen
  const setIsMenuOpen = useCallback((valOrFn) => {
    if (onToggleMenu) {
      if (typeof valOrFn === 'function') {
        onToggleMenu((prev) => valOrFn(prev))
      } else {
        onToggleMenu(valOrFn)
      }
    } else {
      setInternalMenuOpen(valOrFn)
    }
  }, [onToggleMenu])
  const [isInventoryOpen, setIsInventoryOpen] = useState(false)
  const [internalHpPotions, setInternalHpPotions] = useState(25)
  const [internalMpPotions, setInternalMpPotions] = useState(25)

  const hpPotions = propHpPotions !== null ? propHpPotions : internalHpPotions
  const mpPotions = propMpPotions !== null ? propMpPotions : internalMpPotions
  const [currentFacing, setCurrentFacing] = useState(championFacing || 1)
  const [isJoystickActive, setIsJoystickActive] = useState(false)
  const [showMobileHud, setShowMobileHud] = useState(() => checkIsMobileDevice())
  const userOverrodeRef = useRef(false)
  const [activeHotkey, setActiveHotkey] = useState(null)

  // Real skill & potion cooldown system
  const [cooldownRemaining, setCooldownRemaining] = useState({
    attack: 0,
    seismic: 0,
    shield: 0,
    superSkill: 0,
    dashBack: 0,
    dashFront: 0,
    mpPotion: 0,
    hpPotion: 0,
  })
  const cooldownTimersRef = useRef({
    attack: 0,
    seismic: 0,
    shield: 0,
    superSkill: 0,
    dashBack: 0,
    dashFront: 0,
    mpPotion: 0,
    hpPotion: 0,
  })

  const startCooldown = useCallback((skillKey, durationMs) => {
    if ((cooldownTimersRef.current[skillKey] || 0) > Date.now()) return
    cooldownTimersRef.current[skillKey] = Date.now() + durationMs
    const remSec = Number((durationMs / 1000).toFixed(1))
    setCooldownRemaining((prev) => ({ ...prev, [skillKey]: remSec }))
  }, [])

  const isSkillOnCooldown = useCallback((skillKey) => {
    return (cooldownTimersRef.current[skillKey] || 0) > Date.now()
  }, [])

  // Synchronize with championState.cooldowns if updated by ChampionActor (e.g. from keyboard input)
  useEffect(() => {
    if (championState?.cooldowns) {
      const c = championState.cooldowns
      let updated = false
      if (c.seismic && c.seismic > cooldownTimersRef.current.seismic) {
        cooldownTimersRef.current.seismic = c.seismic
        updated = true
      }
      if (c.shield && c.shield > cooldownTimersRef.current.shield) {
        cooldownTimersRef.current.shield = c.shield
        updated = true
      }
      if (c.superSkill && c.superSkill > cooldownTimersRef.current.superSkill) {
        cooldownTimersRef.current.superSkill = c.superSkill
        updated = true
      }
      if (c.dashFront && c.dashFront > cooldownTimersRef.current.dashFront) {
        cooldownTimersRef.current.dashFront = c.dashFront
        updated = true
      }
      if (c.dashBack && c.dashBack > cooldownTimersRef.current.dashBack) {
        cooldownTimersRef.current.dashBack = c.dashBack
        updated = true
      }
      if (updated) {
        const now = Date.now()
        setCooldownRemaining((prev) => {
          const next = { ...prev }
          for (const k of ['seismic', 'shield', 'superSkill', 'dashFront', 'dashBack']) {
            const diff = (cooldownTimersRef.current[k] || 0) - now
            next[k] = diff > 0 ? Number((diff / 1000).toFixed(1)) : 0
          }
          return next
        })
      }
    }
  }, [championState?.cooldowns])

  // Cooldown countdown tick loop (50ms interval)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      setCooldownRemaining((prev) => {
        let changed = false
        const next = {}
        const keys = ['attack', 'seismic', 'shield', 'superSkill', 'dashBack', 'dashFront', 'mpPotion', 'hpPotion']
        for (const k of keys) {
          const remMs = (cooldownTimersRef.current[k] || 0) - now
          const remSec = remMs > 0 ? Number((remMs / 1000).toFixed(1)) : 0
          next[k] = remSec
          if (remSec !== prev[k]) {
            changed = true
          }
        }
        return changed ? next : prev
      })
    }, 50)
    return () => clearInterval(timer)
  }, [])

  // Hotkey listener for instant PC visual button-press feedback and hotkey cooldown triggering
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return
      if (e.code === 'Digit1' || e.code === 'KeyJ') {
        setActiveHotkey('1')
        startCooldown('attack', 350)
      } else if (e.code === 'Digit2' || e.code === 'KeyL') {
        setActiveHotkey('2')
        startCooldown('seismic', 4000)
      } else if (e.code === 'Digit3' || e.code === 'KeyK') {
        setActiveHotkey('3')
        startCooldown('shield', 5000)
      } else if (e.code === 'Digit4' || e.code === 'KeyU') {
        setActiveHotkey('4')
        startCooldown('superSkill', 10000)
      } else if (e.code === 'KeyF' || e.code === 'KeyQ') {
        setActiveHotkey('F')
        startCooldown('dashBack', 1600)
      } else if (e.code === 'KeyG' || e.code === 'KeyE') {
        setActiveHotkey('G')
        startCooldown('dashFront', 1600)
      } else if (e.code === 'KeyC' || e.code === 'KeyM') {
        setActiveHotkey('C')
        if (mpPotions > 0 && !isSkillOnCooldown('mpPotion')) startCooldown('mpPotion', 2000)
      } else if (e.code === 'KeyZ' || e.code === 'KeyH') {
        setActiveHotkey('Z')
        if (hpPotions > 0 && !isSkillOnCooldown('hpPotion')) startCooldown('hpPotion', 2000)
      }
    }
    const handleKeyUp = () => setActiveHotkey(null)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [hpPotions, mpPotions, isSkillOnCooldown, startCooldown])

  // Dynamically update mobile HUD on viewport or device changes if user hasn't manually overridden it
  useEffect(() => {
    const handleDeviceChange = () => {
      if (userOverrodeRef.current) return
      setShowMobileHud(checkIsMobileDevice())
    }

    window.addEventListener('resize', handleDeviceChange)
    const coarseMql = window.matchMedia?.('(pointer: coarse) and (hover: none)')
    coarseMql?.addEventListener?.('change', handleDeviceChange)

    return () => {
      window.removeEventListener('resize', handleDeviceChange)
      coarseMql?.removeEventListener?.('change', handleDeviceChange)
    }
  }, [])

  // Keep facing synchronized with prop
  useEffect(() => {
    if (championFacing) {
      setCurrentFacing(championFacing)
    }
  }, [championFacing])

  // Continuous frame loop to detect instant facing changes from keyboard or joystick
  useEffect(() => {
    let animId
    const checkFacing = () => {
      const f = actorRef?.current?.facing
      if (f && (f === 1 || f === -1)) {
        setCurrentFacing((prev) => (prev !== f ? f : prev))
      }
      animId = requestAnimationFrame(checkFacing)
    }
    animId = requestAnimationFrame(checkFacing)
    return () => cancelAnimationFrame(animId)
  }, [actorRef])

  const isFacingRight = currentFacing >= 0

  const joystickRef = useRef(null)
  const joystickKnobRef = useRef(null)
  const joystickPointerIdRef = useRef(null)
  const joystickIsGuardingRef = useRef(false)
  const joystickLastDirXRef = useRef(0)
  const lastActionTouchTimeRef = useRef(0)

  // Trigger action with synthetic click suppression
  const triggerAction = useCallback((actionFn) => {
    lastActionTouchTimeRef.current = Date.now()
    actionFn()
  }, [])

  // ==========================================
  // Knight Combat Action Handlers (Kina Male)
  // ==========================================
  // 1. Corte Básico de Espada (Combo de 3 Tajos sin cooldown artificial para encadenar combos)
  const handleAttack = useCallback(() => {
    const champ = actorRef?.current
    if (champ) {
      champ.inputAttack('punch')
    }
  }, [actorRef])

  // 2. Poder del Escudo (Bloqueo Defensivo / Guardia Sagrada)
  const handleShield = useCallback(() => {
    if (isSkillOnCooldown('shield')) return
    const champ = actorRef?.current
    if (champ) {
      const ok = typeof champ.shield === 'function' ? champ.shield() : champ.special('special')
      if (ok !== false) {
        startCooldown('shield', 5000)
      }
    }
  }, [actorRef, isSkillOnCooldown, startCooldown])

  // 3. Golpe Sísmico / Hendidura Telúrica con Espada
  const handleSeismic = useCallback(() => {
    if (isSkillOnCooldown('seismic')) return
    const champ = actorRef?.current
    if (champ) {
      const ok = typeof champ.seismic === 'function' ? champ.seismic() : champ.inputAttack('kick')
      if (ok !== false) {
        startCooldown('seismic', 4000)
      }
    }
  }, [actorRef, isSkillOnCooldown, startCooldown])

  // 4. Super Skill (SS) - Definitiva Celestial
  const handleSS = useCallback(() => {
    if (isSkillOnCooldown('superSkill')) return
    const champ = actorRef?.current
    if (champ) {
      const ok = typeof champ.superSkill === 'function' ? champ.superSkill() : champ.special('special2')
      if (ok !== false) {
        startCooldown('superSkill', 10000)
      }
    }
  }, [actorRef, isSkillOnCooldown, startCooldown])

  // 5a. Dash Adelante (Avanzar con Impulso Veloz hacia la dirección de ataque)
  const handleDashFront = useCallback(() => {
    if (isSkillOnCooldown('dashFront')) return
    const champ = actorRef?.current
    if (champ) {
      const ok = typeof champ.dashFront === 'function' ? champ.dashFront() : champ.dash(champ.facing || 1)
      if (ok !== false) {
        startCooldown('dashFront', 1600)
      }
    }
  }, [actorRef, isSkillOnCooldown, startCooldown])

  // 5b. Dash Atrás (Retirada Táctica / Evasión Atrás)
  const handleDashBack = useCallback(() => {
    if (isSkillOnCooldown('dashBack')) return
    const champ = actorRef?.current
    if (champ) {
      const ok = typeof champ.dashBack === 'function' ? champ.dashBack() : champ.dash(-(champ.facing || 1))
      if (ok !== false) {
        startCooldown('dashBack', 1600)
      }
    }
  }, [actorRef, isSkillOnCooldown, startCooldown])

  // Dash general (para compatibilidad de atajos)
  const handleDash = useCallback(() => {
    handleDashFront()
  }, [handleDashFront])

  // 6. Salto
  const handleJump = useCallback(() => {
    const champ = actorRef?.current
    if (champ) {
      champ.jump()
    }
  }, [actorRef])

  // Poción de Vida (HP)
  const handleUseHpPotion = useCallback(() => {
    if (hpPotions <= 0) return
    if (isSkillOnCooldown('hpPotion')) return
    startCooldown('hpPotion', 2000)
    if (onUseHpPotion) {
      onUseHpPotion()
      return
    }
    const champ = actorRef?.current
    if (champ) {
      setInternalHpPotions((prev) => Math.max(0, prev - 1))
      champ.heal(250)
      champ.showBanner(getDungeonText(lang, 'combat', 'potionHpUsed').replace('{amount}', '250'), 'heal')
      soundManager?.playClick?.()
    }
  }, [actorRef, hpPotions, onUseHpPotion, isSkillOnCooldown, startCooldown])

  // Poción de Maná (MP)
  const handleUseMpPotion = useCallback(() => {
    if (mpPotions <= 0) return
    if (isSkillOnCooldown('mpPotion')) return
    startCooldown('mpPotion', 2000)
    if (onUseMpPotion) {
      onUseMpPotion()
      return
    }
    const champ = actorRef?.current
    if (champ) {
      setInternalMpPotions((prev) => Math.max(0, prev - 1))
      champ.fury = Math.min(100, (champ.fury || 0) + 40)
      champ.showBanner(getDungeonText(lang, 'combat', 'potionMpUsed'), 'special')
      champ._emitChange?.()
      soundManager?.playClick?.()
    }
  }, [actorRef, mpPotions, onUseMpPotion, isSkillOnCooldown, startCooldown])

  // ==========================================
  // Virtual Analog Joystick ("Palanca" Táctil 3D)
  // Zero-Latency Direct GPU Transform & Fluid 2D Navigation
  // ==========================================
  const updateJoystick = useCallback((clientX, clientY) => {
    if (!joystickRef.current) return
    const rect = joystickRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const rawDx = clientX - centerX
    const rawDy = clientY - centerY
    const dist = Math.hypot(rawDx, rawDy)
    const angle = Math.atan2(rawDy, rawDx)

    const maxTravel = 44 // Maximum travel radius in px
    const clampedDist = Math.min(dist, maxTravel)
    const knobX = Math.cos(angle) * clampedDist
    const knobY = Math.sin(angle) * clampedDist

    // Direct GPU transform update for zero React render lag at 60/120 FPS
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = `translate3d(${knobX}px, ${knobY}px, 0)`
    }

    const champ = actorRef?.current
    if (!champ) return

    // Deadzone (deadzone radius: 10px)
    if (dist < 10) {
      if (joystickLastDirXRef.current !== 0) {
        joystickLastDirXRef.current = 0
        champ.stopMoving()
      }
      if (joystickIsGuardingRef.current) {
        joystickIsGuardingRef.current = false
        champ.crouch(false)
      }
      return
    }

    const normX = clampedDist > 0 ? (knobX / maxTravel) : 0
    const normY = clampedDist > 0 ? (knobY / maxTravel) : 0

    // Horizontal Movement (Smooth Walk vs Run)
    if (Math.abs(normX) > 0.18) {
      const isRun = Math.abs(normX) > 0.58 || dist > 32
      const dir = normX > 0 ? 1 : -1
      joystickLastDirXRef.current = dir
      if (isRun) {
        champ.run(dir)
      } else {
        champ.walk(dir)
      }
    } else {
      if (joystickLastDirXRef.current !== 0) {
        joystickLastDirXRef.current = 0
        champ.stopMoving()
      }
    }

    // Vertical Movement (Down = Agacharse)
    // El salto se realiza exclusivamente con el botón táctil dedicado de SALTO en el cluster derecho
    if (normY > 0.45 && Math.abs(normY) > Math.abs(normX) * 0.7) {
      if (!joystickIsGuardingRef.current) {
        joystickIsGuardingRef.current = true
        champ.crouch(true)
      }
    } else {
      if (joystickIsGuardingRef.current) {
        joystickIsGuardingRef.current = false
        champ.crouch(false)
      }
    }
  }, [actorRef])

  const handleJoystickPointerDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    joystickPointerIdRef.current = e.pointerId
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    setIsJoystickActive(true)
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transition = 'none'
    }
    updateJoystick(e.clientX, e.clientY)
  }

  const handleJoystickPointerMove = (e) => {
    if (joystickPointerIdRef.current === e.pointerId) {
      e.preventDefault()
      updateJoystick(e.clientX, e.clientY)
    }
  }

  const resetJoystick = useCallback(() => {
    joystickPointerIdRef.current = null
    setIsJoystickActive(false)
    joystickLastDirXRef.current = 0
    joystickIsGuardingRef.current = false

    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transition = 'transform 0.16s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
      joystickKnobRef.current.style.transform = 'translate3d(0px, 0px, 0)'
    }

    const champ = actorRef?.current
    if (champ) {
      champ.stopMoving()
      champ.crouch(false)
    }
  }, [actorRef])

  const handleJoystickPointerUp = (e) => {
    if (joystickPointerIdRef.current === e.pointerId) {
      try {
        e.currentTarget?.releasePointerCapture(e.pointerId)
      } catch {}
      resetJoystick()
    }
  }

  // Global window release safety
  useEffect(() => {
    const handleGlobalPointerUp = (e) => {
      if (joystickPointerIdRef.current !== null && e.pointerId === joystickPointerIdRef.current) {
        resetJoystick()
      }
    }
    window.addEventListener('pointerup', handleGlobalPointerUp)
    window.addEventListener('pointercancel', handleGlobalPointerUp)
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp)
      window.removeEventListener('pointercancel', handleGlobalPointerUp)
    }
  }, [resetJoystick])

  // ==========================================
  // Top-Right Button Actions
  // ==========================================

  const handleMailClick = () => {
    soundManager?.playClick?.()
    const champ = actorRef?.current
    champ?.showBanner(`✉️ ${getDungeonText(lang, 'skills', 'mail')}: Adventure Reward Available!`, 'heal')
  }

  const handleChatClick = () => {
    soundManager?.playClick?.()
    if (onOpenChat) onOpenChat()
    else {
      const champ = actorRef?.current
      champ?.showBanner('💬 Canal General: [Player]: ¡Adelante campeones!', 'info')
    }
  }

  const handleToggleInventory = useCallback(() => {
    soundManager?.playClick?.()
    if (onOpenInventory) {
      onOpenInventory()
    } else {
      setIsInventoryOpen((prev) => !prev)
    }
  }, [onOpenInventory])

  // Keyboard shortcut (B or I) to open Backpack / Inventory (only when standalone)
  useEffect(() => {
    if (onOpenInventory) return // Handled by parent scene (DungeonDemoScene) to prevent duplicate toggles
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return
      if ((e.code === 'KeyB' || e.code === 'KeyI') && !e.repeat) {
        handleToggleInventory()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleToggleInventory, onOpenInventory])

  return (
    <div className={`mmorpg-hud-container ${showMobileHud ? 'is-mobile' : 'is-desktop'}`}>
      {/* ====================================================================
          1. TOP-LEFT: Quest Tracker & Lateral Controls (Underneath Profile Card)
          ==================================================================== */}
      <div className="hud-left-column">
        {/* Quest Tracker */}
        <div 
          className="hud-quest-tracker hud-clickable"
          onClick={() => {
            soundManager?.playClick?.()
            if (onOpenQuest) {
              onOpenQuest()
              return
            }
            const champ = actorRef?.current
            if (activeQuest) {
              if (activeQuest.completed && onClaimQuest) {
                onClaimQuest(activeQuest)
                return
              }
              const status = activeQuest.completed ? getDungeonText(lang, 'questSystem', 'completed') : getDungeonText(lang, 'questSystem', 'inProgress')
              champ?.showBanner(`${status} ${activeQuest.title}: ${activeQuest.desc} (${activeQuest.progress}/${activeQuest.targetCount}) • +${activeQuest.expReward} EXP`, activeQuest.completed ? 'levelup' : 'info')
            } else if (currentMapIndex === 8) {
              champ?.showBanner(getDungeonText(lang, 'questSystem', 'sanctuaryHint'), 'special')
            } else if (isWarMode) {
              champ?.showBanner(getDungeonText(lang, 'questSystem', 'warAlliesHint'), 'special')
            } else {
              champ?.showBanner(getDungeonText(lang, 'questSystem', 'huntHint', { defeated: slimesDefeated, count: slimesCount }), 'info')
            }
          }}
          title={getDungeonText(lang, 'questSystem', 'clickDetails')}
        >
          <div className="hud-quest-header">
            <div className="hud-quest-title-wrap">
              <span className="hud-quest-icon">
                {activeQuest ? activeQuest.icon : (currentMapIndex === 8 ? '👑' : (isWarMode ? '👥' : '📜'))}
              </span>
              <span className="hud-quest-title">
                {activeQuest ? activeQuest.title : (currentMapIndex === 8 ? getDungeonText(lang, 'questSystem', 'founderQuestTitle') : (isWarMode ? getDungeonText(lang, 'skills', 'warModeTooltip') : getDungeonText(lang, 'maps', `map${Math.floor(currentMapIndex / 3) + 1}_name`)))}
              </span>
            </div>
            <div className={`hud-quest-check-badge ${(activeQuest?.completed || slimesDefeated >= slimesCount) ? 'completed' : ''} ${isWarMode ? 'war-badge' : ''}`}>
              {activeQuest ? (
                activeQuest.completed ? (
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>✓</span>
                ) : (
                  <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 'bold' }}>{activeQuest.progress}/{activeQuest.targetCount}</span>
                )
              ) : currentMapIndex === 8 ? (
                <span style={{ fontSize: '10px' }}>👑</span>
              ) : isWarMode ? (
                <span style={{ fontSize: '10px' }}>⚔️</span>
              ) : (
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <div className={`hud-quest-desc ${activeQuest ? (activeQuest.completed ? 'completed' : '') : (currentMapIndex === 8 ? 'completed' : (isWarMode ? 'war-active' : (slimesDefeated >= slimesCount ? 'completed' : '')))}`}>
            {activeQuest 
              ? `${activeQuest.desc} (${activeQuest.progress}/${activeQuest.targetCount})` 
              : (currentMapIndex === 8 ? getDungeonText(lang, 'questSystem', 'founderQuestDesc') : (isWarMode ? getDungeonText(lang, 'questSystem', 'warAlliesHint') : getDungeonText(lang, 'questSystem', 'huntHint', { defeated: slimesDefeated, count: slimesCount })))}
          </div>
        </div>

        {/* Botón de chat desactivado temporalmente */}
      </div>

      {/* ====================================================================
          2. TOP-RIGHT: Navigation Icons & Currency Bar
          ==================================================================== */}
      <div className="hud-top-right">
        {/* Top Icons Row */}
        <div className="hud-nav-icons-row">

          {/* Mail Button */}
          <button 
            type="button" 
            className="hud-nav-btn" 
            onClick={handleMailClick}
            title={getDungeonText(lang, 'skills', 'mailTooltip')}
          >
            <div className="hud-nav-btn-icon-wrap">
              {/* Mail Envelope SVG */}
              <svg width="34" height="34" viewBox="0 0 36 36">
                <rect x="5" y="9" width="26" height="18" rx="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
                <path d="M 5 11 L 18 20 L 31 11" fill="none" stroke="#ca8a04" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M 5 27 L 13 18" fill="none" stroke="#ca8a04" strokeWidth="1.2" />
                <path d="M 31 27 L 23 18" fill="none" stroke="#ca8a04" strokeWidth="1.2" />
              </svg>
            </div>
            <span className="hud-nav-btn-label">{getDungeonText(lang, 'skills', 'mail')}</span>
          </button>

          {/* Backpack / Inventory Button (Quick access on desktop and top nav) */}
          <button 
            type="button" 
            className="hud-nav-btn hud-nav-btn-bag" 
            onClick={handleToggleInventory}
            title={`${getDungeonText(lang, 'backpack', 'title')} [B]`}
          >
            <div className="hud-nav-btn-icon-wrap">
              <img 
                src="/assets/hud_icons/btn_inventory.webp" 
                alt={getDungeonText(lang, 'backpack', 'title')} 
                className="hud-nav-btn-img" 
                draggable={false} 
              />
            </div>
            <span className="hud-nav-btn-label">{getDungeonText(lang, 'backpack', 'title')}</span>
          </button>

          {/* Hamburger Game Menu */}
          <button 
            type="button" 
            className="hud-menu-btn" 
            onClick={() => {
              soundManager?.playClick?.()
              setIsMenuOpen((prev) => !prev)
            }}
            title={getDungeonText(lang, 'menu', 'title')}
          >
            <div className="hud-menu-btn-bar" />
            <div className="hud-menu-btn-bar" />
            <div className="hud-menu-btn-bar" />
          </button>
        </div>

        {/* Currency Box */}
        <div className="hud-currency-bar">
          {/* Gold Coins */}
          <div className="hud-currency-item" title={getDungeonText(lang, 'items', 'goldCoins')}>
            <div className="hud-currency-icon-wrap">
              <img 
                src="/assets/items/gold_coin_v4.webp" 
                alt="Oro" 
                className="hud-currency-icon-img" 
                draggable={false} 
              />
            </div>
            <span className="hud-currency-val gold">{(playerGold ?? 245670).toLocaleString()}</span>
          </div>

          {/* Blue Gems */}
          <div className="hud-currency-item">
            <div className="hud-currency-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 20 20">
                <defs>
                  <linearGradient id="gemGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#bae6fd" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                </defs>
                <polygon points="6,4 14,4 18,9 10,17 2,9" fill="url(#gemGrad)" stroke="#0369a1" strokeWidth="1" />
                <line x1="6" y1="4" x2="10" y2="17" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
                <line x1="14" y1="4" x2="10" y2="17" stroke="#0284c7" strokeWidth="0.8" />
                <line x1="2" y1="9" x2="18" y2="9" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" />
              </svg>
            </div>
            <span className="hud-currency-val gem">320</span>
          </div>
        </div>

        {/* Toggle Pills Row: War Mode */}
        <div className="hud-pill-row">
          {onToggleWarMode && (
            <button
              type="button"
              className={`hud-war-mode-pill ${isWarMode ? 'active' : ''}`}
              onClick={() => {
                soundManager?.playClick?.()
                onToggleWarMode()
              }}
              title={getDungeonText(lang, 'skills', 'warModeTooltip')}
            >
              <span className="hud-war-mode-icon">⚔️</span>
              <span className="hud-war-mode-text">{isWarMode ? 'Champions (4)' : 'Slimes'}</span>
            </button>
          )}
        </div>
      </div>


      {/* ====================================================================
          3. MOBILE TOUCH HUD (JOYSTICK, MOCHILA Y BOTONES RADIALES DE COMBATE)
          Oculto en Escritorio / PC, activo en Móvil y Touchscreens.
          ==================================================================== */}
      {showMobileHud && (
        <>
          <div 
            ref={joystickRef}
        className={`hud-joystick-container ${isJoystickActive ? 'active' : ''}`}
        onPointerDown={handleJoystickPointerDown}
        onPointerMove={handleJoystickPointerMove}
        onPointerUp={handleJoystickPointerUp}
        onPointerCancel={handleJoystickPointerUp}
        role="group"
        aria-label={getDungeonText(lang, 'skills', 'joystickAria')}
      >
        <div className="hud-joystick-base">
          {/* Subtle Sci-Fi Orbital Track & Crosshair (Sin flechas) */}
          <div className="hud-joystick-orbit-ring" />
          <div className="hud-joystick-cross-h" />
          <div className="hud-joystick-cross-v" />

          {/* Movable 3D Analog Thumb Knob (Palanca) */}
          <div 
            ref={joystickKnobRef}
            className="hud-joystick-knob"
          >
            <div className="hud-joystick-knob-core">
              <div className="hud-joystick-knob-grip">
                <div className="hud-joystick-knob-pip" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3.5 BACKPACK BUTTON (Centrado entre la Palanca y la Poción de Vida)
          ==================================================================== */}
      <div className="hud-backpack-center-slot">
        <button
          type="button"
          className="hud-backpack-btn"
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleInventory(); }}
          onClick={handleToggleInventory}
          title={getDungeonText(lang, 'backpack', 'title')}
          aria-label={getDungeonText(lang, 'backpack', 'title')}
        >
          <div className="hud-backpack-disc">
            <img 
              src="/assets/hud_icons/btn_inventory.webp" 
              alt={getDungeonText(lang, 'backpack', 'title')} 
              className="hud-backpack-img" 
              draggable={false} 
            />
          </div>
          <span className="hud-backpack-label">{getDungeonText(lang, 'backpack', 'title')}</span>
        </button>
      </div>

      {/* ====================================================================
          4. BOTTOM-RIGHT: MMORPG Action / Skills Radial Cluster
          ==================================================================== */}
      <div className="hud-actions-cluster">
        {/* --- Quick Potions (Red HP & Blue MP) --- */}
        <div className="hud-potions-group">
          {/* Red HP Potion */}
          <div 
            className="hud-potion-item" 
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); triggerAction(handleUseHpPotion); }}
            onClick={() => { if (Date.now() - lastActionTouchTimeRef.current < 400) return; handleUseHpPotion(); }} 
            title={getDungeonText(lang, 'skills', 'restoreHp')}
          >
            <div className="hud-potion-disc">
              <img 
                src="/assets/items/potion_hp_v4.webp" 
                alt={getDungeonText(lang, 'items', 'potionHp')} 
                className="hud-potion-img hp" 
                draggable={false} 
              />
            </div>
            <span className="hud-potion-count">{hpPotions}</span>
            <span className="hud-potion-label hp">HP</span>
          </div>

          {/* Blue MP Potion */}
          <div 
            className="hud-potion-item" 
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); triggerAction(handleUseMpPotion); }}
            onClick={() => { if (Date.now() - lastActionTouchTimeRef.current < 400) return; handleUseMpPotion(); }} 
            title={getDungeonText(lang, 'skills', 'restoreMp')}
          >
            <div className="hud-potion-disc">
              <img 
                src="/assets/items/potion_mp_v4.webp" 
                alt={getDungeonText(lang, 'items', 'potionMp')} 
                className="hud-potion-img mp" 
                draggable={false} 
              />
            </div>
            <span className="hud-potion-count">{mpPotions}</span>
            <span className="hud-potion-label mp">MP</span>
          </div>
        </div>

        {/* --- 1. BOTÓN PRINCIPAL: CORTE DE ESPADA (Combo de 3 Tajos) --- */}
        <div className="hud-action-btn-wrap hud-btn-main-attack">
          <button 
            type="button" 
            className={`hud-action-btn ${cooldownRemaining.attack > 0 ? 'is-on-cooldown' : ''}`}
            disabled={cooldownRemaining.attack > 0}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); triggerAction(handleAttack); }}
            onClick={() => { if (Date.now() - lastActionTouchTimeRef.current < 400) return; handleAttack(); }}
            title={getDungeonText(lang, 'skills', 'slashTooltip')}
          >
            <img src="/assets/hud/slash_v4.webp" alt={getDungeonText(lang, 'skills', 'slash')} className="hud-action-btn-img" draggable={false} />
            {cooldownRemaining.attack > 0 && (
              <span className="hud-action-cooldown-badge">{cooldownRemaining.attack}s</span>
            )}
          </button>
          <span className="hud-action-btn-label">{getDungeonText(lang, 'skills', 'slash')}</span>
        </div>

        {/* --- 2. SALTO (Arc 1 - Posición inferior) --- */}
        <div className="hud-action-btn-wrap hud-btn-jump">
          <button 
            type="button" 
            className="hud-action-btn"
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); triggerAction(handleJump); }}
            onClick={() => { if (Date.now() - lastActionTouchTimeRef.current < 400) return; handleJump(); }}
            title={getDungeonText(lang, 'skills', 'jumpTooltip')}
          >
            <img src="/assets/hud/jump_v4.webp" alt={getDungeonText(lang, 'skills', 'jump')} className="hud-action-btn-img" draggable={false} />
          </button>
          <span className="hud-action-btn-label">{getDungeonText(lang, 'skills', 'jump')}</span>
        </div>

        {/* --- 3. GOLPE SÍSMICO (Arc 2 - Posición media) --- */}
        <div className="hud-action-btn-wrap hud-btn-seismic">
          <button 
            type="button" 
            className={`hud-action-btn ${cooldownRemaining.seismic > 0 ? 'is-on-cooldown' : ''}`}
            disabled={cooldownRemaining.seismic > 0}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); triggerAction(handleSeismic); }}
            onClick={() => { if (Date.now() - lastActionTouchTimeRef.current < 400) return; handleSeismic(); }}
            title={getDungeonText(lang, 'skills', 'seismicTooltip')}
          >
            <img src="/assets/hud/seismic_v4.webp" alt={getDungeonText(lang, 'skills', 'seismic')} className="hud-action-btn-img" draggable={false} />
            {cooldownRemaining.seismic > 0 && (
              <span className="hud-action-cooldown-badge">{cooldownRemaining.seismic}s</span>
            )}
          </button>
          <span className="hud-action-btn-label">{getDungeonText(lang, 'skills', 'seismic')}</span>
        </div>

        {/* --- 4. PODER DEL ESCUDO / EMBESTIDA (Arc 3 - Mid-high of Radial Arc) --- */}
        <div className="hud-action-btn-wrap hud-btn-shield">
          <button 
            type="button" 
            className={`hud-action-btn ${cooldownRemaining.shield > 0 ? 'is-on-cooldown' : ''}`}
            disabled={cooldownRemaining.shield > 0}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); triggerAction(handleShield); }}
            onClick={() => { if (Date.now() - lastActionTouchTimeRef.current < 400) return; handleShield(); }}
            title={getDungeonText(lang, 'skills', 'shieldTooltip')}
          >
            <img src="/assets/hud/shield_v4.webp" alt={getDungeonText(lang, 'skills', 'shield')} className="hud-action-btn-img" draggable={false} />
            {cooldownRemaining.shield > 0 && (
              <span className="hud-action-cooldown-badge">{cooldownRemaining.shield}s</span>
            )}
          </button>
          <span className="hud-action-btn-label">{getDungeonText(lang, 'skills', 'shield')}</span>
        </div>

        {/* --- 5. SUPER SKILL (SS) / DEFINITIVA CELESTIAL (Arc 4 - Top Apex of Radial Arc) --- */}
        <div className="hud-action-btn-wrap hud-btn-ss">
          <button 
            type="button" 
            className={`hud-action-btn hud-action-btn-ss ${cooldownRemaining.superSkill > 0 ? 'is-on-cooldown' : ''}`}
            disabled={cooldownRemaining.superSkill > 0}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); triggerAction(handleSS); }}
            onClick={() => { if (Date.now() - lastActionTouchTimeRef.current < 400) return; handleSS(); }}
            title={getDungeonText(lang, 'skills', 'superSkillTooltip')}
          >
            <img src="/assets/hud/super_v4.webp" alt="SS" className="hud-action-btn-img" draggable={false} />
            {cooldownRemaining.superSkill > 0 && (
              <span className="hud-action-cooldown-badge">{cooldownRemaining.superSkill}s</span>
            )}
          </button>
          <span className="hud-action-btn-label">{getDungeonText(lang, 'skills', 'superSkill')}</span>
        </div>

        {/* --- 6. DASH FLANK 1 (Lower Flank: Always dashes Left ⬅) --- */}
        <div className={`hud-action-btn-wrap hud-btn-dash-back hud-btn-dash-lower ${isFacingRight ? 'dash-is-back' : 'dash-is-front'}`}>
          <button 
            type="button" 
            className={`hud-action-btn ${cooldownRemaining.dashBack > 0 ? 'is-on-cooldown' : ''}`}
            disabled={cooldownRemaining.dashBack > 0}
            onPointerDown={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              triggerAction(isFacingRight ? handleDashBack : handleDashFront); 
            }}
            onClick={() => { 
              if (Date.now() - lastActionTouchTimeRef.current < 400) return; 
              if (isFacingRight) handleDashBack(); else handleDashFront(); 
            }}
            title={isFacingRight ? getDungeonText(lang, 'skills', 'dashBackTooltip') : getDungeonText(lang, 'skills', 'dashFrontTooltip')}
          >
            <img 
              src="/assets/hud/dash_v4.webp" 
              alt="Dash" 
              className="hud-action-btn-img" 
              style={{ transform: isFacingRight ? 'scaleX(-1)' : 'none' }} 
              draggable={false} 
            />
            {cooldownRemaining.dashBack > 0 && (
              <span className="hud-action-cooldown-badge">{cooldownRemaining.dashBack}s</span>
            )}
          </button>
          <span className="hud-action-btn-label">{getDungeonText(lang, 'skills', 'dashLeft')}</span>
        </div>

        {/* --- 7. DASH FLANK 2 (Lateral Flank: Always dashes Right ➔) --- */}
        <div className={`hud-action-btn-wrap hud-btn-dash-front hud-btn-dash-lateral ${isFacingRight ? 'dash-is-front' : 'dash-is-back'}`}>
          <button 
            type="button" 
            className={`hud-action-btn ${cooldownRemaining.dashFront > 0 ? 'is-on-cooldown' : ''}`}
            disabled={cooldownRemaining.dashFront > 0}
            onPointerDown={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              triggerAction(isFacingRight ? handleDashFront : handleDashBack); 
            }}
            onClick={() => { 
              if (Date.now() - lastActionTouchTimeRef.current < 400) return; 
              if (isFacingRight) handleDashFront(); else handleDashBack(); 
            }}
            title={isFacingRight ? getDungeonText(lang, 'skills', 'dashFrontTooltip') : getDungeonText(lang, 'skills', 'dashBackTooltip')}
          >
            <img 
              src="/assets/hud/dash_v4.webp" 
              alt="Dash" 
              className="hud-action-btn-img" 
              style={{ transform: isFacingRight ? 'none' : 'scaleX(-1)' }} 
              draggable={false} 
            />
            {cooldownRemaining.dashFront > 0 && (
              <span className="hud-action-cooldown-badge">{cooldownRemaining.dashFront}s</span>
            )}
          </button>
          <span className="hud-action-btn-label">{getDungeonText(lang, 'skills', 'dashRight')}</span>
        </div>
      </div>
        </>
      )}

      {/* ====================================================================
          4B. DESKTOP MMORPG COMBAT HOTBAR (PC Only - Matching User Reference)
          [Wing 1: Skills 1-4] [Center: Hero Frame & Level] [Wing 2: Movement F, G] [Wing 3: Potions C, Z]
          ==================================================================== */}
      <div className="hud-desktop-hotbar" role="toolbar" aria-label={getDungeonText(lang, 'skills', 'hotbarAria')}>
        {/* --- Left Wing: 4 Combat Action Slots --- */}
        <div className="hud-desktop-wing hud-desktop-wing-left">
          <div className="hud-desktop-tray">
            {/* Slot 1: Corte de Espada / Main Attack (Key 1 / J) */}
            <div className="hud-desktop-slot-container">
              <button
                type="button"
                className={`hud-desktop-slot ${activeHotkey === '1' ? 'is-active-hotkey' : ''} ${cooldownRemaining.attack > 0 ? 'is-on-cooldown' : ''}`}
                onClick={() => {
                  soundManager?.playClick?.()
                  handleAttack()
                }}
                disabled={cooldownRemaining.attack > 0}
                title={getDungeonText(lang, 'skills', 'slashTooltipDesktop')}
              >
                <div className="hud-desktop-slot-icon-wrap icon-attack">
                  <img
                    src="/assets/hud/slash_v4.webp"
                    alt={getDungeonText(lang, 'skills', 'slash')}
                    className="hud-desktop-icon-img"
                    draggable={false}
                  />
                  {cooldownRemaining.attack > 0 && (
                    <div className="hud-slot-cooldown-overlay">
                      <span className="hud-slot-cooldown-text">{cooldownRemaining.attack}s</span>
                    </div>
                  )}
                  <span className="hud-desktop-badge">60</span>
                </div>
                <div className="hud-desktop-pips">
                  <span className={`hud-pip ${cooldownRemaining.attack <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip ${cooldownRemaining.attack <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip ${cooldownRemaining.attack <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip ${cooldownRemaining.attack <= 0 ? 'active' : ''}`} />
                </div>
              </button>
              <span className="hud-desktop-key">1</span>
            </div>

            {/* Slot 2: Golpe Sísmico (Key 2 / L) */}
            <div className="hud-desktop-slot-container">
              <button
                type="button"
                className={`hud-desktop-slot ${activeHotkey === '2' ? 'is-active-hotkey' : ''} ${cooldownRemaining.seismic > 0 ? 'is-on-cooldown' : ''}`}
                onClick={() => {
                  soundManager?.playClick?.()
                  handleSeismic()
                }}
                disabled={cooldownRemaining.seismic > 0}
                title={getDungeonText(lang, 'skills', 'seismicTooltipDesktop')}
              >
                <div className="hud-desktop-slot-icon-wrap icon-seismic">
                  <img
                    src="/assets/hud/seismic_v4.webp"
                    alt={getDungeonText(lang, 'skills', 'seismic')}
                    className="hud-desktop-icon-img"
                    draggable={false}
                  />
                  {cooldownRemaining.seismic > 0 && (
                    <div className="hud-slot-cooldown-overlay">
                      <span className="hud-slot-cooldown-text">{cooldownRemaining.seismic}s</span>
                    </div>
                  )}
                </div>
                <div className="hud-desktop-pips">
                  <span className={`hud-pip ${cooldownRemaining.seismic <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip ${cooldownRemaining.seismic <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip ${cooldownRemaining.seismic <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip ${cooldownRemaining.seismic <= 0 ? 'active' : ''}`} />
                </div>
              </button>
              <span className="hud-desktop-key">2</span>
            </div>

            {/* Slot 3: Poder del Escudo (Key 3 / K) */}
            <div className="hud-desktop-slot-container">
              <button
                type="button"
                className={`hud-desktop-slot ${activeHotkey === '3' ? 'is-active-hotkey' : ''} ${cooldownRemaining.shield > 0 ? 'is-on-cooldown' : ''}`}
                onClick={() => {
                  soundManager?.playClick?.()
                  handleShield()
                }}
                disabled={cooldownRemaining.shield > 0}
                title={getDungeonText(lang, 'skills', 'shieldTooltipDesktop')}
              >
                <div className="hud-desktop-slot-icon-wrap icon-shield">
                  <img
                    src="/assets/hud/shield_v4.webp"
                    alt={getDungeonText(lang, 'skills', 'shield')}
                    className="hud-desktop-icon-img"
                    draggable={false}
                  />
                  {cooldownRemaining.shield > 0 && (
                    <div className="hud-slot-cooldown-overlay">
                      <span className="hud-slot-cooldown-text">{cooldownRemaining.shield}s</span>
                    </div>
                  )}
                </div>
                <div className="hud-desktop-pips">
                  <span className={`hud-pip ${cooldownRemaining.shield <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip ${cooldownRemaining.shield <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip ${cooldownRemaining.shield <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip ${cooldownRemaining.shield <= 0 ? 'active' : ''}`} />
                </div>
              </button>
              <span className="hud-desktop-key">3</span>
            </div>

            {/* Slot 4: Super Skill Celestial (Key 4 / U) */}
            <div className="hud-desktop-slot-container">
              <button
                type="button"
                className={`hud-desktop-slot ${activeHotkey === '4' ? 'is-active-hotkey' : ''} ${cooldownRemaining.superSkill > 0 ? 'is-on-cooldown' : ''}`}
                onClick={() => {
                  soundManager?.playClick?.()
                  handleSS()
                }}
                disabled={cooldownRemaining.superSkill > 0}
                title={getDungeonText(lang, 'skills', 'superSkillTooltipDesktop')}
              >
                <div className="hud-desktop-slot-icon-wrap icon-super">
                  <img
                    src="/assets/hud/super_v4.webp"
                    alt="Super Skill Celestial"
                    className="hud-desktop-icon-img"
                    draggable={false}
                  />
                  {cooldownRemaining.superSkill > 0 && (
                    <div className="hud-slot-cooldown-overlay">
                      <span className="hud-slot-cooldown-text">{cooldownRemaining.superSkill}s</span>
                    </div>
                  )}
                </div>
                <div className="hud-desktop-pips">
                  <span className={`hud-pip ${cooldownRemaining.superSkill <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip ${cooldownRemaining.superSkill <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip ${cooldownRemaining.superSkill <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip ${cooldownRemaining.superSkill <= 0 ? 'active' : ''}`} />
                </div>
              </button>
              <span className="hud-desktop-key">4</span>
            </div>
          </div>
        </div>

        {/* --- Center Unit: Hero Portrait & Level Frame --- */}
        <div className="hud-desktop-avatar-unit">

          {/* Hero Portrait Frame */}
          <div className="hud-desktop-avatar-frame">
            <img
              src={championState?.avatar || '/CHAMPIONS/KINA_MALE/avatar.webp'}
              alt={getDungeonText(lang, 'skills', 'heroPortrait')}
              className="hud-desktop-avatar-img"
              onError={(e) => {
                e.currentTarget.src = '/assets/avatars/knight_male.webp'
              }}
            />
            <div className="hud-desktop-avatar-shine" />
          </div>

          {/* Bottom Level Diamond & EXP Strip */}
          <div className="hud-desktop-level-strip">
            <div className="hud-desktop-level-diamond" title={`Level ${playerLevel}`}>
              <span className="hud-desktop-level-num">{playerLevel}</span>
            </div>
            <div className="hud-desktop-exp-tray" title={`EXP: ${playerExp} / ${playerExpNeeded}`}>
              <div 
                className="hud-desktop-exp-fill" 
                style={{ width: `${Math.min(100, Math.max(0, (playerExp / (playerExpNeeded || 100)) * 100))}%` }} 
              />
            </div>
          </div>
        </div>

        {/* --- Right Wing 1: Movement / Relics (Keys F & G) --- */}
        <div className="hud-desktop-wing hud-desktop-wing-movement">
          <div className="hud-desktop-tray">
            {/* Slot 5: Dash Atrás (Key F / Q) */}
            <div className="hud-desktop-slot-container">
              <button
                type="button"
                className={`hud-desktop-slot ${activeHotkey === 'F' ? 'is-active-hotkey' : ''} ${cooldownRemaining.dashBack > 0 ? 'is-on-cooldown' : ''}`}
                onClick={() => {
                  soundManager?.playClick?.()
                  handleDashBack()
                }}
                disabled={cooldownRemaining.dashBack > 0}
                title={getDungeonText(lang, 'skills', 'dashBackTooltipDesktop')}
              >
                <div className="hud-desktop-slot-icon-wrap icon-dash-back">
                  <img
                    src="/assets/hud/dash_v4.webp"
                    alt={getDungeonText(lang, 'skills', 'dashBackTooltip')}
                    className="hud-desktop-icon-img is-flipped"
                    draggable={false}
                  />
                  {cooldownRemaining.dashBack > 0 && (
                    <div className="hud-slot-cooldown-overlay">
                      <span className="hud-slot-cooldown-text">{cooldownRemaining.dashBack}s</span>
                    </div>
                  )}
                </div>
                <div className="hud-desktop-pips">
                  <span className={`hud-pip cyan ${cooldownRemaining.dashBack <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip cyan ${cooldownRemaining.dashBack <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip cyan ${cooldownRemaining.dashBack <= 0 ? 'active' : ''}`} />
                </div>
              </button>
              <span className="hud-desktop-key">F</span>
            </div>

            {/* Slot 6: Dash Adelante (Key G / E) */}
            <div className="hud-desktop-slot-container">
              <button
                type="button"
                className={`hud-desktop-slot ${activeHotkey === 'G' ? 'is-active-hotkey' : ''} ${cooldownRemaining.dashFront > 0 ? 'is-on-cooldown' : ''}`}
                onClick={() => {
                  soundManager?.playClick?.()
                  handleDashFront()
                }}
                disabled={cooldownRemaining.dashFront > 0}
                title={getDungeonText(lang, 'skills', 'dashFrontTooltipDesktop')}
              >
                <div className="hud-desktop-slot-icon-wrap icon-dash-front">
                  <img
                    src="/assets/hud/dash_v4.webp"
                    alt={getDungeonText(lang, 'skills', 'dashFrontTooltip')}
                    className="hud-desktop-icon-img"
                    draggable={false}
                  />
                  {cooldownRemaining.dashFront > 0 && (
                    <div className="hud-slot-cooldown-overlay">
                      <span className="hud-slot-cooldown-text">{cooldownRemaining.dashFront}s</span>
                    </div>
                  )}
                </div>
                <div className="hud-desktop-pips">
                  <span className={`hud-pip cyan ${cooldownRemaining.dashFront <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip cyan ${cooldownRemaining.dashFront <= 0 ? 'active' : ''}`} />
                  <span className={`hud-pip cyan ${cooldownRemaining.dashFront <= 0 ? 'active' : ''}`} />
                </div>
              </button>
              <span className="hud-desktop-key">G</span>
            </div>
          </div>
        </div>

        {/* --- Right Wing 2: Consumables / Potions (Keys C & Z) --- */}
        <div className="hud-desktop-wing hud-desktop-wing-potions">
          <div className="hud-desktop-tray">
            {/* Slot 7: Poción de Maná (Key C / M) */}
            <div className="hud-desktop-slot-container">
              <button
                type="button"
                className={`hud-desktop-slot ${activeHotkey === 'C' ? 'is-active-hotkey' : ''} ${cooldownRemaining.mpPotion > 0 ? 'is-on-cooldown' : ''}`}
                onClick={() => {
                  soundManager?.playClick?.()
                  handleUseMpPotion()
                }}
                disabled={cooldownRemaining.mpPotion > 0 || mpPotions <= 0}
                title={getDungeonText(lang, 'skills', 'restoreMpDesktop').replace('{count}', mpPotions)}
              >
                <div className="hud-desktop-slot-icon-wrap icon-potion-mp">
                  <img
                    src="/assets/items/potion_mp_v4.webp"
                    alt={getDungeonText(lang, 'items', 'potionMp')}
                    className="hud-desktop-icon-img"
                    draggable={false}
                  />
                  {cooldownRemaining.mpPotion > 0 && (
                    <div className="hud-slot-cooldown-overlay">
                      <span className="hud-slot-cooldown-text">{cooldownRemaining.mpPotion}s</span>
                    </div>
                  )}
                  <span className="hud-desktop-badge potion-badge-mp">{mpPotions}</span>
                </div>
                <div className="hud-desktop-pips">
                  <span className={`hud-pip blue ${cooldownRemaining.mpPotion <= 0 && mpPotions > 0 ? 'active' : ''}`} />
                  <span className={`hud-pip blue ${cooldownRemaining.mpPotion <= 0 && mpPotions > 0 ? 'active' : ''}`} />
                  <span className={`hud-pip blue ${cooldownRemaining.mpPotion <= 0 && mpPotions > 0 ? 'active' : ''}`} />
                </div>
              </button>
              <span className="hud-desktop-key">C</span>
            </div>

            {/* Slot 8: Poción de Vida (Key Z / H) */}
            <div className="hud-desktop-slot-container">
              <button
                type="button"
                className={`hud-desktop-slot ${activeHotkey === 'Z' ? 'is-active-hotkey' : ''} ${cooldownRemaining.hpPotion > 0 ? 'is-on-cooldown' : ''}`}
                onClick={() => {
                  soundManager?.playClick?.()
                  handleUseHpPotion()
                }}
                disabled={cooldownRemaining.hpPotion > 0 || hpPotions <= 0}
                title={getDungeonText(lang, 'skills', 'restoreHpDesktop').replace('{count}', hpPotions)}
              >
                <div className="hud-desktop-slot-icon-wrap icon-potion-hp">
                  <img
                    src="/assets/items/potion_hp_v4.webp"
                    alt={getDungeonText(lang, 'items', 'potionHp')}
                    className="hud-desktop-icon-img"
                    draggable={false}
                  />
                  {cooldownRemaining.hpPotion > 0 && (
                    <div className="hud-slot-cooldown-overlay">
                      <span className="hud-slot-cooldown-text">{cooldownRemaining.hpPotion}s</span>
                    </div>
                  )}
                  <span className="hud-desktop-badge potion-badge-hp">{hpPotions}</span>
                </div>
                <div className="hud-desktop-pips">
                  <span className={`hud-pip green ${cooldownRemaining.hpPotion <= 0 && hpPotions > 0 ? 'active' : ''}`} />
                  <span className={`hud-pip green ${cooldownRemaining.hpPotion <= 0 && hpPotions > 0 ? 'active' : ''}`} />
                  <span className={`hud-pip green ${cooldownRemaining.hpPotion <= 0 && hpPotions > 0 ? 'active' : ''}`} />
                </div>
              </button>
              <span className="hud-desktop-key">Z</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          5. HAMBURGER GAME MENU MODAL (EXCLUSIVAMENTE OPCIÓN DE SALIR)
          ==================================================================== */}
      {isMenuOpen && (
        <div className="hud-menu-modal-backdrop" onClick={() => setIsMenuOpen(false)}>
          <div className="hud-menu-modal-card hud-menu-exit-card" onClick={(e) => e.stopPropagation()}>
            <div className="hud-menu-modal-header">
              <span className="hud-menu-modal-title">{getDungeonText(lang, 'menu', 'title')}</span>
              <button 
                type="button" 
                className="hud-menu-modal-close"
                onClick={() => {
                  soundManager?.playClick?.()
                  setIsMenuOpen(false)
                }}
                aria-label={getDungeonText(lang, 'menu', 'closeAria')}
              >
                ✕
              </button>
            </div>

            {/* Selector dinámico de idioma en el Menú de Juego */}
            <div className="hud-menu-lang-section">
              <span className="hud-menu-lang-title">
                🌐 {getDungeonText(lang, 'menu', 'language')}
              </span>
              <div className="hud-menu-lang-grid">
                {languages.map((l) => {
                  const isActive = (currentLang || 'us') === l.code
                  return (
                    <button
                      key={l.code}
                      type="button"
                      className={`hud-menu-lang-pill ${isActive ? 'is-active' : ''}`}
                      onClick={() => {
                        soundManager?.playClick?.()
                        changeLanguage(l.code)
                      }}
                      title={l.name}
                    >
                      <span className="hud-menu-lang-flag">{l.flag}</span>
                      <span className="hud-menu-lang-code">{l.code.toUpperCase()}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Toggle Controles Táctiles (Móvil vs Escritorio) */}
            <div className="hud-menu-toggle-section">
              <div className="hud-menu-toggle-row">
                <div className="hud-menu-toggle-info">
                  <span className="hud-menu-toggle-title">🎮 {getDungeonText(lang, 'menu', 'touchControls')}</span>
                  <span className="hud-menu-toggle-sub">
                    {showMobileHud ? getDungeonText(lang, 'menu', 'controlsVisible') : getDungeonText(lang, 'menu', 'controlsHidden')}
                  </span>
                </div>
                <button
                  type="button"
                  className={`hud-menu-toggle-switch ${showMobileHud ? 'is-active' : ''}`}
                  onClick={() => {
                    soundManager?.playClick?.()
                    userOverrodeRef.current = true
                    setShowMobileHud((prev) => !prev)
                  }}
                  title={showMobileHud ? getDungeonText(lang, 'skills', 'toggleMobileTooltipShow') : getDungeonText(lang, 'skills', 'toggleMobileTooltipHide')}
                  aria-label={getDungeonText(lang, 'menu', 'touchControls')}
                >
                  <div className="hud-menu-toggle-knob" />
                </button>
              </div>
            </div>

            <div className="hud-menu-exit-actions">
              <button 
                type="button" 
                className="hud-menu-btn-action exit"
                onClick={() => {
                  soundManager?.playClick?.()
                  setIsMenuOpen(false)
                  if (onBack) onBack()
                }}
              >
                {getDungeonText(lang, 'menu', 'exit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fallback Inventory Modal (Only used if onOpenInventory is not provided) */}
      {!onOpenInventory && isInventoryOpen && (
        <Suspense fallback={null}>
          <InventoryModal
            isOpen={isInventoryOpen}
            onClose={() => setIsInventoryOpen(false)}
          />
        </Suspense>
      )}
    </div>
  )
})
