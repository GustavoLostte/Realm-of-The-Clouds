import React, { useState, useEffect, useRef, useMemo } from 'react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'

/**
 * THE GRAND RAINBOW BRIDGE IMPERIAL ROUTE - TRUE ISOMETRIC CENTRAL AXIS
 * 
 * Conecta los dos puentes arcoíris del mapa pasando directamente por el centro
 * neurálgico de la Gran Plaza imperial:
 * - Inicio: Escaleras y puente arcoíris de la isla flotante superior-izquierda
 * - Centro: Atraviesa la Gran Plaza imperial por el centro exacto del mapa
 * - Fin: Puente arcoíris y escaleras hacia las nubes inferior-derecha
 */
const ISOMETRIC_AVENUE = [
  { x: 26.0, y: 21.0 }, // p0: Escaleras de la isla flotante superior-izquierda
  { x: 32.0, y: 27.2 }, // p1: Cruce central del puente arcoíris superior-izquierdo
  { x: 36.0, y: 31.5 }, // p2: Portal de entrada a la plaza (entre estatuas)
  { x: 44.5, y: 40.5 }, // p3: Avenida central superior
  { x: 53.0, y: 49.5 }, // p4: Centro neurálgico de la Gran Plaza imperial
  { x: 61.5, y: 58.5 }, // p5: Avenida central inferior
  { x: 70.0, y: 67.5 }, // p6: Portal de salida hacia el puente arcoíris
  { x: 73.5, y: 71.3 }, // p7: Cruce central del puente arcoíris inferior-derecho
  { x: 79.0, y: 77.0 }, // p8: Escaleras y plataforma de nubes inferior-derecha
]

// Ruta hacia abajo: desde el puente arcoíris superior-izquierdo hacia el puente inferior-derecho
const DOWN_ROUTE = [0, 1, 2, 3, 4, 5, 6, 7, 8]

// Ruta hacia arriba: desde el puente arcoíris inferior-derecho hacia el puente superior-izquierdo
const UP_ROUTE = [8, 7, 6, 5, 4, 3, 2, 1, 0]

// Velocidad constante y sincronizada para todos los ciudadanos
const WALKING_SPEED = 2.1

// Dos carriles paralelos con holgura lateral precisa para circular por los puentes arcoíris sin colisionar
const LANE_OFFSET_DOWN = { x: -0.70, y: 0.60 }
const LANE_OFFSET_UP = { x: 0.70, y: -0.60 }

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
 * Longitud total de la ruta entre puentes es ~92.3 unidades.
 * Calibramos CYCLE_LENGTH a 108.0 unidades con buffer suave de reciclaje fuera de pantalla.
 */
const CYCLE_LENGTH = 108.0
const FADE_IN_DIST = 2.5
const FADE_OUT_DIST = 2.5

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
 *    Todos los personajes usan el sprite frontal tal cual está en la imagen (scaleX: 1)
 * 
 * 2. PARA SUBIR (NW, towards west terrace):
 *    Todos los personajes usan el sprite de espalda tal cual está en la imagen (scaleX: 1)
 */
function getCitizenSpriteProps(type, routeType) {
  if (routeType === 'down') {
    return {
      useBack: false,
      scaleX: 1,
    }
  } else {
    return {
      useBack: true,
      scaleX: 1,
    }
  }
}

/**
 * Dynamic citizen roster:
 * - Ángel Chica, Soldado and Worker walk the central avenue between rainbow bridges.
 * - Houses unlock additional kingdom walkers.
 */
