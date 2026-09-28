import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  ArrowLeft, 
  Home, 
  Volume2, 
  VolumeX, 
  Compass, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  X,
  Swords,
  Shield,
  Gamepad2
} from 'lucide-react'
import { ChampionActor } from './ChampionActor'
import { soundManager } from '../utils/audio'
import { CLOUD_CITY_HALLS, CENTER_CITY_HALL_INDEX } from '../data/cloudCityData'
import './CloudCityScene.css'

/**
 * CloudCityScene — The Official Realm of the Clouds Hub City
 * Center: cloud_hall_4.jpg (Plaza Central de la Ciudad / Gran Puerta Dorada)
 * Features seamless corridor transitions, Paladin controls, and interactive NPCs.
 */
export function CloudCityScene({ championData, onBack, onGoHome }) {
  // Start in the city center: cloud_hall_4.jpg (Index 2)
  const [currentHallIndex, setCurrentHallIndex] = useState(CENTER_CITY_HALL_INDEX)
  const currentHall = CLOUD_CITY_HALLS[currentHallIndex]

  // Transition state
  const [transitionState, setTransitionState] = useState({
    active: false,
    direction: 'none', // 'right' | 'left'
    banner: null
  })
  const isTransitioningRef = useRef(false)
  const hallIndexRef = useRef(currentHallIndex)
  hallIndexRef.current = currentHallIndex

  // Audio mute state
  const [isMuted, setIsMuted] = useState(false)
  const bgAudioRef = useRef(null)

  // NPC dialogue state
  const [activeNpcDialog, setActiveNpcDialog] = useState(null)
  const [nearestNpc, setNearestNpc] = useState(null)

  // On-screen touch controls toggle
  const [showTouchControls, setShowTouchControls] = useState(false)

  // Player actor ref & live position
  const champActorRef = useRef(null)
  const playerPosRef = useRef({ x: 50, facing: 1, isMoving: false, moveDir: 0 })

  // Selected Champion from creation screen (dynamic based on user's choice)
  const initialClassId = championData?.classId || championData?.activeClass?.id || (() => {
    try {
      const saved = localStorage.getItem('rok_selected_champion')
      if (saved) return JSON.parse(saved)?.classId
    } catch {}
    return 'knight'
  })() || 'knight'

  const initialGender = (championData?.gender || (() => {
    try {
      const saved = localStorage.getItem('rok_selected_champion')
      if (saved) return JSON.parse(saved)?.gender
    } catch {}
    return 'male'
  })() || 'male').toLowerCase()

  const [activeClassId, setActiveClassId] = useState(initialClassId)
  const [activeGender, setActiveGender] = useState(initialGender)

  // Sync state whenever new championData is passed from character creation
  useEffect(() => {
    if (championData?.classId) {
      setActiveClassId(championData.classId)
    }
    if (championData?.gender) {
      setActiveGender(championData.gender.toLowerCase())
    }
  }, [championData])

  const championId = `${activeClassId}_${activeGender}`

  const classBadges = {
    knight: '🛡️ Caballero',
    paladin: '🏹 Paladín',
    mage: '🔮 Mago',
    healer: '✨ Sanador',
  }
  const displayBadge = classBadges[activeClassId] || '👑 Héroe'

  const defaultNames = {
    knight: 'Caballero Valeroso',
    paladin: 'Paladín Solarian',
    mage: 'Mago Astral',
    healer: 'Sanador Celestial',
  }
  const playerName = championData?.player_name?.trim() || defaultNames[activeClassId] || 'Héroe de las Nubes'

  // Initialize and loop ambient sound
  useEffect(() => {
    try {
      const audio = new Audio('/DEMO/MAPS/MAP1/1/ambient.ogg')
      audio.loop = true
      audio.volume = isMuted ? 0 : 0.35
      audio.play().catch(() => {})
      bgAudioRef.current = audio
    } catch {}

    return () => {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause()
        bgAudioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (bgAudioRef.current) {
      bgAudioRef.current.volume = isMuted ? 0 : 0.35
    }
  }, [isMuted])

  // Method to change corridor with direction and player repositioning
  const changeCorridor = useCallback((nextIdx, spawnSide = 'left') => {
    if (nextIdx < 0 || nextIdx >= CLOUD_CITY_HALLS.length) return
    if (isTransitioningRef.current) return

    isTransitioningRef.current = true
    const prevIdx = hallIndexRef.current
    const direction = nextIdx > prevIdx ? 'right' : 'left'
    const nextHall = CLOUD_CITY_HALLS[nextIdx]

    soundManager?.playClick?.()

    // Determine target spawn position
    // If entered from left edge -> spawn on right (x=91, facing left)
    // If entered from right edge -> spawn on left (x=9, facing right)
    const spawnX = spawnSide === 'left' ? 9 : 91
    const spawnFacing = spawnSide === 'left' ? 1 : -1

    // Close any open NPC dialog
    setActiveNpcDialog(null)
    setNearestNpc(null)

    // Trigger visual transition
    setTransitionState({
      active: true,
      direction,
      banner: {
        hallNumber: nextHall.hallNumber,
        hallName: nextHall.hallName,
        zoneTag: nextHall.zoneTag,
        description: nextHall.description,
        isCenter: !!nextHall.isCenter,
      }
    })

    setCurrentHallIndex(nextIdx)

    // Reposition Paladin in the new corridor
    setTimeout(() => {
      champActorRef.current?.setPosition?.(spawnX, spawnFacing)
      playerPosRef.current = { x: spawnX, facing: spawnFacing, isMoving: false, moveDir: 0 }
    }, 150)

    // Hide transition banner and unlock after cooldown
    setTimeout(() => {
      setTransitionState((prev) => ({ ...prev, active: false }))
    }, 1800)

    setTimeout(() => {
      isTransitioningRef.current = false
    }, 850)
  }, [])

  // Champion state listener: tracks position & triggers walking corridor transitions
  const handleChampionState = useCallback((state) => {
    if (!state) return

    const px = state.posX ?? state.x ?? 50
    const facing = state.facing ?? 1
    const isMoving = state.isMoving || state.anim === 'walk' || state.anim === 'run'
    const moveDir = state.moveDirection ?? (isMoving ? facing : 0)

    playerPosRef.current = { x: px, facing, isMoving, moveDir }

    // Proximity detection for NPCs in current hall
    const currentNpcs = currentHall?.npcs || []
    let foundNpc = null
    for (const npc of currentNpcs) {
      if (Math.abs(px - npc.x) <= 8.5) {
        foundNpc = npc
        break
      }
    }
    setNearestNpc(foundNpc)

    // Edge-of-corridor walking transition
    if (!isTransitioningRef.current) {
      const currentIdx = hallIndexRef.current

      // Walking right and reaches right boundary (px >= 93)
      if (px >= 93 && facing === 1 && moveDir > 0) {
        const nextIdx = currentHall.rightExitIndex ?? (currentIdx < CLOUD_CITY_HALLS.length - 1 ? currentIdx + 1 : 0)
        changeCorridor(nextIdx, 'left')
        return
      }

      // Walking left and reaches left boundary (px <= 7)
      if (px <= 7 && facing === -1 && moveDir < 0) {
        const prevIdx = currentHall.leftExitIndex ?? (currentIdx > 0 ? currentIdx - 1 : CLOUD_CITY_HALLS.length - 1)
        changeCorridor(prevIdx, 'right')
        return
      }
    }
  }, [currentHall, changeCorridor])

  // Keyboard shortcut 'E' to interact with nearest NPC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'e' || e.key === 'E') {
        if (nearestNpc) {
          soundManager?.playClick?.()
          setActiveNpcDialog(nearestNpc)
        }
      }
      if (e.key === 'Escape') {
        setActiveNpcDialog(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nearestNpc])

  // Manual corridor navigation buttons
  const handlePrevCorridor = () => {
    const prevIdx = currentHall.leftExitIndex ?? (currentHallIndex > 0 ? currentHallIndex - 1 : CLOUD_CITY_HALLS.length - 1)
    changeCorridor(prevIdx, 'right')
  }

  const handleNextCorridor = () => {
    const nextIdx = currentHall.rightExitIndex ?? (currentHallIndex < CLOUD_CITY_HALLS.length - 1 ? currentHallIndex + 1 : 0)
    changeCorridor(nextIdx, 'left')
  }

  return (
    <div className="cloud-city-scene-root" id="cloud-city-viewport">
      {/* 1. Main City Hall Background Layer */}
      <div 
        className={`cloud-city-bg-layer ${transitionState.active ? `transitioning transition-${transitionState.direction}` : ''}`}
        style={{ backgroundImage: `url("${currentHall.bg}")` }}
      >
        {/* Subtle atmospheric light bloom */}
        <div className="cloud-city-sky-vignette" />
      </div>

      {/* 2. Top Header Navigation & Minimap Ribbon */}
      <header className="cloud-city-header">
        <div className="city-header-left">
          <button
            type="button"
            id="city-btn-back-creator"
            className="city-nav-btn city-back-champ-btn"
            onClick={() => {
              soundManager?.playClick?.()
              onBack?.()
            }}
            title="Volver a la selección de personaje para elegir otro campeón"
          >
            <ArrowLeft size={16} />
            <span>← Cambiar Campeón</span>
          </button>

          {onGoHome && (
            <button
              type="button"
              id="city-btn-home"
              className="city-nav-btn"
              onClick={() => {
                soundManager?.playClick?.()
                onGoHome?.()
              }}
              title="Volver al Launcher Principal"
            >
              <Home size={16} />
              <span>Launcher</span>
            </button>
          )}

          <button
            type="button"
            className="city-icon-btn"
            onClick={() => setIsMuted((prev) => !prev)}
            title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        {/* Central Hall Name Indicator */}
        <div className="city-header-center">
          <div className="city-title-chip">
            <span className="city-realm-name">🏛️ REINO DE LAS NUBES</span>
            <span className="city-divider">•</span>
            <span className={`city-hall-name ${currentHall.isCenter ? 'is-center-hall' : ''}`}>
              {currentHall.isCenter ? '⭐ ' : ''}{currentHall.hallName}
            </span>
          </div>
          <div className="city-zone-subtitle">{currentHall.zoneTag}</div>
        </div>

        {/* Corridor Minimap Selector */}
        <div className="city-header-right">
          <div className="city-halls-nav-strip">
            {CLOUD_CITY_HALLS.map((hall, idx) => (
              <button
                key={hall.id}
                type="button"
                className={`city-hall-pill ${idx === currentHallIndex ? 'active' : ''} ${hall.isCenter ? 'is-center-pill' : ''}`}
                onClick={() => {
                  if (idx !== currentHallIndex) {
                    changeCorridor(idx, idx > currentHallIndex ? 'left' : 'right')
                  }
                }}
                title={hall.hallName}
              >
                {hall.isCenter ? '⭐ CENTRO' : `P${hall.hallNumber}`}
              </button>
            ))}
          </div>

          {/* Quick Champion Switcher */}
          <div className="city-champion-switcher">
            {[
              { id: 'knight', label: 'Caballero', icon: '🛡️' },
              { id: 'paladin', label: 'Paladín', icon: '🏹' },
              { id: 'mage', label: 'Mago', icon: '🔮' },
              { id: 'healer', label: 'Sanador', icon: '✨' },
            ].map((cls) => (
              <button
                key={cls.id}
                type="button"
                className={`city-champ-switch-btn ${activeClassId === cls.id ? 'active' : ''}`}
                onClick={() => {
                  soundManager?.playClick?.()
                  setActiveClassId(cls.id)
                }}
                title={`Cambiar a ${cls.label}`}
              >
                <span>{cls.icon}</span>
                <span className="champ-switch-label">{cls.label}</span>
              </button>
            ))}
            <button
              type="button"
              className="city-gender-switch-btn"
              onClick={() => {
                soundManager?.playClick?.()
                setActiveGender((prev) => (prev === 'male' ? 'female' : 'male'))
              }}
              title={`Alternar género: actualmente ${activeGender === 'male' ? 'Masculino ♂' : 'Femenino ♀'}`}
            >
              {activeGender === 'male' ? '♂' : '♀'}
            </button>
          </div>

          <button
            type="button"
            className={`city-icon-btn ${showTouchControls ? 'active' : ''}`}
            onClick={() => setShowTouchControls((prev) => !prev)}
            title="Alternar controles táctiles en pantalla"
          >
            <Gamepad2 size={18} />
          </button>
        </div>
      </header>

      {/* 3. Navigation Arrows to manually test corridors */}
      <button
        type="button"
        className="city-side-arrow city-arrow-left"
        onClick={handlePrevCorridor}
        title="Ir al pasillo anterior (o camina hacia el borde izquierdo)"
      >
        <ChevronLeft size={36} />
        <span className="arrow-label">Pasillo Anterior</span>
      </button>

      <button
        type="button"
        className="city-side-arrow city-arrow-right"
        onClick={handleNextCorridor}
        title="Ir al siguiente pasillo (o camina hacia el borde derecho)"
      >
        <span className="arrow-label">Pasillo Siguiente</span>
        <ChevronRight size={36} />
      </button>

      {/* 4. NPCs in the Current Hall */}
      <div className="city-npcs-layer" style={{ bottom: currentHall.groundOffset }}>
        {(currentHall.npcs || []).map((npc) => (
          <div
            key={npc.id}
            className={`city-npc-actor ${nearestNpc?.id === npc.id ? 'is-near' : ''}`}
            style={{ left: `${npc.x}%` }}
            onClick={() => {
              soundManager?.playClick?.()
              setActiveNpcDialog(npc)
            }}
          >
            {/* NPC Overhead Badge */}
            <div 
              className="city-npc-badge"
              style={{ borderColor: npc.badgeColor || '#38bdf8' }}
            >
              <Sparkles size={11} color={npc.badgeColor || '#38bdf8'} />
              <span>{npc.role}</span>
            </div>

            {/* NPC Sprite Portrait */}
            <div className="city-npc-sprite-wrap">
              <img
                src={npc.avatar}
                alt={npc.name}
                className="city-npc-img"
                draggable={false}
              />
              <div className="city-npc-shadow" />
            </div>

            {/* NPC Name Tag */}
            <div className="city-npc-name-tag">{npc.name}</div>

            {/* Proximity Interaction Prompt */}
            {nearestNpc?.id === npc.id && (
              <div className="city-npc-interact-prompt animate-bounce">
                <span className="prompt-key">E</span>
                <span className="prompt-text">Hablar</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 5. Champion Actor (Selected Player Character) */}
      <ChampionActor
        key={`${championId}_${playerName}`}
        champion={championId}
        name={playerName}
        nameProp={playerName}
        level={10}
        badge={displayBadge}
        initialX={currentHall.isCenter ? 50 : 25}
        bottomOffset={currentHall.groundOffset}
        minX={4}
        maxX={96}
        enableKeyboard={true}
        showHud={true}
        showOverhead={true}
        actorRef={champActorRef}
        onStateChange={handleChampionState}
      />

      {/* 6. Corridor Transition Banner / Toast */}
      {transitionState.banner && (
        <div className={`city-transition-toast ${transitionState.banner.isCenter ? 'center-gate' : ''}`}>
          <div className="city-toast-header">
            <span className="city-toast-hall">PASILLO {transitionState.banner.hallNumber} / 6</span>
            {transitionState.banner.isCenter && (
              <span className="city-toast-center-badge">⭐ CENTRO DE LA CIUDAD</span>
            )}
          </div>
          <h2 className="city-toast-title">{transitionState.banner.hallName}</h2>
          <p className="city-toast-desc">{transitionState.banner.description}</p>
          <div className="city-toast-zone">{transitionState.banner.zoneTag}</div>
        </div>
      )}

      {/* 7. Bottom Walking Instruction Card */}
      <div className="city-controls-hint-bar">
        <div className="hint-pill">
          <span className="hint-kbd">A</span> / <span className="hint-kbd">D</span>
          <span className="hint-txt">Moverse</span>
        </div>
        <div className="hint-pill">
          <span className="hint-kbd">Espacio</span>
          <span className="hint-txt">Saltar</span>
        </div>
        <div className="hint-pill">
          <span className="hint-kbd">Doble A/D</span>
          <span className="hint-txt">Correr</span>
        </div>
        <div className="hint-pill">
          <span className="hint-kbd">E</span>
          <span className="hint-txt">Hablar con NPCs</span>
        </div>
        <div className="hint-pill hint-pill-highlight">
          <Compass size={14} />
          <span className="hint-txt">Camina al borde izquierdo o derecho para cambiar de pasillo</span>
        </div>
      </div>

      {/* 8. On-screen Touch Controls (for Mobile & Quick Mouse Testing) */}
      {showTouchControls && (
        <div className="city-touch-controls">
          <div className="touch-group-dpad">
            <button
              type="button"
              className="touch-btn touch-btn-left"
              onPointerDown={() => champActorRef.current?.walk?.(-1)}
              onPointerUp={() => champActorRef.current?.walk?.(0)}
              onPointerLeave={() => champActorRef.current?.walk?.(0)}
            >
              ◀
            </button>
            <button
              type="button"
              className="touch-btn touch-btn-right"
              onPointerDown={() => champActorRef.current?.walk?.(1)}
              onPointerUp={() => champActorRef.current?.walk?.(0)}
              onPointerLeave={() => champActorRef.current?.walk?.(0)}
            >
              ▶
            </button>
          </div>
          <div className="touch-group-actions">
            <button
              type="button"
              className="touch-btn touch-btn-jump"
              onClick={() => champActorRef.current?.jump?.()}
            >
              SALTO
            </button>
            <button
              type="button"
              className="touch-btn touch-btn-dash"
              onClick={() => champActorRef.current?.dash?.(playerPosRef.current.facing)}
            >
              DASH
            </button>
          </div>
        </div>
      )}

      {/* 9. Interactive NPC Dialogue Modal */}
      {activeNpcDialog && (
        <div className="city-npc-dialog-backdrop" onClick={() => setActiveNpcDialog(null)}>
          <div className="city-npc-dialog-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="dialog-close-btn"
              onClick={() => setActiveNpcDialog(null)}
            >
              <X size={20} />
            </button>

            <div className="dialog-npc-portrait-col">
              <img
                src={activeNpcDialog.avatar}
                alt={activeNpcDialog.name}
                className="dialog-npc-avatar"
              />
              <div 
                className="dialog-npc-role-tag"
                style={{ backgroundColor: activeNpcDialog.badgeColor || '#38bdf8' }}
              >
                {activeNpcDialog.role}
              </div>
            </div>

            <div className="dialog-npc-content-col">
              <div className="dialog-npc-title-row">
                <h3 className="dialog-npc-name">{activeNpcDialog.name}</h3>
                <span className="dialog-npc-subtitle">{activeNpcDialog.title}</span>
              </div>

              <div className="dialog-npc-speech-bubble">
                <p>{activeNpcDialog.dialog}</p>
              </div>

              <div className="dialog-actions-row">
                <button
                  type="button"
                  className="dialog-action-btn primary"
                  onClick={() => {
                    soundManager?.playClick?.()
                    alert(`¡Función de ${activeNpcDialog.role} lista para conectarse con el sistema de inventario y misiones!`)
                    setActiveNpcDialog(null)
                  }}
                >
                  <Sparkles size={16} />
                  <span>Interactuar ({activeNpcDialog.role})</span>
                </button>
                <button
                  type="button"
                  className="dialog-action-btn secondary"
                  onClick={() => setActiveNpcDialog(null)}
                >
                  <span>Cerrar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CloudCityScene
