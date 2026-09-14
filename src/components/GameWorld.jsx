import React, { useState, useRef, useEffect } from 'react'
import { Plus, Hammer, Eye, EyeOff } from 'lucide-react'
import { BUILDING_TYPES, getMaxProductionBatches, getBuildingDef, getBuildingAnimationDuration } from '../data/buildingsData'
import { soundManager } from '../utils/audio'
import { AnimatedMap } from './AnimatedMap'
import { CitizensLayer } from './CitizensLayer'
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
  ayuntamiento: 4.5,
  castillo: 4.5,
  cuartel: 4.0,
  casa_molino: 3.8,
  archer_tower: 4.0,
  gold_mine: 3.0,
  mina_piedra: 3.0,
  portal: 3.0,
  casa: 2.9,
  molino: 3.2,
  almacen: 3.1,
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
  isSuspended = false,
}) {
  const { t } = useTranslation()
  // Local tick to ensure countdowns, ghost transitions and harvest states re-render smoothly (1s interval, suspended in combat)
  const [, setWorldTick] = useState(0)
  useEffect(() => {
    if (isSuspended) return
    const timer = setInterval(() => setWorldTick((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [isSuspended])
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

  // Cancel any pending RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  const handlePointerDown = (e) => {
    // Si se hace clic en botones o recursos flotantes, no iniciar arrastre
    if (e.target.closest('button, .structure-resource-float, .build-here-btn')) {
      return
    }
    if (e.button === 0 || e.button === 1) {
      isPointerDownRef.current = true
      pointerStartPosRef.current = { x: e.clientX, y: e.clientY }
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    }
  }

  // Dynamic pointer move: 60 FPS (16ms) for fluid dragging on 60Hz/90Hz/120Hz screens,
  // or 30 FPS (33ms) in Eco mode to preserve mobile battery & GPU.
  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current || !pointerStartPosRef.current) return
    const dist = Math.hypot(e.clientX - pointerStartPosRef.current.x, e.clientY - pointerStartPosRef.current.y)
    
    // Solo activar arrastre si se desplaza más de 6px (distingue clic de arrastre)
    if (dist > 6) {
      if (!isDragging) {
        setIsDragging(true)
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
          const elapsed = timestamp - lastPanTimeRef.current
          const targetInterval = fpsMode === 'eco' ? 33 : 16
          // Dynamic interval according to FPS mode
          if (elapsed >= targetInterval) {
            lastPanTimeRef.current = timestamp
            if (pendingPanRef.current) {
              setPan(pendingPanRef.current)
            }
          } else {
            // Re-schedule for remaining time window so drag never skips final touches
            rafIdRef.current = requestAnimationFrame((laterTimestamp) => {
              rafIdRef.current = null
              lastPanTimeRef.current = laterTimestamp
              if (pendingPanRef.current) {
                setPan(pendingPanRef.current)
              }
            })
          }
        })
      }
    }
  }

  const handlePointerUp = (e) => {
    isPointerDownRef.current = false
    pointerStartPosRef.current = null
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

  // Listener no pasivo para zoom con rueda del ratón y desplazamiento con trackpad
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleWheel = (e) => {
      e.preventDefault()
      if (e.ctrlKey) {
        // Gesto Pinch-to-zoom en Mac trackpad o Ctrl+Wheel
        const zoomDelta = e.deltaY * -0.01
        setZoom((prev) => Math.min(Math.max(1.0, prev + zoomDelta), 2.5))
      } else if (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0) {
        // Si es rueda física normal (deltaX nulo y deltaY considerable) -> zoom suave
        if (Math.abs(e.deltaX) === 0 && Math.abs(e.deltaY) >= 40) {
          const zoomDelta = e.deltaY * -0.0012
          setZoom((prev) => Math.min(Math.max(1.0, prev + zoomDelta), 2.5))
        } else {
          // Desplazamiento fluido con 2 dedos en trackpad
          setPan((prev) => ({
            x: Math.max(-maxPanX, Math.min(maxPanX, prev.x - e.deltaX)),
            y: Math.max(-maxPanY, Math.min(maxPanY, prev.y - e.deltaY))
          }))
        }
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
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

  return (
    <div 
      className={`gameworld-container ${isDragging ? 'is-dragging' : ''}`}
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
              className="map-ctrl-btn candy-map-btn" 
              onClick={() => { setZoom(z => Math.min(z + 0.2, 2.5)); soundManager.playClick() }}
              title="Acercar mapa (+)"
            >
              <img src="/assets/hud_icons/btn_zoom_in.webp" alt="Zoom In" className="hud-ctrl-candy" draggable="false" />
            </button>
            <button 
              className="map-ctrl-btn candy-map-btn" 
              onClick={() => { setZoom(z => Math.max(z - 0.2, 1.0)); soundManager.playClick() }}
              title="Alejar mapa (-)"
            >
              <img src="/assets/hud_icons/btn_zoom_out.webp" alt="Zoom Out" className="hud-ctrl-candy" draggable="false" />
            </button>
            <button 
              className="map-ctrl-btn candy-map-btn" 
              onClick={resetView}
              title="Ajustar a ventana (Modo Cover)"
            >
              <img src="/assets/hud_icons/btn_expedition.webp" alt="Centrar" className="hud-ctrl-candy" draggable="false" />
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
          {isCinematicMode ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Interactive World Map Canvas Container */}
      <div 
        className="gameworld-scene"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${currentScale})`,
        }}
      >
        {/* Animated Island Map */}
        <AnimatedMap className="island-background" />

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
                  {/* Empty Slot Footprint */}
                  {/* Empty Slot Footprint - removed per user request */}
                  {!slot.buildingId && null}

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
                      {/* Animated construction overlay — loops for the whole duration */}
                      {buildingDef.animConstruct && (
                        <img 
                          key={`${slot.id}-construct-anim`}
                          src={buildingDef.animConstruct}
                          alt="Construcción en progreso" 
                          className={`building-sprite animated-construct construct-overlay sprite-${slot.buildingId}`}
                          draggable="false"
                        />
                      )}
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

                      {/* Building Sprite Image */}
                      <img 
                        key={`${slot.id}-active`}
                        src={buildingDef.animIdle || buildingDef.image} 
                        alt={localizedBldName} 
                        className={`building-sprite active-building ${buildingDef.animIdle ? 'animated-idle' : ''} sprite-${slot.buildingId}`}
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

        {/* Floating Text Effects Layer (Always on top of all buildings, citizens and scenery) */}
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
