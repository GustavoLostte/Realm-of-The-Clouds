import React, { useState, useEffect, useRef, useMemo } from 'react'
import './ChampionsScaleWorkbenchModal.css'
import { 
  X, 
  Sparkles, 
  Shield, 
  Swords, 
  Crown, 
  Store, 
  Zap, 
  RotateCcw, 
  Sliders, 
  Check, 
  Repeat,
  ExternalLink,
  Monitor,
  Maximize2,
  Minimize2,
  Gamepad2
} from 'lucide-react'
import { soundManager } from '../utils/audio'

import { 
  getSavedClassScales, 
  saveClassScales, 
  DEFAULT_CLASS_SCALES,
  DEFAULT_ANIM_SCALES,
  getSavedClassOffsets,
  saveClassOffsets,
  DEFAULT_CLASS_OFFSETS,
  DEFAULT_ANIM_OFFSETS
} from '../data/classesData'

const ANIM_NAMES = {
  idle: 'Reposo (Idle)',
  walk: 'Caminar (Walk)',
  run: 'Correr (Run)',
  jump: 'Salto (Jump)',
  dash_front: 'Dash Front',
  dash_back: 'Dash Back',
  attack1: 'Ataque Básico',
  attack2: 'Golpe Escudo',
  special: 'Golpe Área',
  special2: 'Muro Escudo',
}

const CLASSES_CONFIG = [
  {
    id: 'knight',
    name: 'Knight (Kina)',
    role: 'Tanque Pesado',
    color: '#38bdf8',
    icon: Shield,
    folderMale: 'KINA_MALE',
    folderFemale: 'KINA_FEMALE',
    hasRun: true,
  },
  {
    id: 'paladin',
    name: 'Paladín (Arquero)',
    role: 'Daño & Rango',
    color: '#f59e0b',
    icon: Swords,
    folderMale: 'PALADIN_MALE',
    folderFemale: 'PALADIN_FEMALE',
    hasRun: true,
  },
  {
    id: 'mage',
    name: 'Mago',
    role: 'Hechicero Arcano',
    color: '#a855f7',
    icon: Sparkles,
    folderMale: 'MAGE_MALE',
    folderFemale: 'MAGE_FEMALE',
    hasRun: false,
  },
  {
    id: 'healer',
    name: 'Healer',
    role: 'Soporte Sagrado',
    color: '#10b981',
    icon: Crown,
    folderMale: 'HEALER_MALE',
    folderFemale: 'HEALER_FEMALE',
    hasRun: false,
  },
]

const MARKET_BACKGROUNDS = [
  { id: 'armory', name: 'Armería', url: '/assets/market/market_aisle_02_armory.webp' },
  { id: 'alchemy', name: 'Alquimia', url: '/assets/market/market_aisle_01_alchemy.webp' },
  { id: 'gems', name: 'Gemas', url: '/assets/market/market_aisle_03_gems.webp' },
  { id: 'provisions', name: 'Provisiones', url: '/assets/market/market_aisle_04_provisions.webp' },
]