function getActiveCitizensConfig(hasHouse) {
  if (!hasHouse) {
    return [
      // DOWN lane (Ángel Chica, Soldado, Worker)
      {
        id: 'citizen-baker',
        type: 'angel_chica',
        scale: 0.85,
        spriteFront: '/assets/npcs/angel_chica_walk_front.webp',
        spriteBack: '/assets/npcs/angel_chica_walk_back.webp',
        routeType: 'down',
        cycleOffset: 0.0,
      },
      {
        id: 'citizen-guard',
        type: 'soldado',
        scale: 0.92,
        spriteFront: '/assets/npcs/soldado_walk_front.webp',
        spriteBack: '/assets/npcs/soldado_walk_back.webp',
        routeType: 'down',
        cycleOffset: 36.0,
      },
      {
        id: 'citizen-worker',
        type: 'worker',
        scale: 0.88,
        spriteFront: '/assets/npcs/worker_walk_front.webp',
        spriteBack: '/assets/npcs/worker_walk_back.webp',
        routeType: 'down',
        cycleOffset: 72.0,
      },
      // UP lane (Soldado, Ángel Chica)
      {
        id: 'citizen-sergeant',
        type: 'soldado',
        scale: 0.92,
        spriteFront: '/assets/npcs/soldado_walk_front.webp',
        spriteBack: '/assets/npcs/soldado_walk_back.webp',
        routeType: 'up',
        cycleOffset: 18.0,
      },
      {
        id: 'citizen-barmaid',
        type: 'angel_chica',
        scale: 0.85,
        spriteFront: '/assets/npcs/angel_chica_walk_front.webp',
        spriteBack: '/assets/npcs/angel_chica_walk_back.webp',
        routeType: 'up',
        cycleOffset: 72.0,
      },
    ]
  }

  // When House is built (Additional walkers join the bustling kingdom):
  return [
    // DOWN lane (Ángel Chica, Soldado, Worker)
    {
      id: 'citizen-baker',
      type: 'angel_chica',
      scale: 0.85,
      spriteFront: '/assets/npcs/angel_chica_walk_front.webp',
      spriteBack: '/assets/npcs/angel_chica_walk_back.webp',
      routeType: 'down',
      cycleOffset: 0.0,
    },
    {
      id: 'citizen-guard',
      type: 'soldado',
      scale: 0.92,
      spriteFront: '/assets/npcs/soldado_walk_front.webp',
      spriteBack: '/assets/npcs/soldado_walk_back.webp',
      routeType: 'down',
      cycleOffset: 36.0,
    },
    {
      id: 'citizen-worker',
      type: 'worker',
      scale: 0.88,
      spriteFront: '/assets/npcs/worker_walk_front.webp',
      spriteBack: '/assets/npcs/worker_walk_back.webp',
      routeType: 'down',
      cycleOffset: 72.0,
    },
    // UP lane (Soldado, Ángel Chica, Soldado Patrulla)
    {
      id: 'citizen-sergeant',
      type: 'soldado',
      scale: 0.92,
      spriteFront: '/assets/npcs/soldado_walk_front.webp',
      spriteBack: '/assets/npcs/soldado_walk_back.webp',
      routeType: 'up',
      cycleOffset: 18.0,
    },
    {
      id: 'citizen-barmaid',
      type: 'angel_chica',
      scale: 0.85,
      spriteFront: '/assets/npcs/angel_chica_walk_front.webp',
      spriteBack: '/assets/npcs/angel_chica_walk_back.webp',
      routeType: 'up',
      cycleOffset: 54.0,
    },
    {
      id: 'citizen-patrol',
      type: 'soldado',
      scale: 0.92,
      spriteFront: '/assets/npcs/soldado_walk_front.webp',
      spriteBack: '/assets/npcs/soldado_walk_back.webp',
      routeType: 'up',
      cycleOffset: 90.0,
    },
  ]
}

/**
 * COMANDANTE DEL CIELO - GUARDIÁN CELESTIAL
 * Estacionado en la esquina este de la plataforma sobre la balaustrada dorada (78.5%, 51.5%),
 * vigilando el reino en estado idle y ejecutando periódicamente (cada 12-18s) su épica animación
 * de acción, además de responder interactivamente al clic del jugador.
 */
