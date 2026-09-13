import React, { useState, useEffect, useRef, useMemo } from 'react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'

/**
 * THE GRAND IMPERIAL AVENUE - MATHEMATICALLY ALIGNED ISOMETRIC DIAGONAL ROUTE
 * 
 * In isometric projection, true paths are DIAGONAL (never flat horizontal or vertical).
 * This dedicated avenue runs in front of all 12 building plots across the lower-left
 * quadrant of the paved plaza (from the West waterfall terrace down to the Southern apex).
 * 
 * NO BUILDINGS ARE EVER CONSTRUCTED ON THIS AVENUE, guaranteeing 100% clear,
 * unobstructed visibility for all citizens.
 */
const ISOMETRIC_AVENUE = [
  { x: 20.0, y: 47.0 }, // p0: West plaza terrace & waterfall gateway
  { x: 27.0, y: 55.0 }, // p1: In front of slot-12
  { x: 34.0, y: 63.0 }, // p2: In front of slot-4
  { x: 41.0, y: 71.0 }, // p3: In front of slot-7
  { x: 48.0, y: 79.0 }, // p4: In front of slot-9
  { x: 53.0, y: 85.0 }, // p5: Southern grand plaza portal / apex
]

// Downhill route: from p0 (West terrace) down to p5 (South portal)
const DOWN_ROUTE = [0, 1, 2, 3, 4, 5]

// Uphill route: from p5 (South portal) up to p0 (West terrace)
const UP_ROUTE = [5, 4, 3, 2, 1, 0]

// Constant, synchronized walking speed for all citizens (~1.76% of map per second)
const WALKING_SPEED = 1.76

// Two parallel lanes with ~31px lateral clearance so walkers pass each other side-by-side without colliding:
const LANE_OFFSET_DOWN = { x: -0.60, y: 0.53 }
const LANE_OFFSET_UP = { x: 0.60, y: -0.53 }

/**
 * Precompute cumulative distance array for a route
 */
function buildRouteData(route, laneOffset) {
  const points = route.map((wpIdx) => ({
    x: ISOMETRIC_AVENUE[wpIdx].x + laneOffset.x,
    y: ISOMETRIC_AVENUE[wpIdx].y + laneOffset.y,
  }))

  const cumDists = [0]
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x
    const dy = (points[i + 1].y - points[i].y) * 1.35 // isometric scaling
    const segLen = Math.sqrt(dx * dx + dy * dy)
    cumDists.push(cumDists[i] + segLen)
  }

  const totalLength = cumDists[cumDists.length - 1]
  return { points, cumDists, totalLength }
}

const ROUTE_DATA_DOWN = buildRouteData(DOWN_ROUTE, LANE_OFFSET_DOWN)
const ROUTE_DATA_UP = buildRouteData(UP_ROUTE, LANE_OFFSET_UP)

/**
 * Total avenue length is ~61.0 units.
 * We calibrate CYCLE_LENGTH to 72.0 units with an organized conveyor pipeline.
 */
const CYCLE_LENGTH = 72.0
const FADE_IN_DIST = 1.8
const FADE_OUT_DIST = 1.8

/**
 * Compute (x, y) coordinates and fade opacity along the route for any cycle distance
 */