export function ChampionsScaleWorkbenchModal({ isOpen, onClose, standalone = false }) {
  const isStandalone = standalone || (typeof window !== 'undefined' && (
    window.location.search.includes('workbench=true') ||
    window.location.search.includes('scale-lab') ||
    window.location.search.includes('scale=true') ||
    window.location.pathname.endsWith('/workbench')
  ))

  const isActuallyOpen = isStandalone || isOpen

  // Active Background
  const [bgIndex, setBgIndex] = useState(0)
  
  // Floor guide line
  const [showFloorLine, setShowFloorLine] = useState(true)

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Live scale per class (1.0 = 100%) - Loaded from localStorage
  const [scales, setScales] = useState(() => getSavedClassScales())
  // Live Y offset per class (in px, positive = arriba, negative = abajo) - Loaded from localStorage
  const [offsets, setOffsets] = useState(() => getSavedClassOffsets())
  const [savedBadge, setSavedBadge] = useState(false)
  const saveTimeoutRef = useRef(null)

  // Re-sync saved scales and offsets whenever modal opens or cross-window sync fires
  useEffect(() => {
    if (isActuallyOpen) {
      setScales(getSavedClassScales())
      setOffsets(getSavedClassOffsets())
    }
    const handleSync = (e) => {
      if (e?.detail) {
        if (e.detail.scales) {
          setScales(e.detail.scales)
        } else if (!e.detail.offsets) {
          setScales(e.detail)
        }
        if (e.detail.offsets) {
          setOffsets(e.detail.offsets)
        }
      }
    }
    window.addEventListener('toc_champion_scales_updated', handleSync)
    return () => window.removeEventListener('toc_champion_scales_updated', handleSync)
  }, [isActuallyOpen])

  const handleToggleFullscreen = () => {
    soundManager.playClick?.()
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Helper to persist scale changes with immediate visual feedback (per animation and per gender)
  const updateAndPersistScale = (targetKey, newScale, applyToAll = false) => {
    const clamped = Math.max(0.4, Math.min(2.5, Math.round(newScale * 100) / 100))
    const currentClassObj = scales[targetKey] || { ...DEFAULT_ANIM_SCALES }

    let updatedClassObj
    if (applyToAll) {
      updatedClassObj = {
        idle: clamped,
        walk: clamped,
        run: clamped,
        jump: clamped,
        dash_front: clamped,
        dash_back: clamped,
        attack1: clamped,
        attack2: clamped,
        special: clamped,
        special2: clamped,
      }
    } else {
      updatedClassObj = {
        ...(typeof currentClassObj === 'number'
          ? { idle: currentClassObj, walk: currentClassObj, run: currentClassObj, jump: currentClassObj, dash_front: currentClassObj, dash_back: currentClassObj, attack1: currentClassObj, attack2: currentClassObj, special: currentClassObj, special2: currentClassObj }
          : currentClassObj),
        [activeAnim]: clamped,
      }
    }

    const next = {
      ...scales,
      [targetKey]: updatedClassObj,
    }

    setScales(next)
    saveClassScales(next)

    // Show saved notification
    setSavedBadge(true)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      setSavedBadge(false)
    }, 2200)
  }

  // Helper to persist offset Y changes (in px, per animation and per gender)
  const updateAndPersistOffset = (targetKey, newOffset, applyToAll = false) => {
    const clamped = Math.max(-60, Math.min(60, Math.round(newOffset)))
    const currentClassObj = offsets[targetKey] || { ...DEFAULT_ANIM_OFFSETS }

    let updatedClassObj
    if (applyToAll) {
      updatedClassObj = {
        idle: clamped,
        walk: clamped,
        run: clamped,
        jump: clamped,
        dash_front: clamped,
        dash_back: clamped,
        attack1: clamped,
        attack2: clamped,
        special: clamped,
        special2: clamped,
      }
    } else {
      updatedClassObj = {
        ...(typeof currentClassObj === 'number'
          ? { idle: currentClassObj, walk: currentClassObj, run: currentClassObj, jump: currentClassObj, dash_front: currentClassObj, dash_back: currentClassObj, attack1: currentClassObj, attack2: currentClassObj, special: currentClassObj, special2: currentClassObj }
          : currentClassObj),
        [activeAnim]: clamped,
      }
    }

    const next = {
      ...offsets,
      [targetKey]: updatedClassObj,
    }

    setOffsets(next)
    saveClassOffsets(next)

    // Show saved notification
    setSavedBadge(true)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      setSavedBadge(false)
    }, 2200)
  }

  // Explicit Save Button
  const handleSaveScalesManual = () => {
    soundManager.playClick?.()
    saveClassScales(scales)
    saveClassOffsets(offsets)
    setSavedBadge(true)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      setSavedBadge(false)
    }, 2500)
  }

  // Reset all to default 100% and 0px offset
  const handleResetScales = () => {
    soundManager.playClick?.()
    setScales(DEFAULT_CLASS_SCALES)
    saveClassScales(DEFAULT_CLASS_SCALES)
    setOffsets(DEFAULT_CLASS_OFFSETS)
    saveClassOffsets(DEFAULT_CLASS_OFFSETS)
    setSavedBadge(true)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      setSavedBadge(false)
    }, 2500)
  }

  // Gender per class ('male' | 'female')
  const [genders, setGenders] = useState({
    knight: 'male',
    paladin: 'male',
    mage: 'male',
    healer: 'male',
  })

  // Synchronized Animation Action ('idle' | 'walk' | 'run' | 'jump' | 'dash_front' | 'dash_back')
  const [activeAnim, setActiveAnim] = useState('idle')
  const [animNonce, setAnimNonce] = useState(Date.now())
  // Continuous loop mode enabled by default so animations don't reset while scaling
  const [isLoopMode, setIsLoopMode] = useState(true)
  // Ground freeze mode for jump alignment (Frame 0 contact on floor)
  const [pauseJumpOnGround, setPauseJumpOnGround] = useState(false)
  const animTimerRef = useRef(null)

  // Copy scale & offset Y from 'idle' to currently active animation for a single class
  const handleCopyIdleToActive = (classId) => {
    soundManager.playClick?.()
    const champKey = getActiveChampKey(classId)
    const animScaleObj = scales[champKey] || scales[classId] || DEFAULT_ANIM_SCALES
    const animOffsetObj = offsets[champKey] || offsets[classId] || DEFAULT_ANIM_OFFSETS

    const idleScale = typeof animScaleObj === 'number' ? animScaleObj : (animScaleObj.idle ?? 1.0)
    const idleOffset = typeof animOffsetObj === 'number' ? animOffsetObj : (animOffsetObj.idle ?? 0)

    updateAndPersistScale(champKey, idleScale, false)
    updateAndPersistOffset(champKey, idleOffset, false)
  }

  // Copy idle scale & offset to active animation for ALL 4 classes and genders
  const handleCopyIdleToActiveAllClasses = () => {
    soundManager.playClick?.()
    const nextScales = { ...scales }
    const nextOffsets = { ...offsets }

    for (const champKey of CHAMPION_SCALE_KEYS) {
      const curScales = scales[champKey] || DEFAULT_ANIM_SCALES
      const curOffsets = offsets[champKey] || DEFAULT_ANIM_OFFSETS

      const idleScale = typeof curScales === 'number' ? curScales : (curScales.idle ?? 1.0)
      const idleOffset = typeof curOffsets === 'number' ? curOffsets : (curOffsets.idle ?? 0)

      nextScales[champKey] = {
        ...(typeof curScales === 'number' ? { idle: curScales } : curScales),
        [activeAnim]: idleScale,
      }
      nextOffsets[champKey] = {
        ...(typeof curOffsets === 'number' ? { idle: curOffsets } : curOffsets),
        [activeAnim]: idleOffset,
      }
    }

    setScales(nextScales)
    saveClassScales(nextScales)
    setOffsets(nextOffsets)
    saveClassOffsets(nextOffsets)

    setSavedBadge(true)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      setSavedBadge(false)
    }, 2200)
  }

  // Set global gender for all 4 simultaneously
  const handleSetGlobalGender = (g) => {
    soundManager.playClick?.()
    setGenders({
      knight: g,
      paladin: g,
      mage: g,
      healer: g,
    })
    setAnimNonce(Date.now())
  }

  // Set gender for a specific class
  const handleToggleClassGender = (classId, g) => {
    soundManager.playClick?.()
    setGenders((prev) => ({ ...prev, [classId]: g }))
    setAnimNonce(Date.now())
  }

  // Helper to get active champion key (e.g. 'paladin_male', 'paladin_female')
  const getActiveChampKey = (classId) => {
    const g = genders[classId] || 'male'
    return `${classId}_${g}`
  }

  // Adjust scale value strictly for the currently active animation (1 by 1)
  const handleScaleChange = (classId, delta) => {
    soundManager.playClick?.()
    const champKey = getActiveChampKey(classId)
    const animObj = scales[champKey] || scales[classId] || DEFAULT_ANIM_SCALES
    const cur = typeof animObj === 'number' ? animObj : (animObj[activeAnim] ?? animObj.idle ?? 1.0)
    updateAndPersistScale(champKey, cur + delta, false)
  }

  const handleSetScaleDirect = (classId, value) => {
    const champKey = getActiveChampKey(classId)
    updateAndPersistScale(champKey, parseFloat(value) || 1.0, false)
  }

  const handleApplyScaleToAllAnims = (classId, value) => {
    soundManager.playClick?.()
    const champKey = getActiveChampKey(classId)
    updateAndPersistScale(champKey, parseFloat(value) || 1.0, true)
  }

  // Adjust offset Y value (más arriba / más abajo)
  const handleOffsetChange = (classId, delta) => {
    soundManager.playClick?.()
    const champKey = getActiveChampKey(classId)
    const animObj = offsets[champKey] || offsets[classId] || DEFAULT_ANIM_OFFSETS
    const cur = typeof animObj === 'number' ? animObj : (animObj[activeAnim] ?? animObj.idle ?? 0)
    updateAndPersistOffset(champKey, cur + delta)
  }

  const handleSetOffsetDirect = (classId, value) => {
    const champKey = getActiveChampKey(classId)
    updateAndPersistOffset(champKey, parseInt(value, 10) || 0)
  }

  const handleApplyOffsetToAllAnims = (classId, value) => {
    soundManager.playClick?.()
    const champKey = getActiveChampKey(classId)
    updateAndPersistOffset(champKey, parseInt(value, 10) || 0, true)
  }

  // Trigger synchronized animation across ALL 4 classes AT THE SAME TIME
  const handleTriggerAll = (animKey) => {
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current)
      animTimerRef.current = null
    }
    soundManager.playClick?.()
    setActiveAnim(animKey)
    setAnimNonce(Date.now())

    // Sound effect
    try {
      let soundFile = null
      if (animKey === 'jump') soundFile = '/CHAMPIONS/KINA_MALE/sounds/jump.ogg'
      else if (animKey === 'dash_front') soundFile = '/CHAMPIONS/KINA_MALE/sounds/dash_front.ogg'
      else if (animKey === 'dash_back') soundFile = '/CHAMPIONS/KINA_MALE/sounds/dash_back.ogg'
      else if (animKey === 'run') soundFile = '/CHAMPIONS/KINA_MALE/sounds/run.ogg'
      else if (animKey === 'walk') soundFile = '/CHAMPIONS/KINA_MALE/sounds/walk.ogg'
      else if (animKey === 'attack1') soundFile = '/CHAMPIONS/KINA_MALE/sounds/attack1.ogg'
      else if (animKey === 'attack2') soundFile = '/CHAMPIONS/KINA_MALE/sounds/attack2.ogg'
      else if (animKey === 'special') soundFile = '/CHAMPIONS/KINA_MALE/sounds/special.ogg'
      else if (animKey === 'special2') soundFile = '/CHAMPIONS/KINA_MALE/sounds/special2.ogg'

      if (soundFile) {
        const audio = new Audio(soundFile)
        audio.volume = 0.8
        audio.play().catch(() => {})
      }
    } catch {}

    // Only auto-revert to idle if loop mode is explicitly turned off
    if (!isLoopMode && (animKey === 'jump' || animKey === 'dash_front' || animKey === 'dash_back' || animKey === 'attack1' || animKey === 'attack2' || animKey === 'special' || animKey === 'special2')) {
      animTimerRef.current = setTimeout(() => {
        setActiveAnim('idle')
        setAnimNonce(Date.now())
      }, 2000)
    }
  }

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!isStandalone) onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isStandalone])

  if (!isActuallyOpen) return null

  const currentBgUrl = MARKET_BACKGROUNDS[bgIndex]?.url || MARKET_BACKGROUNDS[0].url

  return (
    <div 
      className={`scale-workbench-overlay ${isStandalone ? 'is-standalone-workbench' : ''}`}
      style={{ backgroundImage: `url(${currentBgUrl})` }}
    >
      <div className="scale-workbench-backdrop" />

      {/* TOP HEADER CONTROLS */}
      <header className="scale-workbench-topbar">
        <div className="scale-workbench-title-box">
          <div className="scale-workbench-title-badge">
            <Store size={14} />
            <span>Mercado Celestial</span>
          </div>
          <span className="scale-workbench-title-text">
            {isStandalone ? 'Calibrador Dual en Vivo (0ms)' : 'Laboratorio de Escalas (4 Clases en Vivo)'}
          </span>
          {isStandalone && (
            <div className="scale-workbench-dual-live-tag" title="Sincronización instantánea activa con la ventana del juego principal">
              <span className="scale-workbench-dual-beacon" />
              <span>🟢 Enlace Dual en Vivo</span>
            </div>
          )}
        </div>

        <div className="scale-workbench-top-center-controls">
          {/* Global Gender Switcher */}
          <div className="scale-workbench-pill-group" role="group" aria-label="Sexo Global">
            <button
              type="button"
              className={`scale-workbench-pill-btn ${Object.values(genders).every(g => g === 'male') ? 'is-active' : ''}`}
              onClick={() => handleSetGlobalGender('male')}
            >
              <span>♂ Todos Hombres</span>
            </button>
            <button
              type="button"
              className={`scale-workbench-pill-btn ${Object.values(genders).every(g => g === 'female') ? 'is-active' : ''}`}
              onClick={() => handleSetGlobalGender('female')}
            >
              <span>♀ Todas Mujeres</span>
            </button>
          </div>

          {/* Floor Laser Guide Toggle */}
          <button
            type="button"
            className={`scale-workbench-pill-btn ${showFloorLine ? 'is-gold-active' : ''}`}
            onClick={() => setShowFloorLine(prev => !prev)}
            title="Alternar guía horizontal de pies para medir alineación exacta"
          >
            <span>📏 Nivel de Suelo: {showFloorLine ? 'ON' : 'OFF'}</span>
          </button>

          {/* Market Background Selector */}
          <div className="scale-workbench-pill-group" role="group" aria-label="Fondo">
            {MARKET_BACKGROUNDS.map((bg, idx) => (
              <button
                key={bg.id}
                type="button"
                className={`scale-workbench-pill-btn ${bgIndex === idx ? 'is-active' : ''}`}
                onClick={() => setBgIndex(idx)}
              >
                <span>{bg.name}</span>
              </button>
            ))}
          </div>

          {/* Popout to second window / Dual Screen */}
          {!isStandalone && (
            <button
              type="button"
              className="scale-workbench-pill-btn is-popout-btn"
              onClick={() => {
                soundManager.playClick?.()
                const url = `${window.location.origin}${window.location.pathname}?workbench=true`
                window.open(url, '_blank')
                onClose?.()
              }}
              title="Abrir en una ventana o pestaña aparte para usar en tu 2ª pantalla mientras juegas"
            >
              <ExternalLink size={14} />
              <span>🪟 Abrir en 2ª Pantalla</span>
            </button>
          )}

          {/* Focus Game Window (if in standalone) */}
          {isStandalone && (
            <button
              type="button"
              className="scale-workbench-pill-btn is-game-focus-btn"
              onClick={() => {
                soundManager.playClick?.()
                window.open('/', '_blank')
              }}
              title="Abrir o enfocar el juego en otra ventana"
            >
              <Gamepad2 size={14} />
              <span>🎮 Abrir Juego</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className="scale-workbench-pill-btn"
            onClick={handleToggleFullscreen}
            title="Alternar Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Scale Persistence Controls */}
          <div className="scale-workbench-pill-group" role="group" aria-label="Persistencia">
            <button
              type="button"
              className={`scale-workbench-pill-btn ${savedBadge ? 'is-saved-active' : ''}`}
              onClick={handleSaveScalesManual}
              title="Guardar escalas personalizadas en el almacenamiento persistente"
            >
              <Check size={14} />
              <span>{savedBadge ? '✓ ¡Escalas Guardadas!' : 'Guardar Escalas'}</span>
            </button>
            <button
              type="button"
              className="scale-workbench-pill-btn"
              onClick={handleResetScales}
              title="Restablecer todas las clases al 100% por defecto"
            >
              <RotateCcw size={13} />
              <span>Restablecer (100%)</span>
            </button>
          </div>
        </div>

        {/* Close Button / Exit */}
        {isStandalone ? (
          <button
            type="button"
            className="scale-workbench-btn-close"
            onClick={() => {
              soundManager.playClick?.()
              try { window.close() } catch {}
              window.location.href = '/'
            }}
            title="Cerrar esta pestaña y volver a la vista principal del juego"
          >
            <X size={16} />
            <span>Volver al Juego</span>
          </button>
        ) : (
          <button
            type="button"
            className="scale-workbench-btn-close"
            onClick={() => {
              soundManager.playClick?.()
              onClose?.()
            }}
          >
            <X size={16} />
            <span>Volver a Selección</span>
          </button>
        )}
      </header>

      {/* JUMP & ALIGNMENT GUIDANCE BANNER */}
      {activeAnim === 'jump' && (
        <div className="scale-workbench-jump-banner">
          <div className="scale-workbench-jump-banner-info">
            <span>✨ <strong>Alineación del Salto (Kina & Clases):</strong> El impacto en el suelo y el polvo ahora ocurren firmes en el nivel del piso. Usa <strong>Pausar en Suelo</strong> para alinear los pies al láser rojo, o presiona <strong>Igualar Salto a Idle</strong> para sincronizar la escala perfecta de reposo.</span>
          </div>
          <div className="scale-workbench-jump-banner-actions">
            <button
              type="button"
              className={`scale-workbench-pill-btn ${pauseJumpOnGround ? 'is-gold-active' : ''}`}
              onClick={() => {
                soundManager.playClick?.()
                setPauseJumpOnGround(prev => !prev)
              }}
              title="Pausar el salto en el fotograma 0 de contacto en el suelo para medir los pies con la línea láser"
            >
              <span>{pauseJumpOnGround ? '▶ Reanudar Salto' : '⏸ Pausar en Suelo (Frame 0)'}</span>
            </button>
            <button
              type="button"
              className="scale-workbench-pill-btn"
              onClick={handleCopyIdleToActiveAllClasses}
              title="Copiar la escala y posición de Reposo (Idle) al Salto para todas las clases"
              style={{ borderColor: 'rgba(234, 179, 8, 0.7)', color: '#facc15' }}
            >
              <span>📋 Igualar Salto a Idle (Todas)</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE: THE 4 CHARACTERS STANDING SIDE-BY-SIDE */}
      <main className="scale-workbench-stage">
        {showFloorLine && (
          <div className="scale-workbench-floor-laser">
            <span className="scale-workbench-floor-label">Nivel de Suelo (Alineación de Pies)</span>
          </div>
        )}

        {CLASSES_CONFIG.map((cls) => {
          const gender = genders[cls.id] || 'male'
          const folder = gender === 'female' ? cls.folderFemale : cls.folderMale
          const Icon = cls.icon
          const champKey = `${cls.id}_${gender}`
          const classAnimObj = scales[champKey] || scales[cls.id] || DEFAULT_ANIM_SCALES
          const classOffsetObj = offsets[champKey] || offsets[cls.id] || DEFAULT_ANIM_OFFSETS

          // Determine animation file (casters don't have run, use walk)
          let targetAnim = activeAnim
          if (targetAnim === 'run' && !cls.hasRun) {
            targetAnim = 'walk'
          }
          if ((targetAnim.startsWith('attack') || targetAnim.startsWith('special')) && cls.id !== 'knight') {
            targetAnim = 'idle'
          }

          const scale = typeof classAnimObj === 'number' ? classAnimObj : (classAnimObj[targetAnim] ?? classAnimObj.idle ?? 1.0)
          const offsetY = typeof classOffsetObj === 'number' ? classOffsetObj : (classOffsetObj[targetAnim] ?? classOffsetObj.idle ?? 0)
          const spriteUrl = (targetAnim === 'jump' && pauseJumpOnGround)
            ? `/CHAMPIONS/${folder}/jump_ground.png?v=${animNonce}`
            : `/CHAMPIONS/${folder}/${targetAnim}.webp?v=${animNonce}`

          return (
            <div key={cls.id} className="scale-workbench-class-col">
              {/* Class Header Title & Individual Gender Toggle */}
              <div className="scale-workbench-class-header" style={{ borderColor: `${cls.color}55` }}>
                <Icon size={16} color={cls.color} />
                <span className="scale-workbench-class-title" style={{ color: cls.color }}>
                  {cls.name}
                </span>

                <div className="scale-workbench-gender-mini">
                  <button
                    type="button"
                    className={`scale-workbench-gender-btn-mini ${gender === 'male' ? 'is-active' : ''}`}
                    onClick={() => handleToggleClassGender(cls.id, 'male')}
                    title="Hombre ♂"
                  >
                    ♂
                  </button>
                  <button
                    type="button"
                    className={`scale-workbench-gender-btn-mini ${gender === 'female' ? 'is-active' : ''}`}
                    onClick={() => handleToggleClassGender(cls.id, 'female')}
                    title="Mujer ♀"
                  >
                    ♀
                  </button>
                </div>
              </div>

              {/* Character Standing on Ground with Pedestal */}
              <div className="scale-workbench-actor-wrap">
                <div 
                  className="scale-workbench-pedestal" 
                  style={{ transform: `translateX(-50%) scale(${scale})` }} 
                />
                <img
                  key={`${folder}_${targetAnim}_${animNonce}`}
                  src={spriteUrl}
                  alt={cls.name}
                  className="scale-workbench-sprite"
                  style={{
                    transform: `translateX(-50%) translateY(${-offsetY}px) scale(${scale})`,
                  }}
                  draggable={false}
                />
              </div>

              {/* Real-time Scale & Position Y Controls */}
              <div className="scale-workbench-controls-box">
                {/* 1. Scale Row */}
                <div className="scale-workbench-value-label">
                  <span>Escala {gender === 'male' ? '♂' : '♀'} {ANIM_NAMES[targetAnim] || targetAnim}:</span>
                  <span className="scale-workbench-val-percent">
                    {Math.round(scale * 100)}%
                  </span>
                </div>

                <div className="scale-workbench-slider-row">
                  <button
                    type="button"
                    className="scale-workbench-btn-step"
                    onClick={() => handleScaleChange(cls.id, -0.05)}
                    title="Reducir escala 5%"
                  >
                    -5%
                  </button>

                  <input
                    type="range"
                    min="0.4"
                    max="2.5"
                    step="0.01"
                    value={scale}
                    onChange={(e) => handleSetScaleDirect(cls.id, e.target.value)}
                    className="scale-workbench-range"
                  />

                  <button
                    type="button"
                    className="scale-workbench-btn-step"
                    onClick={() => handleScaleChange(cls.id, 0.05)}
                    title="Aumentar escala 5%"
                  >
                    +5%
                  </button>

                  <button
                    type="button"
                    className="scale-workbench-btn-step"
                    onClick={() => handleSetScaleDirect(cls.id, 1.0)}
                    title="Restablecer al 100% esta animación"
                  >
                    100%
                  </button>

                  <button
                    type="button"
                    className="scale-workbench-btn-step"
                    onClick={() => handleSetScaleDirect(cls.id, 2.5)}
                    title="Escalar al 250% máximo"
                    style={{ borderColor: 'rgba(234, 179, 8, 0.6)', color: '#facc15' }}
                  >
                    250%
                  </button>

                  <button
                    type="button"
                    className="scale-workbench-btn-step"
                    style={{ borderColor: 'rgba(56, 189, 248, 0.5)', color: '#38bdf8', minWidth: '54px' }}
                    onClick={() => handleApplyScaleToAllAnims(cls.id, scale)}
                    title="Aplicar esta misma escala a todas las animaciones de esta clase"
                  >
                    🔗 Escala
                  </button>
                </div>

                {/* 2. Position Y Row (Más Arriba / Más Abajo) */}
                <div className="scale-workbench-value-label scale-workbench-offset-label">
                  <span>↕ Altura (Y):</span>
                  <span 
                    className="scale-workbench-val-offset"
                    style={{
                      color: offsetY > 0 ? '#4ade80' : offsetY < 0 ? '#f87171' : '#94a3b8',
                      fontWeight: 900
                    }}
                  >
                    {offsetY > 0 ? `+${offsetY}px (Arriba)` : offsetY < 0 ? `${offsetY}px (Abajo)` : '0px (Suelo)'}
                  </span>
                </div>

                <div className="scale-workbench-slider-row">
                  <button
                    type="button"
                    className="scale-workbench-btn-step"
                    onClick={() => handleOffsetChange(cls.id, -2)}
                    title="Bajar 2px más abajo (-2px)"
                  >
                    -2px
                  </button>

                  <input
                    type="range"
                    min="-40"
                    max="40"
                    step="1"
                    value={offsetY}
                    onChange={(e) => handleSetOffsetDirect(cls.id, e.target.value)}
                    className="scale-workbench-range scale-workbench-range-offset"
                  />

                  <button
                    type="button"
                    className="scale-workbench-btn-step"
                    onClick={() => handleOffsetChange(cls.id, 2)}
                    title="Subir 2px más arriba (+2px)"
                  >
                    +2px
                  </button>

                  <button
                    type="button"
                    className="scale-workbench-btn-step"
                    onClick={() => handleSetOffsetDirect(cls.id, 0)}
                    title="Restablecer altura a 0px (nivel de suelo)"
                  >
                    0px
                  </button>

                  <button
                    type="button"
                    className="scale-workbench-btn-step"
                    style={{ borderColor: 'rgba(74, 222, 128, 0.5)', color: '#4ade80', minWidth: '54px' }}
                    onClick={() => handleApplyOffsetToAllAnims(cls.id, offsetY)}
                    title="Aplicar esta misma altura Y a todas las animaciones de esta clase"
                  >
                    🔗 Y Todas
                  </button>
                </div>

                {/* 3. Quick Match / Copy from Idle when activeAnim !== 'idle' */}
                {targetAnim !== 'idle' && (
                  <div className="scale-workbench-slider-row" style={{ marginTop: '4px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="scale-workbench-btn-step is-copy-idle-btn"
                      onClick={() => handleCopyIdleToActive(cls.id)}
                      title={`Copiar la escala y altura Y exacta de Reposo (Idle) a ${ANIM_NAMES[targetAnim] || targetAnim}`}
                    >
                      📋 Igualar a Idle ({ANIM_NAMES[targetAnim] || targetAnim})
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </main>

      {/* BOTTOM SYNCHRONIZED ACTION BAR (TRIGGER ALL 4 AT THE SAME TIME) */}
      <footer className="scale-workbench-bottom-bar">
        <div className="scale-workbench-bottom-label">
          <Zap size={16} className="text-amber-400" />
          <span>Ejecutar Habilidad en las 4 Clases al Mismo Tiempo:</span>
        </div>

        <div className="scale-workbench-actions-btns">
          {/* Continuous Loop Mode Toggle for Live Calibration */}
          <button
            type="button"
            className={`scale-workbench-action-btn ${isLoopMode ? 'is-active' : ''}`}
            onClick={() => {
              soundManager.playClick?.()
              setIsLoopMode((prev) => {
                const nextVal = !prev
                if (!nextVal && (activeAnim === 'jump' || activeAnim === 'dash_front' || activeAnim === 'dash_back')) {
                  setActiveAnim('idle')
                }
                return nextVal
              })
            }}
            title="Bucle Continuo: Mantiene las animaciones de salto y dash repitiéndose sin detenerse para calibrar escalas en vivo"
            style={{
              borderColor: isLoopMode ? '#22c55e' : 'rgba(255, 255, 255, 0.2)',
              backgroundColor: isLoopMode ? 'rgba(34, 197, 94, 0.22)' : 'rgba(0, 0, 0, 0.4)',
              color: isLoopMode ? '#4ade80' : '#94a3b8',
              fontWeight: 600,
            }}
          >
            <Repeat size={14} />
            <span>Bucle Infinito: {isLoopMode ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            className={`scale-workbench-action-btn ${activeAnim === 'idle' ? 'is-active' : ''}`}
            onClick={() => handleTriggerAll('idle')}
          >
            <span>🧍 Reposo (Idle)</span>
          </button>

          <button
            type="button"
            className={`scale-workbench-action-btn ${activeAnim === 'walk' ? 'is-active' : ''}`}
            onClick={() => handleTriggerAll('walk')}
          >
            <span>🚶 Caminar (Walk)</span>
          </button>

          <button
            type="button"
            className={`scale-workbench-action-btn ${activeAnim === 'run' ? 'is-active' : ''}`}
            onClick={() => handleTriggerAll('run')}
          >
            <span>🏃 Correr (Run)</span>
          </button>

          <button
            type="button"
            className={`scale-workbench-action-btn ${activeAnim === 'jump' ? 'is-active' : ''}`}
            onClick={() => handleTriggerAll('jump')}
          >
            <span>⬆️ Saltar (Jump)</span>
          </button>

          {activeAnim === 'jump' && (
            <button
              type="button"
              className={`scale-workbench-action-btn ${pauseJumpOnGround ? 'is-gold-active' : ''}`}
              onClick={() => {
                soundManager.playClick?.()
                setPauseJumpOnGround(prev => !prev)
              }}
              title="Pausar o reanudar el salto en el fotograma 0 de contacto en el suelo para medir los pies con la línea láser"
              style={{
                borderColor: pauseJumpOnGround ? '#fbbf24' : 'rgba(234, 179, 8, 0.5)',
                color: '#facc15',
              }}
            >
              <span>{pauseJumpOnGround ? '▶ Reanudar Salto' : '⏸ Pausar en Suelo (Frame 0)'}</span>
            </button>
          )}

          <button
            type="button"
            className={`scale-workbench-action-btn ${activeAnim === 'dash_front' ? 'is-active' : ''}`}
            onClick={() => handleTriggerAll('dash_front')}
          >
            <span>💨 Dash Front</span>
          </button>

          <button
            type="button"
            className={`scale-workbench-action-btn ${activeAnim === 'dash_back' ? 'is-active' : ''}`}
            onClick={() => handleTriggerAll('dash_back')}
          >
            <span>🛡️ Dash Back</span>
          </button>

          <button
            type="button"
            className={`scale-workbench-action-btn ${activeAnim === 'attack1' ? 'is-active' : ''}`}
            onClick={() => handleTriggerAll('attack1')}
            title="Ataque Básico (Combo x3)"
          >
            <span>⚔️ Ataque Básico</span>
          </button>

          <button
            type="button"
            className={`scale-workbench-action-btn ${activeAnim === 'attack2' ? 'is-active' : ''}`}
            onClick={() => handleTriggerAll('attack2')}
            title="Golpe de Escudo (Shield Bash)"
          >
            <span>🛡️ Golpe Escudo</span>
          </button>

          <button
            type="button"
            className={`scale-workbench-action-btn ${activeAnim === 'special' ? 'is-active' : ''}`}
            onClick={() => handleTriggerAll('special')}
            title="Golpe Sísmico en Área (Ground Slam)"
          >
            <span>💥 Golpe Área</span>
          </button>

          <button
            type="button"
            className={`scale-workbench-action-btn ${activeAnim === 'special2' ? 'is-active' : ''}`}
            onClick={() => handleTriggerAll('special2')}
            title="Muro de Escudo / Guardia Férrea (Shield Wall)"
          >
            <span>🧱 Muro Escudo</span>
          </button>
        </div>
      </footer>
    </div>
  )
}