const SkyCommander = React.memo(function SkyCommander({
  isSuspended = false,
  onCitizenGift,
}) {
  const { t } = useTranslation()
  const [isPlayingAction, setIsPlayingAction] = useState(false)
  const [actionKey, setActionKey] = useState(0)
  const [speech, setSpeech] = useState(null)
  const actionTimerRef = useRef(null)
  const speechTimerRef = useRef(null)

  const triggerAction = () => {
    if (isPlayingAction) return
    setIsPlayingAction(true)
    setActionKey(Date.now())

    if (actionTimerRef.current) clearTimeout(actionTimerRef.current)
    actionTimerRef.current = setTimeout(() => {
      setIsPlayingAction(false)
    }, 5080) // 127 fotogramas a 40ms = 5080ms
  }

  // Periodic autonomous action every 12 to 18 seconds
  useEffect(() => {
    if (isSuspended) return

    let timer = null
    const scheduleNextAction = () => {
      const delay = 12000 + Math.random() * 6000
      timer = setTimeout(() => {
        if (!document.hidden && !isSuspended) {
          triggerAction()
        }
        scheduleNextAction()
      }, delay)
    }

    scheduleNextAction()

    return () => {
      if (timer) clearTimeout(timer)
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current)
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current)
    }
  }, [isSuspended, isPlayingAction])

  const handleClick = (e) => {
    e.stopPropagation()
    soundManager.playClick()
    triggerAction()

    const quotes = [
      t('citizens.commanderQuote1'),
      t('citizens.commanderQuote2'),
      t('citizens.commanderQuote3'),
    ].filter(Boolean)

    const randomQuote = (quotes.length > 0 && quotes[Math.floor(Math.random() * quotes.length)]) || '¡Por la gloria del Reino Celestial!'
    setSpeech(randomQuote)

    if (speechTimerRef.current) clearTimeout(speechTimerRef.current)
    speechTimerRef.current = setTimeout(() => {
      setSpeech(null)
    }, 3500)

    if (onCitizenGift && Math.random() < 0.40) {
      const isGem = Math.random() < 0.35
      const gift = isGem
        ? { type: 'gems', amount: 2, text: t('citizens.giftGem') }
        : { type: 'gold', amount: 50, text: t('citizens.giftGold') }
      onCitizenGift({ id: 'sky-commander', name: t('citizens.commanderName') || 'Comandante del Cielo' }, gift)
      soundManager.playCollect()
    }
  }

  const commanderName = t('citizens.commanderName') || 'Comandante del Cielo'
  const spriteSrc = isPlayingAction
    ? `/assets/npcs/comandante_action.webp?k=${actionKey}`
    : '/assets/npcs/comandante_idle.webp'

  return (
    <div
      className="citizen-actor commander-actor"
      style={{
        left: '78.5%',
        top: '51.5%',
        opacity: 1,
        pointerEvents: 'auto',
        zIndex: 515,
        transition: 'none',
      }}
      onClick={handleClick}
      title={commanderName}
    >
      {/* Speech Bubble on Click */}
      {speech && (
        <div className="citizen-speech-bubble commander-speech-bubble">
          <span>{speech}</span>
        </div>
      )}

      {/* Sombra de suelo */}
      <div
        className="citizen-ground-shadow commander-ground-shadow"
        style={{
          width: '52px',
          height: '18px',
        }}
      />

      {/* Sprite animado */}
      <img
        key={isPlayingAction ? `action-${actionKey}` : 'idle'}
        src={spriteSrc}
        alt={commanderName}
        className="citizen-sprite commander-sprite"
        style={{
          height: '75px',
          width: '88px',
          objectFit: 'contain',
          transform: 'scaleX(1)',
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
        draggable="false"
      />
    </div>
  )
})

/**
 * SOLDADO VIGÍA (CENTINELA DE LA PLATAFORMA)
 * Estacionado en la esquina del flanco izquierdo de la plataforma:
 * - Esquina Oeste / Balcón de las Cascadas (x: 21.8%, y: 49.8%)
 */
const SENTRY_SPOTS = [
  { id: 'sentry-west-balcony', x: 21.8, y: 49.8 },
]

