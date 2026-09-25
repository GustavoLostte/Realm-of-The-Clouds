import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Champion } from '../entities/Champion'
import { SeamlessSprite, preloadAndDecodeSprite } from './SeamlessSprite'
import { getChampionById } from '../data/championsData'
import { getClassScale, getClassOffsetY } from '../data/classesData'
import './ChampionActor.css'

/**
 * Reusable MMORPG Top-Left Status HUD Card
 */
export const ChampionProfileCard = React.memo(function ChampionProfileCard({
  state,
  name: nameProp = null,
  level: levelProp = null,
  badge: badgeProp = null,
}) {
  if (!state) return null
  const displayName = nameProp || state.name || 'Player'
  const displayLevel = levelProp ?? state.level ?? 10
  const displayBadge = badgeProp || state.badge || '👑'

  return (
    <div className="champion-actor-hud">
      {/* Avatar Box with Level Tag and Badge Token */}
      <div className="champion-hud-avatar-box">
        <img 
          src={state.avatar} 
          alt={displayName} 
          className="champion-hud-avatar-img"
          onError={(e) => {
            e.target.onerror = null
            e.target.src = '/CHAMPIONS/KINA_MALE/avatar.webp'
          }}
        />
        {/* Bottom Level Tag */}
        <div className="champion-hud-level-tag">
          Lv. <span className="champion-hud-level-num">{displayLevel}</span>
        </div>
        {/* Optional Badge Token */}
        {displayBadge ? (
          <div className="champion-hud-badge-token">
            <span>{displayBadge}</span>
          </div>
        ) : null}
      </div>

      {/* Right Information Column */}
      <div className="champion-hud-info">
        {/* Name */}
        <div className="champion-hud-name-row">
          <span className="champion-hud-name">{displayName}</span>
        </div>

        {/* Dual Status Bars Frame */}
        <div className="champion-hud-bars-frame">
          {/* HP Bar */}
          <div className="champion-hud-hp-bar">
            <div 
              className="champion-hud-hp-fill"
              style={{ width: `${state.hpPercent ?? 100}%` }}
            />
            <div className="champion-hud-bar-labels">
              <span className="champion-hud-label-type">HP</span>
              <span className="champion-hud-label-value">{state.hp ?? 1250}/{state.maxHp ?? 1250}</span>
            </div>
          </div>

          {/* MP Bar */}
          <div className="champion-hud-mp-bar">
            <div 
              className="champion-hud-mp-fill"
              style={{ width: `${state.fury ?? 100}%` }}
            />
            <div className="champion-hud-bar-labels">
              <span className="champion-hud-label-type">MP</span>
              <span className="champion-hud-label-value">{Math.round(((state.fury ?? 100) / 100) * 680)}/680</span>
            </div>
          </div>

          {/* EXP Bar */}
          {state.expPercent !== undefined && (
            <div className="champion-hud-exp-bar" title={`EXP: ${state.currentExp ?? 0} / ${state.expNeeded ?? 140} (${state.expPercent ?? 0}%)`}>
              <div 
                className="champion-hud-exp-fill"
                style={{ width: `${state.expPercent ?? 0}%` }}
              />
              <div className="champion-hud-bar-labels">
                <span className="champion-hud-label-type">EXP</span>
                <span className="champion-hud-label-value">{state.currentExp ?? 0}/{state.expNeeded ?? 140}</span>
              </div>
            </div>
          )}
        </div>

        {/* Skills Row */}
        <div className="champion-hud-skills-row">
          <div className="champion-hud-skill-icon">
            <img src="/assets/hud_icons/passive_attack.webp" alt="Passive Attack" draggable={false} />
          </div>
          <div className="champion-hud-skill-icon">
            <img src="/assets/hud_icons/passive_defense.webp" alt="Passive Defense" draggable={false} />
          </div>
          <div className="champion-hud-skill-icon">
            <img src="/assets/hud_icons/passive_gem.webp" alt="Passive Health" draggable={false} />
          </div>
        </div>
      </div>
    </div>
  )
})

