import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Plus, Hammer, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react'
import { BUILDING_TYPES, getMaxProductionBatches, getBuildingDef, getBuildingAnimationDuration } from '../data/buildingsData'
import { soundManager } from '../utils/audio'
import { toggleGameFullscreen, isFullscreenActive } from '../utils/fullscreen'
import { CitizensLayer } from './CitizensLayer'
import { PixiGameWorld } from './pixi/PixiGameWorld'
import { useTranslation } from '../i18n/index.jsx'

const RESOURCE_ICONS = {
  gold: '/assets/hud_icons/icon_gold.webp',
  wood: '/assets/hud_icons/icon_wood.webp',
  stone: '/assets/hud_icons/icon_stone.webp',
  food: '/assets/hud_icons/icon_food.webp',
  gems: '/assets/hud_icons/icon_gem.webp',
}

const RESOURCE_SYMBOLS = {
  gold: '/assets/hud_icons/icon_gold.webp',
  wood: '/assets/hud_icons/icon_wood.webp',
  stone: '/assets/hud_icons/icon_stone.webp',
  food: '/assets/hud_icons/icon_food.webp',
  gems: '/assets/hud_icons/icon_gem.webp',
}

function getBuildingGeneratedResources(buildingDef, t) {
  if (!buildingDef?.production) return []
  const order = ['gems', 'food', 'wood', 'stone', 'gold']
  const list = []
  order.forEach((key) => {
    if (buildingDef.production[key] > 0) {
      list.push({
        type: key,
        rate: buildingDef.production[key],
        icon: RESOURCE_ICONS[key],
        symbol: RESOURCE_SYMBOLS[key],
        name: t ? t(`resources.${key}`) : key,
      })
    }
  })
  return list
}

// Isometric ground footprint offsets (percentage of map height below slot.y)
const BUILDING_BASE_OFFSETS = {
  ayuntamiento: 0.5,
  castillo: 0.5,
  cuartel: 2.0,
  casa_molino: 2.0,
  archer_tower: 2.0,
  gold_mine: 1.5,
  mina_piedra: 1.5,
  portal: 1.5,
  casa: 1.5,
  molino: 1.5,
  almacen: 1.5,
}