function getCitizenVisualState(routeData, cyclePos) {
  const { points, cumDists, totalLength } = routeData
  const posInCycle = ((cyclePos % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH

  // 1. Off the avenue (invisible recycle buffer: totalLength to CYCLE_LENGTH)
  if (posInCycle >= totalLength) {
    const startPos = points[0]
    return {
      x: startPos.x,
      y: startPos.y,
      opacity: 0,
      isVisible: false,
    }
  }

  // 2. On the avenue: calculate exact (x, y) along route
  const dist = posInCycle
  let segIdx = 0
  for (let i = 0; i < cumDists.length - 1; i++) {
    if (dist >= cumDists[i] && dist <= cumDists[i + 1]) {
      segIdx = i
      break
    }
  }

  const pStart = points[segIdx]
  const pEnd = points[segIdx + 1]
  const segLen = cumDists[segIdx + 1] - cumDists[segIdx]
  const t = segLen > 0 ? (dist - cumDists[segIdx]) / segLen : 0

  const x = pStart.x + (pEnd.x - pStart.x) * t
  const y = pStart.y + (pEnd.y - pStart.y) * t

  // Smooth fade-in at the entrance and fade-out at the exit
  let opacity = 1.0
  if (dist < FADE_IN_DIST) {
    opacity = Math.max(0, dist / FADE_IN_DIST)
  } else if (dist > totalLength - FADE_OUT_DIST) {
    opacity = Math.max(0, (totalLength - dist) / FADE_OUT_DIST)
  }

  return {
    x,
    y,
    opacity,
    isVisible: opacity > 0.05,
  }
}

/**
 * Sprite selection and horizontal flip rules:
 * 
 * 1. PARA BAJAR (SE, towards south apex):
 *    All characters face down-right with front sprite (scaleX: 1)
 * 
 * 2. PARA SUBIR (NW, towards west terrace):
 *    - Leñador y Soldado miran naturalmente hacia arriba-izquierda en su sprite back -> scaleX: 1
 *    - Aldeana mira arriba-derecha en su sprite back base -> scaleX: -1 la orienta hacia arriba-izquierda
 */
function getCitizenSpriteProps(type, routeType) {
  if (routeType === 'down') {
    return {
      useBack: false,
      scaleX: 1,
    }
  } else {
    const isNaturalUpLeft = type === 'lumberjack' || type === 'soldado' || type === 'soldier'
    return {
      useBack: true,
      scaleX: isNaturalUpLeft ? 1 : -1,
    }
  }
}

/**
 * Dynamic citizen roster based on kingdom infrastructure:
 * - Lumberjacks DO NOT appear until a House (casa / casa_molino) is built.
 * - Soldiers DO NOT appear until a Barracks (cuartel) is built.
 * - Initial state: exactly 4 Panaderas (aldeanas) walk the avenue so the town is lively.
 */
function getActiveCitizensConfig(hasHouse, hasBarracks) {
  // Case 1: Initial state — No house and no barracks yet
  // Exactly 4 panaderas (aldeanas) total: 2 going down, 2 going up
  if (!hasHouse && !hasBarracks) {
    return [
      // DOWN lane (2 panaderas, spaced by 36 units: 0.0 and 36.0)
      {
        id: 'citizen-baker',
        type: 'aldeana',
        scale: 0.85,
        spriteFront: '/assets/npcs/aldeana_walk_front.webp',
        spriteBack: '/assets/npcs/aldeana_walk_back.webp',
        routeType: 'down',
        cycleOffset: 0.0,
      },
      {
        id: 'citizen-baker-alt',
        type: 'aldeana',
        scale: 0.85,
        spriteFront: '/assets/npcs/aldeana_walk_front.webp',
        spriteBack: '/assets/npcs/aldeana_walk_back.webp',
        routeType: 'down',
        cycleOffset: 36.0,
      },
      // UP lane (2 panaderas, spaced by 36 units: 18.0 and 54.0)
      {
        id: 'citizen-barmaid',
        type: 'aldeana',
        scale: 0.85,
        spriteFront: '/assets/npcs/aldeana_walk_front.webp',
        spriteBack: '/assets/npcs/aldeana_walk_back.webp',
        routeType: 'up',
        cycleOffset: 18.0,
      },
      {
        id: 'citizen-barmaid-alt',
        type: 'aldeana',
        scale: 0.85,
        spriteFront: '/assets/npcs/aldeana_walk_front.webp',
        spriteBack: '/assets/npcs/aldeana_walk_back.webp',
        routeType: 'up',
        cycleOffset: 54.0,
      },
    ]
  }

  // Case 2: House built, but Cuartel not built yet (Lumberjacks + Panaderas)
  if (hasHouse && !hasBarracks) {
    return [
      // DOWN lane (2 panaderas + 1 lumberjack)
      {
        id: 'citizen-baker',
        type: 'aldeana',
        scale: 0.85,
        spriteFront: '/assets/npcs/aldeana_walk_front.webp',
        spriteBack: '/assets/npcs/aldeana_walk_back.webp',
        routeType: 'down',
        cycleOffset: 0.0,
      },
      {
        id: 'citizen-lumberjack',
        type: 'lumberjack',
        scale: 0.85,
        spriteFront: '/assets/npcs/lumberjack_walk_front.webp',
        spriteBack: '/assets/npcs/lumberjack_walk_back.webp',
        routeType: 'down',
        cycleOffset: 24.0,
      },
      {
        id: 'citizen-baker-alt',
        type: 'aldeana',
        scale: 0.85,
        spriteFront: '/assets/npcs/aldeana_walk_front.webp',
        spriteBack: '/assets/npcs/aldeana_walk_back.webp',
        routeType: 'down',
        cycleOffset: 48.0,
      },
      // UP lane (2 panaderas + 1 lumberjack)
      {
        id: 'citizen-barmaid',
        type: 'aldeana',
        scale: 0.85,
        spriteFront: '/assets/npcs/aldeana_walk_front.webp',
        spriteBack: '/assets/npcs/aldeana_walk_back.webp',
        routeType: 'up',
        cycleOffset: 12.0,
      },
      {
        id: 'citizen-forester',
        type: 'lumberjack',
        scale: 0.85,
        spriteFront: '/assets/npcs/lumberjack_walk_front.webp',
        spriteBack: '/assets/npcs/lumberjack_walk_back.webp',
        routeType: 'up',
        cycleOffset: 36.0,
      },
      {
        id: 'citizen-barmaid-alt',
        type: 'aldeana',
        scale: 0.85,
        spriteFront: '/assets/npcs/aldeana_walk_front.webp',
        spriteBack: '/assets/npcs/aldeana_walk_back.webp',
        routeType: 'up',
        cycleOffset: 60.0,
      },
    ]
  }

  // Case 3: Cuartel built, but House not built yet (Soldados + Panaderas)
  if (!hasHouse && hasBarracks) {
    return [
      // DOWN lane (1 soldado + 2 panaderas)
      {
        id: 'citizen-guard',
        type: 'soldado',
        scale: 1.0,
        spriteFront: '/assets/npcs/soldado_walk_front.webp',
        spriteBack: '/assets/npcs/soldado_walk_back.webp',
        routeType: 'down',
        cycleOffset: 0.0,
      },
      {
        id: 'citizen-baker',
        type: 'aldeana',
        scale: 0.85,
        spriteFront: '/assets/npcs/aldeana_walk_front.webp',
        spriteBack: '/assets/npcs/aldeana_walk_back.webp',
        routeType: 'down',
        cycleOffset: 24.0,
      },
      {
        id: 'citizen-baker-alt',
        type: 'aldeana',
        scale: 0.85,
        spriteFront: '/assets/npcs/aldeana_walk_front.webp',
        spriteBack: '/assets/npcs/aldeana_walk_back.webp',
        routeType: 'down',
        cycleOffset: 48.0,
      },
      // UP lane (1 soldado + 2 panaderas)
      {
        id: 'citizen-sergeant',
        type: 'soldado',
        scale: 1.0,
        spriteFront: '/assets/npcs/soldado_walk_front.webp',
        spriteBack: '/assets/npcs/soldado_walk_back.webp',
        routeType: 'up',
        cycleOffset: 12.0,
      },
      {
        id: 'citizen-barmaid',
        type: 'aldeana',
        scale: 0.85,
        spriteFront: '/assets/npcs/aldeana_walk_front.webp',
        spriteBack: '/assets/npcs/aldeana_walk_back.webp',
        routeType: 'up',
        cycleOffset: 36.0,
      },
      {
        id: 'citizen-barmaid-alt',
        type: 'aldeana',
        scale: 0.85,
        spriteFront: '/assets/npcs/aldeana_walk_front.webp',
        spriteBack: '/assets/npcs/aldeana_walk_back.webp',
        routeType: 'up',
        cycleOffset: 60.0,
      },
    ]
  }

  // Case 4: Both House and Cuartel built (Full varied roster)
  return [
    // DOWN lane (1 Soldado, 1 Panadera, 1 Lumberjack)
    {
      id: 'citizen-guard',
      type: 'soldado',
      scale: 1.0,
      spriteFront: '/assets/npcs/soldado_walk_front.webp',
      spriteBack: '/assets/npcs/soldado_walk_back.webp',
      routeType: 'down',
      cycleOffset: 0.0,
    },
    {
      id: 'citizen-baker',
      type: 'aldeana',
      scale: 0.85,
      spriteFront: '/assets/npcs/aldeana_walk_front.webp',
      spriteBack: '/assets/npcs/aldeana_walk_back.webp',
      routeType: 'down',
      cycleOffset: 24.0,
    },
    {
      id: 'citizen-lumberjack',
      type: 'lumberjack',
      scale: 0.85,
      spriteFront: '/assets/npcs/lumberjack_walk_front.webp',
      spriteBack: '/assets/npcs/lumberjack_walk_back.webp',
      routeType: 'down',
      cycleOffset: 48.0,
    },
    // UP lane (1 Soldado, 1 Panadera, 1 Lumberjack)
    {
      id: 'citizen-sergeant',
      type: 'soldado',
      scale: 1.0,
      spriteFront: '/assets/npcs/soldado_walk_front.webp',
      spriteBack: '/assets/npcs/soldado_walk_back.webp',
      routeType: 'up',
      cycleOffset: 12.0,
    },
    {
      id: 'citizen-barmaid',
      type: 'aldeana',
      scale: 0.85,
      spriteFront: '/assets/npcs/aldeana_walk_front.webp',
      spriteBack: '/assets/npcs/aldeana_walk_back.webp',
      routeType: 'up',
      cycleOffset: 36.0,
    },
    {
      id: 'citizen-forester',
      type: 'lumberjack',
      scale: 0.85,
      spriteFront: '/assets/npcs/lumberjack_walk_front.webp',
      spriteBack: '/assets/npcs/lumberjack_walk_back.webp',
      routeType: 'up',
      cycleOffset: 60.0,
    },
  ]
}

export const CitizensLayer = React.memo(function CitizensLayer({ 
  slots = [], 
  onCitizenClick, 
  onCitizenGift, 
  fpsMode = '60fps',
  isSuspended = false,
}) {
  const { t } = useTranslation()

  // Dynamic conditions based on player's kingdom buildings
  const hasHouse = slots?.some((s) => (s.buildingId === 'casa' || s.buildingId === 'casa_molino') && !s.isConstructing)
  const hasBarracks = slots?.some((s) => s.buildingId === 'cuartel' && !s.isConstructing)

  const activeConfig = useMemo(() => getActiveCitizensConfig(hasHouse, hasBarracks), [hasHouse, hasBarracks])
  const activeConfigRef = useRef(activeConfig)
  activeConfigRef.current = activeConfig

  const [activeSpeech, setActiveSpeech] = useState({}) // citizenId -> speech text

  const getCitizenName = (id) => {
    switch (id) {
      case 'citizen-guard': return t('citizens.guardName')
      case 'citizen-sergeant': return t('citizens.sergeantName')
      case 'citizen-baker':
      case 'citizen-baker-alt': return t('citizens.bakerName')
      case 'citizen-barmaid':
      case 'citizen-barmaid-alt': return t('citizens.barmaidName')
      case 'citizen-lumberjack': return t('citizens.lumberjackName')
      case 'citizen-forester': return t('citizens.foresterName')
      default: return t('citizens.bakerName')
    }
  }

  const getCitizenQuotes = (id) => {
    switch (id) {
      case 'citizen-guard':
        return [t('citizens.guardQuote1'), t('citizens.guardQuote2'), t('citizens.guardQuote3')]
      case 'citizen-sergeant':
        return [t('citizens.sergeantQuote1'), t('citizens.sergeantQuote2'), t('citizens.sergeantQuote3')]
      case 'citizen-baker':
      case 'citizen-baker-alt':
        return [t('citizens.bakerQuote1'), t('citizens.bakerQuote2'), t('citizens.bakerQuote3')]
      case 'citizen-barmaid':
      case 'citizen-barmaid-alt':
        return [t('citizens.barmaidQuote1'), t('citizens.barmaidQuote2'), t('citizens.barmaidQuote3')]
      case 'citizen-lumberjack':
        return [t('citizens.lumberjackQuote1'), t('citizens.lumberjackQuote2'), t('citizens.lumberjackQuote3')]
      case 'citizen-forester':
        return [t('citizens.foresterQuote1'), t('citizens.foresterQuote2'), t('citizens.foresterQuote3')]
      default:
        return []
    }
  }

  const citizenDomRefs = useRef({})
  const baseProgressRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const lastRenderTimeRef = useRef(performance.now())
  const rafIdRef = useRef(null)

  useEffect(() => {
    // If city is suspended (e.g. combat / heavy modal open), cancel loop to release 100% CPU/GPU
    if (isSuspended) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      return
    }

    lastTimeRef.current = performance.now()
    lastRenderTimeRef.current = performance.now()

    const handleVisibilityChange = () => {
      lastTimeRef.current = performance.now()
      lastRenderTimeRef.current = performance.now()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    const loop = (now) => {
      rafIdRef.current = requestAnimationFrame(loop)

      if (document.hidden) {
        lastTimeRef.current = now
        lastRenderTimeRef.current = now
        return
      }

      const rawDt = (now - lastTimeRef.current) / 1000
      const dt = Math.min(Math.max(0, rawDt), 0.05)
      lastTimeRef.current = now

      // Advance base progress along the conveyor cycle
      baseProgressRef.current = (baseProgressRef.current + WALKING_SPEED * dt) % CYCLE_LENGTH

      // Throttle direct DOM update according to FPS mode (33ms for eco 30fps, 16ms for 60fps)
      const renderThrottleInterval = fpsMode === 'eco' ? 33 : 16
      if (now - lastRenderTimeRef.current < renderThrottleInterval) {
        return
      }
      lastRenderTimeRef.current = now

      // Direct DOM transformation: Zero React allocations, Zero React re-renders!
      const activeList = activeConfigRef.current
      for (let i = 0; i < activeList.length; i++) {
        const cfg = activeList[i]
        const domEl = citizenDomRefs.current[cfg.id]
        if (!domEl) continue

        const routeData = cfg.routeType === 'down' ? ROUTE_DATA_DOWN : ROUTE_DATA_UP
        const cyclePos = baseProgressRef.current + cfg.cycleOffset
        const visual = getCitizenVisualState(routeData, cyclePos)

        domEl.style.left = `${visual.x}%`
        domEl.style.top = `${visual.y}%`
        domEl.style.opacity = visual.opacity
        domEl.style.zIndex = Math.round(visual.y * 10) + 1
        domEl.style.pointerEvents = visual.isVisible && visual.opacity > 0.3 ? 'auto' : 'none'
      }
    }

    rafIdRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [isSuspended, fpsMode])

  const handleCitizenClick = (e, citizen) => {
    e.stopPropagation()
    soundManager.playClick()

    const quotes = getCitizenQuotes(citizen.id)
    const randomQuote = (quotes && quotes.length > 0 && quotes[Math.floor(Math.random() * quotes.length)]) || ''
    const localizedName = getCitizenName(citizen.id)

    setActiveSpeech((prev) => ({
      ...prev,
      [citizen.id]: randomQuote,
    }))

    setTimeout(() => {
      setActiveSpeech((prev) => {
        if (!prev[citizen.id]) return prev
        const next = { ...prev }
        delete next[citizen.id]
        return next
      })
    }, 3200)

    if (onCitizenClick) {
      onCitizenClick({ ...citizen, name: localizedName })
    }

    if (onCitizenGift && Math.random() < 0.35) {
      const isGem = Math.random() < 0.2
      const gift = isGem 
        ? { type: 'gems', amount: 1, text: t('citizens.giftGem') } 
        : { type: 'gold', amount: 20, text: t('citizens.giftGold') }
      onCitizenGift({ ...citizen, name: localizedName }, gift)
      soundManager.playCollect()
    }
  }

  return (
    <div className="citizens-layer" style={{ pointerEvents: 'none' }}>
      {activeConfig.map((citizen) => {
        const spriteProps = getCitizenSpriteProps(citizen.type, citizen.routeType)
        const spriteHeight = Math.round(56 * (citizen.scale || 1.0))
        const shadowWidth = Math.round(26 * (citizen.scale || 1.0))
        const shadowHeight = Math.round(9 * (citizen.scale || 1.0))
        const spriteSrc = spriteProps.useBack ? citizen.spriteBack : citizen.spriteFront
        const citizenLabel = getCitizenName(citizen.id)
        const speech = activeSpeech[citizen.id]

        return (
          <div
            key={citizen.id}
            ref={(el) => {
              if (el) citizenDomRefs.current[citizen.id] = el
              else delete citizenDomRefs.current[citizen.id]
            }}
            className="citizen-actor"
            style={{
              left: `${ISOMETRIC_AVENUE[0].x}%`,
              top: `${ISOMETRIC_AVENUE[0].y}%`,
              opacity: 0,
              pointerEvents: 'none',
              zIndex: 10,
              transition: 'none',
              willChange: 'left, top, opacity',
            }}
            onClick={(e) => handleCitizenClick(e, citizen)}
            title={citizenLabel}
          >
            {/* Speech Bubble on Click */}
            {speech && (
              <div className="citizen-speech-bubble">
                <span>{speech}</span>
              </div>
            )}

            {/* Ground Shadow pinned under feet */}
            <div 
              className="citizen-ground-shadow" 
              style={{
                width: `${shadowWidth}px`,
                height: `${shadowHeight}px`,
              }}
            />

            {/* Walking Sprite: exactly as requested, never flips mid-path */}
            <img
              src={spriteSrc}
              alt={citizenLabel}
              className="citizen-sprite"
              style={{
                height: `${spriteHeight}px`,
                transform: `scaleX(${spriteProps.scaleX})`,
                pointerEvents: 'auto',
              }}
              draggable="false"
            />
          </div>
        )
      })}
    </div>
  )
})