/**
 * Reusable ChampionActor Component
 * Drop-in champion presentation and interactive controller:
 * - Just pass championId="valiria" (or any champion id/instance)
 * - Zero extra setup required: auto-handles movement, jump, audio, animations, and controls!
 */
export const ChampionActor = React.memo(function ChampionActor({
  champion: championProp = 'valiria',
  initialX = 25,
  bottomOffset = 68,
  minX = 5,
  maxX = 95,
  enableKeyboard = true,
  showHud = true,
  showOverhead = true,
  showControls = false,
  showHint = false,
  name: nameProp = null,
  nameProp: altName = null,
  level: levelProp = null,
  levelProp: altLevel = null,
  badge: badgeProp = null,
  floatingTexts = [],
  onStateChange = null,
  actorRef = null,
  canMoveTo = null,
}) {
  const [state, setState] = useState(null)
  const containerRef = useRef(null)
  const champRef = useRef(null)
  const playerNodeRef = useRef(null)
  const overheadRef = useRef(null)
  const shadowRef = useRef(null)
  const champStateRef = useRef(null)
  const bannerRef = useRef(null)
  const bannerTimerRef = useRef(null)
  const keysPressedRef = useRef({})
  const lastTapLeftRef = useRef(0)
  const lastTapRightRef = useRef(0)

  // Reactive class scale overrides from Laboratory (Scale Workbench)
  const resolveCurrentScale = useCallback((overrideScales = null) => {
    const rawClassId = state?.classId || (typeof championProp === 'string' ? championProp : championProp?.classId) || 'knight'
    const rawGender = state?.gender || 
      (typeof championProp === 'object' ? championProp?.gender : null) || 
      (typeof championProp === 'string' && championProp.toLowerCase().includes('female') ? 'female' : 'male')
    const rawAnim = state?.anim || 'idle'
    return getClassScale(rawClassId, rawAnim, rawGender, overrideScales)
  }, [state?.classId, state?.gender, state?.anim, championProp])

  // Reactive class vertical offset overrides from Laboratory (Scale Workbench)
  const resolveCurrentOffsetY = useCallback((overrideOffsets = null) => {
    const rawClassId = state?.classId || (typeof championProp === 'string' ? championProp : championProp?.classId) || 'knight'
    const rawGender = state?.gender || 
      (typeof championProp === 'object' ? championProp?.gender : null) || 
      (typeof championProp === 'string' && championProp.toLowerCase().includes('female') ? 'female' : 'male')
    const rawAnim = state?.anim || 'idle'
    return getClassOffsetY(rawClassId, rawAnim, rawGender, overrideOffsets)
  }, [state?.classId, state?.gender, state?.anim, championProp])

  // Base scale and vertical offset for HUD anchor (always anchored to champion's standing idle profile to eliminate abrupt teleportation)
  const resolveBaseScale = useCallback((overrideScales = null) => {
    const rawClassId = state?.classId || (typeof championProp === 'string' ? championProp : championProp?.classId) || 'knight'
    const rawGender = state?.gender || 
      (typeof championProp === 'object' ? championProp?.gender : null) || 
      (typeof championProp === 'string' && championProp.toLowerCase().includes('female') ? 'female' : 'male')
    return getClassScale(rawClassId, 'idle', rawGender, overrideScales)
  }, [state?.classId, state?.gender, championProp])

  const resolveBaseOffsetY = useCallback((overrideOffsets = null) => {
    const rawClassId = state?.classId || (typeof championProp === 'string' ? championProp : championProp?.classId) || 'knight'
    const rawGender = state?.gender || 
      (typeof championProp === 'object' ? championProp?.gender : null) || 
      (typeof championProp === 'string' && championProp.toLowerCase().includes('female') ? 'female' : 'male')
    return getClassOffsetY(rawClassId, 'idle', rawGender, overrideOffsets)
  }, [state?.classId, state?.gender, championProp])

  const [workbenchOverrides, setWorkbenchOverrides] = useState({ scales: null, offsets: null })

  useEffect(() => {
    const handleScalesUpdated = (e) => {
      const s = e?.detail?.scales || (e?.detail && !e?.detail?.offsets ? e.detail : null)
      const o = e?.detail?.offsets
      setWorkbenchOverrides({ scales: s, offsets: o })
    }
    window.addEventListener('toc_champion_scales_updated', handleScalesUpdated)
    return () => window.removeEventListener('toc_champion_scales_updated', handleScalesUpdated)
  }, [])

  const classScale = resolveCurrentScale(workbenchOverrides.scales)
  const classOffsetY = resolveCurrentOffsetY(workbenchOverrides.offsets)
  const baseClassScale = resolveBaseScale(workbenchOverrides.scales)
  const baseClassOffsetY = resolveBaseOffsetY(workbenchOverrides.offsets)

  const onStateChangeRef = useRef(onStateChange)
  useEffect(() => {
    onStateChangeRef.current = onStateChange
  }, [onStateChange])

  const canMoveToRef = useRef(canMoveTo)
  useEffect(() => {
    canMoveToRef.current = canMoveTo
    if (champRef.current) {
      champRef.current.canMoveTo = (...args) => {
        if (typeof canMoveToRef.current === 'function') {
          return canMoveToRef.current(...args)
        }
        return args[0]
      }
    }
  }, [canMoveTo])

  // Sync level dynamically without recreating the Champion instance
  useEffect(() => {
    if (champRef.current && levelProp != null) {
      champRef.current.setLevel?.(levelProp, champRef.current.fury ?? 100)
    }
  }, [levelProp])

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const skillCooldownsRef = useRef({
    seismic: 0,
    shield: 0,
    superSkill: 0,
    dashFront: 0,
    dashBack: 0,
  })

  // Initialize or re-assign Champion instance strictly once per championProp
  useEffect(() => {
    let instance
    const handleStateChange = (newState) => {
      const prev = champStateRef.current
      champStateRef.current = newState

      // Only re-render ChampionActor via React when discrete visual properties change
      const isDiscreteVisualChange = 
        !prev ||
        prev.anim !== newState.anim ||
        prev.facing !== newState.facing ||
        prev.animNonce !== newState.animNonce ||
        prev.hp !== newState.hp ||
        prev.maxHp !== newState.maxHp ||
        prev.fury !== newState.fury ||
        prev.level !== newState.level ||
        prev.isGuarding !== newState.isGuarding ||
        prev.isCrouching !== newState.isCrouching ||
        prev.sprite !== newState.sprite

      if (isDiscreteVisualChange) {
        queueMicrotask(() => {
          if (isMountedRef.current) {
            newState.cooldowns = skillCooldownsRef.current
            setState(newState)
          }
        })
      }

      if (onStateChangeRef.current) {
        onStateChangeRef.current(newState)
      }
    }

    if (championProp instanceof Champion) {
      instance = championProp
      instance.onStateChange = handleStateChange
    } else {
      instance = new Champion(championProp, {
        initialX,
        minX,
        maxX,
        level: levelProp ?? 10,
        canMoveTo: (...args) => {
          if (typeof canMoveToRef.current === 'function') {
            return canMoveToRef.current(...args)
          }
          return args[0]
        },
        onStateChange: handleStateChange,
      })
    }

    // Direct DOM Action Banner handler (Zero React re-render overhead)
    instance.onActionBanner = (banner) => {
      if (bannerRef.current && banner?.text) {
        bannerRef.current.textContent = banner.text
        bannerRef.current.className = `champion-actor-banner ${banner.type || 'info'} active`
        bannerRef.current.style.display = 'block'
        if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
        bannerTimerRef.current = setTimeout(() => {
          if (bannerRef.current) {
            bannerRef.current.className = 'champion-actor-banner'
            bannerRef.current.style.display = 'none'
          }
        }, 700)
      }
    }

    instance.canMoveTo = (...args) => {
      if (typeof canMoveToRef.current === 'function') {
        return canMoveToRef.current(...args)
      }
      return args[0]
    }

    // Wrap methods with real skill cooldowns to prevent spamming
    const origSeismic = instance.seismic.bind(instance)
    instance.seismic = () => {
      if (skillCooldownsRef.current.seismic > Date.now()) return false
      const success = origSeismic()
      if (success !== false) {
        skillCooldownsRef.current = {
          ...skillCooldownsRef.current,
          seismic: Date.now() + 4000,
        }
        instance._emitChange?.()
        return true
      }
      return false
    }

    const origShield = instance.shield.bind(instance)
    instance.shield = () => {
      if (skillCooldownsRef.current.shield > Date.now()) return false
      const success = origShield()
      if (success !== false) {
        skillCooldownsRef.current = {
          ...skillCooldownsRef.current,
          shield: Date.now() + 5000,
        }
        instance._emitChange?.()
        return true
      }
      return false
    }

    const origSuperSkill = instance.superSkill.bind(instance)
    instance.superSkill = () => {
      if (skillCooldownsRef.current.superSkill > Date.now()) return false
      const success = origSuperSkill()
      if (success !== false) {
        skillCooldownsRef.current = {
          ...skillCooldownsRef.current,
          superSkill: Date.now() + 10000,
        }
        instance._emitChange?.()
        return true
      }
      return false
    }

    const origDashFront = instance.dashFront.bind(instance)
    instance.dashFront = () => {
      if (skillCooldownsRef.current.dashFront > Date.now()) return false
      const success = origDashFront()
      if (success !== false) {
        skillCooldownsRef.current = {
          ...skillCooldownsRef.current,
          dashFront: Date.now() + 1600,
        }
        instance._emitChange?.()
        return true
      }
      return false
    }

    const origDashBack = instance.dashBack.bind(instance)
    instance.dashBack = () => {
      if (skillCooldownsRef.current.dashBack > Date.now()) return false
      const success = origDashBack()
      if (success !== false) {
        skillCooldownsRef.current = {
          ...skillCooldownsRef.current,
          dashBack: Date.now() + 1600,
        }
        instance._emitChange?.()
        return true
      }
      return false
    }

    const origDash = instance.dash.bind(instance)
    instance.dash = (dir) => {
      const targetDir = dir !== undefined ? dir : (instance.facing || 1)
      if (targetDir >= 0) {
        return instance.dashFront ? instance.dashFront() : origDash(targetDir)
      } else {
        return instance.dashBack ? instance.dashBack() : origDash(targetDir)
      }
    }

    champRef.current = instance
    if (actorRef) {
      actorRef.current = instance
    }
    setState(instance.getState())

    return () => {
      if (actorRef) {
        actorRef.current = null
      }
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current)
      }
      instance.destroy()
    }
  }, [championProp])

  // Preload and asynchronously GPU-decode all champion sprites into memory for instant zero-stutter attacks
  useEffect(() => {
    let anims = champRef.current?.animations
    if (!anims && typeof championProp === 'string') {
      const champData = getChampionById(championProp)
      anims = champData?.animations
    } else if (!anims && championProp?.animations) {
      anims = championProp.animations
    }
    if (anims) {
      Object.values(anims).forEach((url) => {
        if (url && typeof url === 'string') {
          preloadAndDecodeSprite(url)
        }
      })
    }
  }, [championProp])

  // Framerate-Independent Physics Loop (Delta-Time Normalized to 60 FPS)
  useEffect(() => {
    let animFrameId
    let lastTime = performance.now()

    const loop = (currentTime) => {
      // Calculate delta time in ms, clamped between 1ms and 50ms to prevent tab-switch leaps
      const deltaMs = Math.min(50, Math.max(1, currentTime - lastTime))
      lastTime = currentTime

      // Normalized factor: dt = 1.0 at 60 FPS (16.667ms). At 120 FPS dt = 0.5.
      const dt = deltaMs / 16.6667

      if (champRef.current) {
        if (containerRef.current?.clientWidth) {
          champRef.current.containerWidth = containerRef.current.clientWidth
        }
        champRef.current.update(dt)

        // Zero-overhead GPU direct transform for player node during walking/running/dashing/jumping
        if (playerNodeRef.current) {
          const px = champRef.current.posX
          const py = champRef.current.posY || 0
          playerNodeRef.current.style.transform = `translate3d(${px}cqi, 0, 0) translateX(-50%)`
          if (py !== 0) {
            playerNodeRef.current.style.bottom = typeof bottomOffset === 'string' && (bottomOffset.includes('var') || bottomOffset.includes('vh') || bottomOffset.includes('%') || bottomOffset.includes('px'))
              ? `calc(${bottomOffset} + ${py}px)`
              : `calc(${bottomOffset}px + ${py}px)`
          } else {
            playerNodeRef.current.style.bottom = typeof bottomOffset === 'string' && (bottomOffset.includes('var') || bottomOffset.includes('vh') || bottomOffset.includes('%') || bottomOffset.includes('px'))
              ? bottomOffset
              : `${bottomOffset}px`
          }
        }

        if (overheadRef.current) {
          const ratio = champRef.current.jumpHeadRatio || 0
          overheadRef.current.style.transform = `translate3d(-50%, calc(-1 * var(--dungeon-sprite-height, 21dvh) * ${ratio.toFixed(4)}), 0)`
        }

        if (shadowRef.current) {
          const air = champRef.current.airElevation || 0
          const py = champRef.current.posY || 0
          const scale = Math.max(0.60, 1 - ((air + py) / 140) * 0.4)
          const opacity = Math.max(0.25, 0.85 - ((air + py) / 100) * 0.55)
          shadowRef.current.style.transform = `translateX(-50%) scale(${scale.toFixed(3)})`
          shadowRef.current.style.opacity = opacity.toFixed(3)
        }

        // Movement continuity guarantee: If player is holding movement keys (A/D/Shift)
        // and champion is not action-locked, resume movement immediately without requiring key re-press
        if (!champRef.current.isActionLocked && !champRef.current.isCrouching && !champRef.current.isGuarding) {
          const keys = keysPressedRef.current
          const moveLeft = keys['KeyA'] || keys['ArrowLeft'] || keys['virtual_left']
          const moveRight = keys['KeyD'] || keys['ArrowRight'] || keys['virtual_right']
          const shouldMove = (moveLeft && !moveRight) || (moveRight && !moveLeft)
          if (shouldMove && champRef.current.moveDirection === 0) {
            syncMovement()
          }
        }
      }
      animFrameId = requestAnimationFrame(loop)
    }

    animFrameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrameId)
  }, [])

  // Input synchronization helper (called strictly on key state changes)
  const syncMovement = () => {
    const champ = champRef.current
    if (!champ) return

    const keys = keysPressedRef.current
    const moveLeft = keys['KeyA'] || keys['ArrowLeft'] || keys['virtual_left']
    const moveRight = keys['KeyD'] || keys['ArrowRight'] || keys['virtual_right']
    const isRunning = keys['ShiftLeft'] || keys['ShiftRight'] || keys['virtual_run']

    if (moveLeft && !moveRight) {
      if (isRunning) champ.run(-1)
      else champ.walk(-1)
    } else if (moveRight && !moveLeft) {
      if (isRunning) champ.run(1)
      else champ.walk(1)
    } else {
      champ.stopMoving()
    }
  }

  // Keyboard Event Listeners (Rock-solid event-driven input handling)
  useEffect(() => {
    if (!enableKeyboard) return

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return
      const champ = champRef.current
      if (!champ) return

      // Mark key active
      keysPressedRef.current[e.code] = true

      // Single-fire actions (ignore key repeat)
      if (!e.repeat) {
        if (e.code === 'KeyJ' || e.code === 'Digit1') {
          champ.inputAttack('punch') // Corte Básico de Espada (Combo x3)
        } else if (e.code === 'KeyL' || e.code === 'Digit2') {
          champ.seismic() // Poder Sísmico (Hendidura Telúrica)
        } else if (e.code === 'KeyK' || e.code === 'Digit3') {
          champ.shield() // Poder del Escudo (Bloqueo Defensivo Sagrado)
        } else if (e.code === 'KeyU' || e.code === 'Digit4') {
          champ.superSkill() // Super Skill (SS) Definitiva Celestial
        } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
          champ.crouch(true)
        } else if (e.code === 'KeyW' || e.code === 'Space' || e.code === 'ArrowUp') {
          champ.jump()
        } else if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E' || e.code === 'KeyG' || e.key === 'g' || e.key === 'G') {
          // Dash Adelante (E o G)
          if (typeof champ.dashFront === 'function') champ.dashFront()
          else champ.dash(champ.facing || 1)
        } else if (e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q' || e.code === 'KeyF' || e.key === 'f' || e.key === 'F') {
          // Dash Atrás (Q o F)
          if (typeof champ.dashBack === 'function') champ.dashBack()
          else champ.dash(-(champ.facing || 1))
        }
      }

      // Movement keys sync
      if (['KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        syncMovement()
      }
    }

    const handleKeyUp = (e) => {
      const champ = champRef.current
      keysPressedRef.current[e.code] = false

      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        champ?.crouch(false)
      }

      // Movement keys sync
      if (['KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        syncMovement()
      }
    }

    // Safety: Reset all movement keys when window loses focus (prevent stuck keys)
    const handleWindowBlur = () => {
      keysPressedRef.current = {}
      const champ = champRef.current
      if (champ) {
        champ.stopMoving()
        champ.crouch(false)
        champ.defend(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [enableKeyboard])

  if (!state) return null
  const champ = champRef.current
  const resolvedName = nameProp || altName
  const resolvedLevel = levelProp ?? altLevel
  const resolvedBadge = (badgeProp !== null && badgeProp !== undefined && badgeProp !== '') 
    ? badgeProp 
    : ((altBadge !== null && altBadge !== undefined && altBadge !== '') ? altBadge : null)
  const savedPlayerName = typeof window !== 'undefined' ? localStorage.getItem('toc_player_name') : null
  const displayName = resolvedName || savedPlayerName || state.name || 'Wizzard'
  const displayLevel = resolvedLevel ?? state.level ?? 10
  const displayBadge = resolvedBadge || state.badge || '👑'
  const isCaster = 
    state.classId === 'mage' || state.classId === 'healer' ||
    state.id?.toLowerCase().includes('mage') || state.id?.toLowerCase().includes('healer') ||
    state.id?.toLowerCase().includes('mago') || state.id?.toLowerCase().includes('sanador') ||
    state.role?.toLowerCase().includes('hechicer') || state.role?.toLowerCase().includes('sanador') ||
    state.role?.toLowerCase().includes('mago')

  return (
    <div ref={containerRef} className="champion-actor-container">
      {/* 1. MMORPG Top-Left Status HUD (User Mockup Design) */}
      {showHud && (
        <ChampionProfileCard 
          state={state} 
          name={displayName} 
          level={displayLevel} 
          badge={displayBadge} 
        />
      )}


      {/* 2. Champion Playfield Node */}
      <div 
        ref={playerNodeRef}
        className="champion-actor-node"
        style={{
          left: 0,
          bottom: typeof bottomOffset === 'string' && (bottomOffset.includes('var') || bottomOffset.includes('vh') || bottomOffset.includes('%') || bottomOffset.includes('px'))
            ? `calc(${bottomOffset} + ${state?.posY || 0}px)`
            : `calc(${bottomOffset}px + ${state?.posY || 0}px)`,
          transform: `translate3d(${state?.posX ?? initialX}cqi, 0, 0) translateX(-50%)`,
          zIndex: 50,
        }}
      >
        {/* Dynamic Ground Shadow for all classes */}
        <div 
          ref={shadowRef}
          className="champion-actor-ground-shadow"
          style={{
            bottom: `calc(-${state.posY || 0}px - 2px)`,
            transform: `translateX(-50%) scale(${Math.max(0.60, 1 - (((state.airElevation || 0) + (state.posY || 0)) / 140) * 0.4)})`,
            opacity: Math.max(0.25, 0.85 - (((state.airElevation || 0) + (state.posY || 0)) / 100) * 0.55),
          }}
        />
        {/* Floating Combat Action Banner (Direct DOM Ref - Zero React Churn) */}
        <div ref={bannerRef} className="champion-actor-banner" style={{ display: 'none' }} />

        {/* MMORPG Overhead Health Bar & Nameplate (Exact Reference Design - Clean Clearance Above Hair) */}
        {showOverhead && (
          <div 
            ref={overheadRef}
            className="champion-actor-overhead"
            style={{
              bottom: `calc(${((baseClassScale || 1.0) * (state?.classId === 'knight' ? (state?.gender === 'female' ? 0.70 : 0.73) : 0.94) * 100).toFixed(1)}% + calc(var(--dungeon-sprite-height, 21dvh) * 0.035 + 4px) + ${baseClassOffsetY || 0}px)`,
              transform: `translate3d(-50%, calc(-1 * var(--dungeon-sprite-height, 21dvh) * ${(state?.jumpHeadRatio || 0).toFixed(4)}), 0)`,
            }}
          >
            <div className="champion-overhead-name">
              {displayName}
            </div>
            <div className="champion-overhead-level">
              lvl {displayLevel}
            </div>

            <div className="champion-overhead-bar-row">
              <div className="champion-overhead-medallion">
                <span>{displayBadge || 'NX'}</span>
              </div>

              <div className="champion-overhead-bar-frame">
                <div className="champion-overhead-hp-track">
                  <div 
                    className="champion-overhead-hp-fill"
                    style={{ width: `${state.hpPercent}%` }} 
                  />
                </div>
                <div className="champion-overhead-fury-track">
                  <div 
                    className="champion-overhead-fury-fill"
                    style={{ width: `${state.fury}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Combat Damage Popups (Directly Anchored Over Champion Head) */}
        {floatingTexts && floatingTexts.length > 0 && floatingTexts.map((f, fIdx) => (
          <div 
            key={f.id ? `${f.id}_${fIdx}` : `pfloat_${fIdx}`} 
            className={`floating-damage-number player-damage-float ${f.type || 'damage'}`}
            style={{
              bottom: `calc(${((baseClassScale || 1.0) * (state?.classId === 'knight' ? (state?.gender === 'female' ? 0.70 : 0.73) : 0.94) * 100).toFixed(1)}% + calc(var(--dungeon-sprite-height, 21dvh) * 0.035 + 28px) + ${baseClassOffsetY || 0}px)`,
              left: '50%',
              top: 'auto',
            }}
          >
            {f.text}
          </div>
        ))}

        {/* Sprite with Facing Transformation, Class Scale & Vertical Offset */}
        <div 
          className={`champion-actor-sprite-wrap anim-${state.anim}`}
          style={{ transform: `scaleX(${state.facing}) translateY(${-classOffsetY}px) scale(${classScale || 1.0})` }}
        >
          <SeamlessSprite 
            src={state.sprite} 
            alt={state.name}
            className={`champion-actor-sprite sprite-${state.anim}`}
            anim={state.anim}
            animNonce={state.animNonce}
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
})