export function GameWorld({ 
  slots, 
  vipStatus = {},
  activeStoryQuest = null,
  onSelectSlot, 
  onOpenBuildMenu, 
  onCollectFromSlot,
  onCitizenGift,
  onSpeedupBuilding,
  onToggleCinematic,
  isCinematicMode = false,
  soundEnabled = true,
  onToggleSound,
  fpsMode = '60fps',
  characterShadows = true,
  isSuspended = false,
  isFullscreen: externalIsFullscreen,
  onToggleFullscreen,
  engine = 'pixi',
}) {
  const { t } = useTranslation()
  const [activeEngine, setActiveEngine] = useState(engine)
  useEffect(() => {
    setActiveEngine(engine)
  }, [engine])

  const [internalIsFullscreen, setInternalIsFullscreen] = useState(isFullscreenActive)
  const isFullscreen = externalIsFullscreen !== undefined ? externalIsFullscreen : internalIsFullscreen

  useEffect(() => {
    const handleFsChange = () => {
      setInternalIsFullscreen(isFullscreenActive())
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    document.addEventListener('webkitfullscreenchange', handleFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
      document.removeEventListener('webkitfullscreenchange', handleFsChange)
    }
  }, [])

  // Local tick to ensure countdowns, ghost transitions and harvest states re-render smoothly (suspended in combat)
  const [, setWorldTick] = useState(0)
  const hasActiveConstruction = useMemo(() => slots.some((s) => s.isConstructing), [slots])
  useEffect(() => {
    if (isSuspended) return
    // When buildings are constructing, tick every 1000ms for accurate progress bar countdowns.
    // When idle / harvesting, tick every 10,000ms (reduces 90% of idle re-renders).
    const intervalMs = hasActiveConstruction ? 1000 : 10000
    const timer = setInterval(() => setWorldTick((t) => t + 1), intervalMs)
    return () => clearInterval(timer)
  }, [isSuspended, hasActiveConstruction])
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredSlot, setHoveredSlot] = useState(null)
  const [floatingEffects, setFloatingEffects] = useState([])
  const [containerSize, setContainerSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  })

  const containerRef = useRef(null)

  // Track viewport size dynamically to keep the map in pure Cover Mode
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth || window.innerWidth
        const h = containerRef.current.clientHeight || window.innerHeight
        setContainerSize({ width: w, height: h })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSize) : null
    if (ro && containerRef.current) {
      ro.observe(containerRef.current)
    }
    return () => {
      window.removeEventListener('resize', updateSize)
      ro?.disconnect()
    }
  }, [])

  // Modo Cover: Escala base exacta para que el mapa de 1920x1080 cubra el 100% de la ventana sin bordes
  const coverScale = Math.max(containerSize.width / 1920, containerSize.height / 1080)
  const currentScale = coverScale * zoom

  // Restricción estricta de pan para que el mapa NUNCA descubra fondo vacío en ningún borde
  const scaledWidth = 1920 * currentScale
  const scaledHeight = 1080 * currentScale
  const maxPanX = Math.max(0, (scaledWidth - containerSize.width) / 2)
  const maxPanY = Math.max(0, (scaledHeight - containerSize.height) / 2)

  // GARANTÍA MATEMÁTICA: Si el zoom, la escala o el tamaño de la ventana cambian,
  // re-clamp inmediato del pan para evitar que quede fuera de límites o muestre fondo negro
  useEffect(() => {
    setPan((prev) => {
      const clampedX = Math.max(-maxPanX, Math.min(maxPanX, prev.x))
      const clampedY = Math.max(-maxPanY, Math.min(maxPanY, prev.y))
      if (clampedX === prev.x && clampedY === prev.y) return prev
      return { x: clampedX, y: clampedY }
    })
  }, [maxPanX, maxPanY, zoom, containerSize.width, containerSize.height])

  const dragStartRef = useRef({ x: 0, y: 0 })
  const pointerStartPosRef = useRef(null)
  const isPointerDownRef = useRef(false)
  const rafIdRef = useRef(null)
  const pendingPanRef = useRef(null)
  const lastPanTimeRef = useRef(0)

  // Multi-touch pinch-to-zoom & smooth gesture tracking
  const activePointersRef = useRef(new Map())
  const initialPinchDistRef = useRef(null)
  const initialZoomRef = useRef(1)
  const isInteractingRef = useRef(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const interactionTimerRef = useRef(null)
  const wheelRafRef = useRef(null)
  const pendingWheelRef = useRef({ zoomDelta: 0, panX: 0, panY: 0 })

  // Cancel any pending RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      if (wheelRafRef.current) cancelAnimationFrame(wheelRafRef.current)
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current)
    }
  }, [])

  const handlePointerDown = (e) => {
    // Si se hace clic en botones o recursos flotantes, no iniciar arrastre
    if (e.target.closest('button, .structure-resource-float, .build-here-btn')) {
      return
    }

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (activePointersRef.current.size === 1) {
      if (e.button === 0 || e.button === 1 || e.pointerType === 'touch') {
        isPointerDownRef.current = true
        pointerStartPosRef.current = { x: e.clientX, y: e.clientY }
        dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
      }
    } else if (activePointersRef.current.size === 2) {
      // Two-finger pinch detected on mobile screen
      const pts = Array.from(activePointersRef.current.values())
      initialPinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      initialZoomRef.current = zoom
      setIsInteracting(true)
      isInteractingRef.current = true
      isPointerDownRef.current = false
    }
  }

  // Butter-smooth 60 FPS gesture and dragging pipeline
  const handlePointerMove = (e) => {
    if (!activePointersRef.current.has(e.pointerId)) return
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    // 1. Multi-touch Pinch to Zoom on Mobile
    if (activePointersRef.current.size >= 2 && initialPinchDistRef.current) {
      const pts = Array.from(activePointersRef.current.values())
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      if (currentDist > 8 && initialPinchDistRef.current > 8) {
        const factor = currentDist / initialPinchDistRef.current
        const targetZoom = Math.min(2.5, Math.max(1.0, Number((initialZoomRef.current * factor).toFixed(3))))

        if (!rafIdRef.current) {
          rafIdRef.current = requestAnimationFrame((timestamp) => {
            rafIdRef.current = null
            if (fpsMode === 'eco' && timestamp - lastPanTimeRef.current < 30.0) return
            lastPanTimeRef.current = timestamp
            setZoom(targetZoom)
          })
        }
      }
      return
    }

    // 2. Single-finger Pan / Mouse Drag
    if (!isPointerDownRef.current || !pointerStartPosRef.current) return
    const dist = Math.hypot(e.clientX - pointerStartPosRef.current.x, e.clientY - pointerStartPosRef.current.y)
    
    // Solo activar arrastre si se desplaza más de 6px (distingue clic de arrastre)
    if (dist > 6) {
      if (!isDragging) {
        setIsDragging(true)
        setIsInteracting(true)
        isInteractingRef.current = true
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {}
      }
      const rawX = e.clientX - dragStartRef.current.x
      const rawY = e.clientY - dragStartRef.current.y
      const clampedX = Math.max(-maxPanX, Math.min(maxPanX, rawX))
      const clampedY = Math.max(-maxPanY, Math.min(maxPanY, rawY))

      pendingPanRef.current = { x: clampedX, y: clampedY }

      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame((timestamp) => {
          rafIdRef.current = null
          if (fpsMode === 'eco' && timestamp - lastPanTimeRef.current < 30.0) {
            rafIdRef.current = requestAnimationFrame((nextTimestamp) => {
              rafIdRef.current = null
              lastPanTimeRef.current = nextTimestamp
              if (pendingPanRef.current) {
                setPan(pendingPanRef.current)
              }
            })
            return
          }
          lastPanTimeRef.current = timestamp
          if (pendingPanRef.current) {
            setPan(pendingPanRef.current)
          }
        })
      }
    }
  }

  const handlePointerUp = (e) => {
    activePointersRef.current.delete(e.pointerId)
    if (activePointersRef.current.size < 2) {
      initialPinchDistRef.current = null
    }
    if (activePointersRef.current.size === 0) {
      isPointerDownRef.current = false
      pointerStartPosRef.current = null
      setIsInteracting(false)
      isInteractingRef.current = false
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      if (pendingPanRef.current) {
        setPan(pendingPanRef.current)
        pendingPanRef.current = null
      }
      if (isDragging) {
        setIsDragging(false)
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {}
      }
    }
  }

  // Listener pasivo/acelerado para zoom con rueda del ratón y desplazamiento con trackpad
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleWheel = (e) => {
      e.preventDefault()

      let zd = 0
      let px = 0
      let py = 0

      if (e.ctrlKey) {
        // Gesto Pinch-to-zoom en Mac trackpad o Ctrl+Wheel
        zd = e.deltaY * -0.012
      } else if (Math.abs(e.deltaX) === 0 && Math.abs(e.deltaY) >= 40) {
        // Rueda física normal
        zd = e.deltaY * -0.0014
      } else {
        // Desplazamiento con 2 dedos en trackpad
        px = -e.deltaX
        py = -e.deltaY
      }

      pendingWheelRef.current.zoomDelta += zd
      pendingWheelRef.current.panX += px
      pendingWheelRef.current.panY += py

      if (!isInteractingRef.current) {
        setIsInteracting(true)
        isInteractingRef.current = true
      }

      if (!wheelRafRef.current) {
        wheelRafRef.current = requestAnimationFrame(() => {
          wheelRafRef.current = null
          const { zoomDelta: curZd, panX: curPx, panY: curPy } = pendingWheelRef.current
          pendingWheelRef.current = { zoomDelta: 0, panX: 0, panY: 0 }

          if (curZd !== 0) {
            setZoom((prev) => Math.min(2.5, Math.max(1.0, Number((prev + curZd).toFixed(3)))))
          }
          if (curPx !== 0 || curPy !== 0) {
            setPan((prev) => ({
              x: Math.max(-maxPanX, Math.min(maxPanX, prev.x + curPx)),
              y: Math.max(-maxPanY, Math.min(maxPanY, prev.y + curPy)),
            }))
          }

          clearTimeout(interactionTimerRef.current)
          interactionTimerRef.current = setTimeout(() => {
            setIsInteracting(false)
            isInteractingRef.current = false
          }, 120)
        })
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
      if (wheelRafRef.current) cancelAnimationFrame(wheelRafRef.current)
    }
  }, [maxPanX, maxPanY])

  const resetView = () => {
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
    soundManager.playClick()
  }

  const effectTimeoutsRef = useRef([])

  useEffect(() => {
    return () => {
      effectTimeoutsRef.current.forEach((t) => clearTimeout(t))
    }
  }, [])

  const triggerFloatingEffect = (target, text, items = null) => {
    // If target is a building slot, offset y by -14% so it spawns ABOVE the roof and harvest bubble
    // If target is a citizen, offset y by -5%
    const isBuilding = !!target?.buildingId
    const yOffset = isBuilding ? 14 : 5

    const newEffect = {
      id: Date.now() + Math.random(),
      x: target.x,
      y: Math.max(2, target.y - yOffset),
      text,
      items
    }
    setFloatingEffects((prev) => [...prev.slice(-6), newEffect])
    soundManager.playCollect()

    const t = setTimeout(() => {
      setFloatingEffects((prev) => prev.filter((eff) => eff.id !== newEffect.id))
    }, 1500)
    effectTimeoutsRef.current.push(t)
  }

  const handleBuildingClick = (e, slot) => {
    e.stopPropagation()
    soundManager.playClick()
    if (!slot.buildingId) {
      onOpenBuildMenu(slot)
    } else {
      soundManager.playBuildingSound(slot.buildingId, slot.isConstructing)
      onSelectSlot(slot)
    }
  }

  const handlePixiCollect = (slot, coords, resType) => {
    const buildingDef = slot.buildingId ? (getBuildingDef(slot.buildingId) || BUILDING_TYPES[slot.buildingId.toUpperCase()]) : null
    if (buildingDef) {
      const produced = getBuildingGeneratedResources(buildingDef, t)
      const primaryRes = produced[0]
      const lvl = slot.level || 1
      const cycleSec = (buildingDef.productionCycleSec || 120) * (vipStatus?.hasEngineering ? 0.75 : 1)
      const now = Date.now()
      const lastHarvest = slot.lastHarvestAt || (now - 60000)
      const elapsed = Math.max(0, (now - lastHarvest) / 1000)
      const maxBatches = getMaxProductionBatches(vipStatus?.hasOneClickHarvest || vipStatus?.hasEngineering)
      const batchRatio = Math.min(maxBatches, elapsed / cycleSec)

      const items = produced.map(p => ({
        type: p.type,
        icon: p.icon,
        name: t('resources.' + p.type) || p.name,
        amount: Math.max(1, Math.floor(p.rate * lvl * batchRatio))
      }))
      const floatText = items.map(it => `+${it.amount} ${it.name}`).join(' ')
      triggerFloatingEffect(slot, floatText, items)
    }
    onCollectFromSlot?.(slot, coords, resType)
  }

  return (
    <div 
      className={`gameworld-container ${isDragging ? 'is-dragging' : ''} ${isInteracting ? 'is-interacting' : ''}`}
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Zoom Controls Overlay */}
      <div className={`gameworld-zoom-controls ${isCinematicMode ? 'cinematic-view' : ''}`}>
        {!isCinematicMode && (
          <>
            <button 
              id="map-btn-fullscreen"
              className={`map-ctrl-btn candy-map-btn fullscreen-map-btn ${isFullscreen ? 'active is-fullscreen' : ''}`}
              onClick={() => {
                soundManager.playClick?.()
                if (onToggleFullscreen) {
                  onToggleFullscreen()
                } else {
                  toggleGameFullscreen()
                }
              }}
              title={isFullscreen ? `${t('hud.fullscreen')} (Esc)` : t('hud.fullscreen')}
              aria-label={t('hud.fullscreen')}
            >
              {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
            </button>

            <button 
              id="map-btn-zoom-in"
              className="map-ctrl-btn candy-map-btn" 
              onClick={() => { setZoom(z => Math.min(z + 0.2, 2.5)); soundManager.playClick() }}
              title="Acercar mapa (+)"
              aria-label="Acercar mapa"
            >
              <img src="/assets/hud_icons/btn_zoom_in.webp" alt="Zoom In" className="hud-ctrl-candy" draggable="false" />
            </button>
            <button 
              id="map-btn-zoom-out"
              className="map-ctrl-btn candy-map-btn" 
              onClick={() => { setZoom(z => Math.max(z - 0.2, 1.0)); soundManager.playClick() }}
              title="Alejar mapa (-)"
              aria-label="Alejar mapa"
            >
              <img src="/assets/hud_icons/btn_zoom_out.webp" alt="Zoom Out" className="hud-ctrl-candy" draggable="false" />
            </button>

            <button 
              className={`map-ctrl-btn candy-map-btn sound-ctrl-btn ${soundEnabled ? 'active playing' : 'is-muted'}`}
              onClick={() => {
                soundManager.playClick()
                onToggleSound?.()
              }}
              title={soundEnabled ? 'Silenciar música y efectos' : 'Activar sonido'}
              aria-label="Alternar Sonido"
            >
              <img 
                src="/assets/hud_icons/btn_sound.webp" 
                alt="Sonido" 
                className={`hud-ctrl-candy ${!soundEnabled ? 'muted' : ''}`} 
                draggable="false" 
              />
            </button>
          </>
        )}
        <button 
          className={`map-ctrl-btn candy-map-btn ${isCinematicMode ? 'active-cinematic' : ''}`}
          onClick={() => {
            soundManager.playClick()
            onToggleCinematic?.()
          }}
          title={isCinematicMode ? "Mostrar Interfaz (H / Esc)" : "Modo Panorámico / Ocultar Todo (H)"}
        >
          {isCinematicMode ? <EyeOff size={22} /> : <Eye size={22} />}
        </button>
      </div>

      {/* 1. Pixi.js v8 GPU Accelerated Render Engine */}
      {activeEngine === 'pixi' && (
        <PixiGameWorld
          slots={slots}
          vipStatus={vipStatus}
          onSelectSlot={onSelectSlot}
          onOpenBuildMenu={onOpenBuildMenu}
          onCollectFromSlot={handlePixiCollect}
          onCitizenGift={(citizen, gift) => {
            triggerFloatingEffect(citizen, gift.text)
            onCitizenGift?.(citizen, gift)
          }}
          isSuspended={isSuspended}
          soundEnabled={soundEnabled}
          zoom={zoom}
          pan={pan}
          setPan={setPan}
          fpsMode={fpsMode}
          characterShadows={characterShadows}
          onError={(err) => {
            console.warn('[GameWorld] Pixi engine init error, falling back to DOM:', err)
            setActiveEngine('dom')
            if (typeof document !== 'undefined') {
              document.documentElement.setAttribute('data-active-engine', 'dom')
            }
          }}
        />
      )}

      {/* 2. Legacy DOM Scene (Fallback only if activeEngine === 'dom') */}
      {activeEngine === 'dom' && (
        <div 
          className="gameworld-scene"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${currentScale})`,
            zIndex: 1,
          }}
        >
          {/* Plaza Building Slots */}
        <div className="plaza-slots-layer">
          {(() => {
            const isBuildQuest = activeStoryQuest?.actionType === 'build'
            const recommendedSlot = isBuildQuest ? slots.find((s) => !s.buildingId) : null
            const targetDef = activeStoryQuest?.targetBuilding ? (getBuildingDef(activeStoryQuest.targetBuilding) || BUILDING_TYPES[activeStoryQuest.targetBuilding.toUpperCase()]) : null

            return slots.map((slot) => {
              const buildingDef = slot.buildingId ? (getBuildingDef(slot.buildingId) || BUILDING_TYPES[slot.buildingId.toUpperCase()]) : null
              const isHovered = hoveredSlot === slot.id
              const baseOffset = slot.buildingId ? (BUILDING_BASE_OFFSETS[slot.buildingId] || 3.5) : 0
              const isRecommendedPlot = recommendedSlot && recommendedSlot.id === slot.id

              return (
                <div 
                  key={slot.id}
                  className={`building-plot ${slot.buildingId ? 'has-building' : 'is-empty'} ${slot.isConstructing ? 'in-construction' : ''}`}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    zIndex: Math.round((slot.y + baseOffset) * 10),
                  }}
                  onClick={(e) => handleBuildingClick(e, slot)}
                  onMouseEnter={() => setHoveredSlot(slot.id)}
                  onMouseLeave={() => setHoveredSlot(null)}
                >
                  {/* Empty Slot — circular + button (no rectangular guides) */}
                  {!slot.buildingId && !slot.isConstructing && (
                    <div className={`empty-slot-marker ${isRecommendedPlot ? 'is-recommended-plot' : ''}`}>
                      <button className="build-here-btn" aria-label="Construir aquí">+</button>
                    </div>
                  )}

                {/* Building Under Construction */}
                {slot.buildingId && slot.isConstructing && buildingDef && (() => {
                  const now = Date.now()
                  const durationSec = slot.constructionDurationSec || buildingDef.buildTimeSec || 60
                  const elapsedSec = slot.constructionStartedAt ? Math.max(0, (now - slot.constructionStartedAt) / 1000) : 0
                  const remainingSec = Math.max(0, Math.ceil(durationSec - elapsedSec))
                  const progressPct = Math.min(100, Math.max(0, (elapsedSec / durationSec) * 100))
                  
                  const freeThresholdSec = vipStatus.hasEngineering ? 300 : 180
                  const isFree = remainingSec <= freeThresholdSec
                  const gemCost = isFree ? 0 : Math.max(1, Math.ceil(remainingSec / 50))

                  const mins = Math.floor(remainingSec / 60)
                  const secs = Math.floor(remainingSec % 60)
                  const timeFormatted = `${mins}:${secs.toString().padStart(2, '0')}`

                  // Show ghost blueprint + animated construction overlay throughout the entire build
                  return (
                    <div className="constructing-wrapper">
                      {/* Ghost blueprint base (semi-transparent final building) */}
                      <div className="building-ghost-wrap">
                        <img 
                          key={`${slot.id}-ghost`}
                          src={buildingDef.image} 
                          alt={`${buildingDef.name} (En construcción)`} 
                          className={`building-sprite building-ghost sprite-${slot.buildingId}`}
                          draggable="false"
                        />
                        <div className="ghost-blueprint-aura" />
                      </div>
                      <div className="construction-indicator">
                        <Hammer className="hammer-anim" size={16} />
                        <div className="construction-indicator-center">
                          <span className="construction-timer-text">{timeFormatted}</span>
                          <div className="progress-bar-wrap">
                            <div 
                              className="progress-bar-fill" 
                              style={{ width: `${progressPct}%` }} 
                            />
                          </div>
                        </div>
                        <button 
                          className={`btn-speedup-quick ${isFree ? 'is-free' : ''}`}
                          title={isFree ? t('buildings.freeSpeedupBtn') : t('buildings.instantFinishGems', { cost: gemCost })}
                          onClick={(e) => {
                            e.stopPropagation()
                            onSpeedupBuilding?.(slot)
                          }}
                        >
                          {isFree ? (
                            <span className="speedup-label-box">
                              <img src="/assets/hud_icons/icon_speedup.webp" alt={t('common.free')} className="mini-res-icon" /> {t('common.free')}
                            </span>
                          ) : (
                            <span className="speedup-label-box">
                              <img src="/assets/hud_icons/icon_gem.webp" alt={t('resources.gems')} className="mini-res-icon" /> {gemCost}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })()}

                {/* Completed Building */}
                {slot.buildingId && !slot.isConstructing && buildingDef && (() => {
                  const produced = getBuildingGeneratedResources(buildingDef, t)
                  const primaryRes = produced[0]
                  const secondaryRes = produced[1]
                  const lvl = slot.level || 1
                  const localizedBldName = t(`buildings.slots.${slot.buildingId}.name`) || buildingDef.name

                  // Calculate batch accumulation based on real production cycle
                  const cycleSec = (buildingDef.productionCycleSec || 120) * (vipStatus?.hasEngineering ? 0.75 : 1)
                  const now = Date.now()
                  const lastHarvest = slot.lastHarvestAt || (now - 60000)
                  const elapsed = Math.max(0, (now - lastHarvest) / 1000)
                  const maxBatches = getMaxProductionBatches(vipStatus?.hasOneClickHarvest || vipStatus?.hasEngineering)
                  const batchRatio = Math.min(maxBatches, elapsed / cycleSec)
                  const isReadyToHarvest = produced.length > 0 && batchRatio >= 0.25
                  const isFull = batchRatio >= maxBatches

                  return (
                    <div className="building-rendered">
                      {/* Level Pill */}
                      <div className="building-level-tag">
                        <span>{t('common.levelShort')} {slot.level}</span>
                      </div>

                      {/* Resource Production Floating Icon (Centrado Arriba) */}
                      {isReadyToHarvest && (
                        <div 
                          className={`structure-resource-float ${isFull ? 'is-full-pulsing' : ''}`} 
                          title={t('hud.inspectProduction', {
                            name: localizedBldName,
                            produced: produced.map(p => `+${Math.max(1, Math.floor(p.rate * lvl * batchRatio))} ${t('resources.' + p.type) || p.name}`).join(', '),
                            status: isFull ? `[${t('common.warehouseFull')}]` : ''
                          })}
                          onClick={(e) => {
                            e.stopPropagation()
                            const items = produced.map(p => ({
                              type: p.type,
                              icon: p.icon,
                              name: t('resources.' + p.type) || p.name,
                              amount: Math.max(1, Math.floor(p.rate * lvl * batchRatio))
                            }))
                            const floatText = items.map(it => `+${it.amount} ${it.name}`).join(' ')
                            triggerFloatingEffect(slot, floatText, items)
                            onCollectFromSlot(slot, { clientX: e.clientX, clientY: e.clientY }, primaryRes.type)
                          }}
                        >
                          <div className={`resource-float-disc res-${primaryRes.type}`}>
                            <img 
                              src={primaryRes.icon} 
                              alt={t('resources.' + primaryRes.type) || primaryRes.name} 
                              className="resource-float-img" 
                              draggable="false" 
                            />
                            {secondaryRes && (
                              <div className={`resource-mini-disc res-${secondaryRes.type}`} title={t('resources.' + secondaryRes.type) || secondaryRes.name}>
                                <img 
                                  src={secondaryRes.icon} 
                                  alt={t('resources.' + secondaryRes.type) || secondaryRes.name} 
                                  className="resource-mini-img" 
                                  draggable="false" 
                                />
                              </div>
                            )}
                            {isFull && (
                              <div className="resource-full-badge">
                                <span>{t('common.full')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Building Sprite Image (Static, zero structure animations) */}
                      <img 
                        key={`${slot.id}-active`}
                        src={buildingDef.poster || buildingDef.image} 
                        alt={localizedBldName} 
                        className={`building-sprite active-building sprite-${slot.buildingId}`}
                        draggable="false"
                      />

                      {/* Informative Hover Card (Posicionado Arriba de la Edificación) */}
                      {isHovered && (
                        <div className={`building-hover-card ${isReadyToHarvest ? 'with-harvest-bubble' : ''}`}>
                          <div className="bld-hover-header">
                            <h4>{localizedBldName}</h4>
                            <span className="bld-level">{t('common.levelShort')} {slot.level}</span>
                          </div>
                          <div className="bld-hover-stats">
                            {buildingDef.production?.gold > 0 && (
                              <span className="bld-prod gold">
                                <img src="/assets/hud_icons/icon_gold.webp" alt="Oro" className="hover-stat-icon" style={{ width: 13, height: 13, objectFit: 'contain' }} /> +{buildingDef.production.gold * lvl}{t('common.perCycle')}
                              </span>
                            )}
                            {buildingDef.production?.wood > 0 && (
                              <span className="bld-prod wood">
                                <img src="/assets/hud_icons/icon_wood.webp" alt="Madera" className="hover-stat-icon" style={{ width: 13, height: 13, objectFit: 'contain' }} /> +{buildingDef.production.wood * lvl}{t('common.perCycle')}
                              </span>
                            )}
                            {buildingDef.production?.stone > 0 && (
                              <span className="bld-prod stone">
                                <img src="/assets/hud_icons/icon_stone.webp" alt="Piedra" className="hover-stat-icon" style={{ width: 13, height: 13, objectFit: 'contain' }} /> +{buildingDef.production.stone * lvl}{t('common.perCycle')}
                              </span>
                            )}
                            {buildingDef.production?.food > 0 && (
                              <span className="bld-prod food">
                                <img src="/assets/hud_icons/icon_food.webp" alt="Comida" className="hover-stat-icon" style={{ width: 13, height: 13, objectFit: 'contain' }} /> +{buildingDef.production.food * lvl}{t('common.perCycle')}
                              </span>
                            )}
                            {buildingDef.production?.gems > 0 && (
                              <span className="bld-prod gems">
                                <img src="/assets/hud_icons/icon_gem.webp" alt="Gemas" className="hover-stat-icon" style={{ width: 13, height: 13, objectFit: 'contain' }} /> +{buildingDef.production.gems * lvl}{t('common.perCycle')}
                              </span>
                            )}
                            {buildingDef.defense > 0 && (
                              <span className="bld-prod defense">
                                <img src="/assets/hud_icons/icon_shield.webp" alt="Defensa" className="hover-stat-icon" style={{ width: 13, height: 13, objectFit: 'contain' }} /> +{buildingDef.defense} {t('common.defense')}
                              </span>
                            )}
                            {buildingDef.populationProvided > 0 && (
                              <span className="bld-prod pop">
                                <img src="/assets/hud_icons/icon_population.webp" alt="Población" className="hover-stat-icon" style={{ width: 13, height: 13, objectFit: 'contain' }} /> +{buildingDef.populationProvided * lvl} {t('resources.population')}
                              </span>
                            )}
                            {buildingDef.id === 'cuartel' && (
                              <span className="bld-prod army">
                                <img src="/assets/hud_icons/btn_army.webp" alt="Ejército" className="hover-stat-icon" style={{ width: 13, height: 13, objectFit: 'contain' }} /> {t('dock.army')}
                              </span>
                            )}
                            {buildingDef.id === 'portal' && (
                              <span className="bld-prod arcano">
                                <img src="/assets/hud_icons/btn_expedition.webp" alt="Expedición" className="hover-stat-icon" style={{ width: 13, height: 13, objectFit: 'contain' }} /> {t('dock.expeditions') || 'Expedición'}
                              </span>
                            )}

                            {buildingDef.id === 'almacen' && (
                              <span className="bld-prod gold">
                                <img src="/assets/hud_icons/btn_inventory.webp" alt="Bóveda" className="hover-stat-icon" style={{ width: 13, height: 13, objectFit: 'contain' }} /> {t('dock.inventory') || 'Bóveda'}
                              </span>
                            )}
                          </div>
                          {isReadyToHarvest && (
                            <div className="bld-hover-harvest-hint">
                              <img src="/assets/hud_icons/icon_gold.webp" alt="Cosechar" className="hover-stat-icon" style={{ width: 13, height: 13, objectFit: 'contain' }} />
                              <span>{t('hud.clickToHarvest')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )
          })
        })()}
        </div>

        {/* Wandering Population NPCs Layer */}
        <CitizensLayer 
          slots={slots}
          fpsMode={fpsMode}
          isSuspended={isSuspended}
          onCitizenGift={(citizen, gift) => {
            triggerFloatingEffect(citizen, gift.text)
            onCitizenGift?.(citizen, gift)
          }} 
        />
        </div>
      )}

      {/* Floating Text Effects Layer (Always on top of all buildings, citizens and scenery) */}
      <div 
        className="gameworld-scene floating-overlay-scene"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${currentScale})`,
          pointerEvents: 'none',
        }}
      >
        <div className="floating-effects-layer">
          {floatingEffects.map((eff) => (
            <div 
              key={eff.id} 
              className="floating-resource-effect"
              style={{ left: `${eff.x}%`, top: `${eff.y}%` }}
            >
              <div className="floating-resource-pill">
                {eff.items && eff.items.length > 0 ? (
                  eff.items.map((it, idx) => (
                    <span key={idx} className="floating-res-pill-item">
                      {it.icon && (
                        <img 
                          src={it.icon} 
                          alt="" 
                          className="floating-res-mini-icon" 
                          draggable="false" 
                        />
                      )}
                      <span className="floating-res-qty">+{it.amount}</span>
                      <span className="floating-res-name">{it.name}</span>
                    </span>
                  ))
                ) : (
                  <span className="floating-res-raw-text">{eff.text}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