const SentryGuards = React.memo(function SentryGuards({ onCitizenGift }) {
  const { t } = useTranslation()
  const [activeSpeech, setActiveSpeech] = useState({})
  const timersRef = useRef({})

  const handleClick = (e, sentry) => {
    e.stopPropagation()
    soundManager.playClick()

    const quotes = [
      t('citizens.vigiaQuote1'),
      t('citizens.vigiaQuote2'),
      t('citizens.vigiaQuote3'),
    ].filter(Boolean)

    const randomQuote = (quotes.length > 0 && quotes[Math.floor(Math.random() * quotes.length)]) || '¡Todo despejado en el flanco occidental!'
    setActiveSpeech((prev) => ({ ...prev, [sentry.id]: randomQuote }))

    if (timersRef.current[sentry.id]) clearTimeout(timersRef.current[sentry.id])
    timersRef.current[sentry.id] = setTimeout(() => {
      setActiveSpeech((prev) => {
        const next = { ...prev }
        delete next[sentry.id]
        return next
      })
    }, 3200)

    if (onCitizenGift && Math.random() < 0.35) {
      const isGem = Math.random() < 0.25
      const gift = isGem
        ? { type: 'gems', amount: 1, text: t('citizens.giftGem') }
        : { type: 'gold', amount: 25, text: t('citizens.giftGold') }
      onCitizenGift({ id: sentry.id, name: t('citizens.vigiaName') || 'Soldado Vigía' }, gift)
      soundManager.playCollect()
    }
  }

  const vigiaName = t('citizens.vigiaName') || 'Soldado Vigía'

  return (
    <>
      {SENTRY_SPOTS.map((sentry) => {
        const speech = activeSpeech[sentry.id]
        const zIndex = Math.round(sentry.y * 10)

        return (
          <div
            key={sentry.id}
            className="citizen-actor sentry-actor"
            style={{
              left: `${sentry.x}%`,
              top: `${sentry.y}%`,
              opacity: 1,
              pointerEvents: 'auto',
              zIndex,
              transition: 'none',
            }}
            onClick={(e) => handleClick(e, sentry)}
            title={vigiaName}
          >
            {/* Speech Bubble on Click */}
            {speech && (
              <div className="citizen-speech-bubble sentry-speech-bubble">
                <span>{speech}</span>
              </div>
            )}

            {/* Sombra de suelo bajo los pies (reducida 15%) */}
            <div
              className="citizen-ground-shadow sentry-ground-shadow"
              style={{
                width: '39px',
                height: '12px',
              }}
            />

            {/* Sprite animado de Soldado Vigía (reducido 15%: 56px x 80px) */}
            <img
              src="/assets/npcs/soldado_vigia_idle.webp"
              alt={vigiaName}
              className="citizen-sprite sentry-sprite"
              style={{
                height: '56px',
                width: '80px',
                objectFit: 'contain',
                transform: 'scaleX(1)',
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
              draggable="false"
            />
          </div>
        )
      })}
    </>
  )
})

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
      case 'citizen-guard':
      case 'citizen-patrol': return t('citizens.guardName')
      case 'citizen-sergeant': return t('citizens.sergeantName')
      case 'citizen-baker':
      case 'citizen-baker-alt': return t('citizens.bakerName')
      case 'citizen-barmaid':
      case 'citizen-barmaid-alt': return t('citizens.barmaidName')
      case 'citizen-worker':
      case 'citizen-worker-alt':
      case 'citizen-lumberjack': return t('citizens.workerName')
      case 'citizen-forester': return t('citizens.foresterName')
      default: return t('citizens.workerName') || t('citizens.bakerName')
    }
  }

  const getCitizenQuotes = (id) => {
    switch (id) {
      case 'citizen-guard':
      case 'citizen-patrol':
        return [t('citizens.guardQuote1'), t('citizens.guardQuote2'), t('citizens.guardQuote3')]
      case 'citizen-sergeant':
        return [t('citizens.sergeantQuote1'), t('citizens.sergeantQuote2'), t('citizens.sergeantQuote3')]
      case 'citizen-baker':
      case 'citizen-baker-alt':
        return [t('citizens.bakerQuote1'), t('citizens.bakerQuote2'), t('citizens.bakerQuote3')]
      case 'citizen-barmaid':
      case 'citizen-barmaid-alt':
        return [t('citizens.barmaidQuote1'), t('citizens.barmaidQuote2'), t('citizens.barmaidQuote3')]
      case 'citizen-worker':
      case 'citizen-worker-alt':
      case 'citizen-lumberjack':
        return [t('citizens.workerQuote1'), t('citizens.workerQuote2'), t('citizens.workerQuote3')]
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

      // Throttle direct DOM update ONLY in eco mode (to ~30fps).
      // In 60fps mode, match browser vsync perfectly without 16ms jitter skips!
      if (fpsMode === 'eco') {
        if (now - lastRenderTimeRef.current < 30) {
          return
        }
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

        const newZ = Math.round(visual.y * 10) + 1
        if (domEl._cachedZ !== newZ) {
          domEl._cachedZ = newZ
          domEl.style.zIndex = newZ
        }

        const canPointer = visual.isVisible && visual.opacity > 0.3
        if (domEl._cachedPointer !== canPointer) {
          domEl._cachedPointer = canPointer
          domEl.style.pointerEvents = canPointer ? 'auto' : 'none'
        }
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
      {/* Sky Commander standing in the platform corner */}
      <SkyCommander 
        isSuspended={isSuspended} 
        onCitizenGift={onCitizenGift} 
      />

      {/* Sentry Soldiers stationed at the platform left corners */}
      <SentryGuards 
        onCitizenGift={onCitizenGift} 
      />

      {/* Walking Avenue Citizens */}
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
